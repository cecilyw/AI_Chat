"""SLA check script — called by sla-check.yml workflow."""
import os, json, yaml, subprocess
from datetime import datetime, timezone

repo = os.environ['REPO']
now = datetime.now(timezone.utc)

# ---- 1. Load routing config ----
with open('.github/issue-routing.yml', 'r', encoding='utf-8') as f:
    config = yaml.safe_load(f)

product_by_label = {}
for key, prod in config['products'].items():
    product_by_label[prod['label']] = (key, prod)

# ---- 2. Get all open issues with product labels ----
result = subprocess.run(
    ['gh', 'issue', 'list', '--repo', repo, '--state', 'open',
     '--json', 'number,title,updatedAt,labels',
     '--limit', '200'],
    check=True, capture_output=True, text=True
)
issues = json.loads(result.stdout)
print(f"Total open issues: {len(issues)}")

bot_login = 'github-actions[bot]'

for issue in issues:
    labels = [l['name'] for l in issue['labels']]
    product_label = next((l for l in labels if l.startswith('product/')), None)
    if not product_label:
        continue

    matched = product_by_label.get(product_label)
    if not matched:
        continue

    matched_key, prod = matched
    issue_number = issue['number']

    # Calculate hours since last update
    updated = datetime.fromisoformat(issue['updatedAt'].replace('Z', '+00:00'))
    hours_since_update = (now - updated).total_seconds() / 3600

    # Use severity-based SLA: critical=24h, otherwise use routing config (default 48h)
    if 'severity/critical' in labels:
        sla_hours = 24
    else:
        sla_hours = prod['sla']['first_response_hours']

    if hours_since_update < sla_hours:
        continue

    overdue_hours = hours_since_update - sla_hours
    print(f"#{issue_number} [{prod['name']}] overdue: {overdue_hours:.0f}h")

    # ---- 3. Get recent comments ----
    comments_raw = subprocess.run(
        ['gh', 'api', f'repos/{repo}/issues/{issue_number}/comments',
         '--jq', '.[-5:] | .[] | {login: .user.login, created_at: .created_at}'],
        check=True, capture_output=True, text=True
    ).stdout.strip()

    bot_warnings = []
    if comments_raw:
        for line in comments_raw.split('\n'):
            try:
                c = json.loads(line)
                if c['login'] == bot_login:
                    bot_warnings.append(c)
            except (json.JSONDecodeError, KeyError):
                pass

    m = prod['maintainer']
    esc = prod['escalation']

    if not bot_warnings:
        # L1: First warning
        comment = (
            f"⚠️ **SLA 超时告警 — Issue #{issue_number}**\n\n"
            "| 项目 | 内容 |\n"
            "|------|------|\n"
            f"| 产品线 | {prod['name']} |\n"
            f"| 距上次响应 | **{hours_since_update:.0f}h** |\n"
            f"| SLA 要求 | {sla_hours}h 内首次响应 |\n"
            f"| 当前状态 | ⚠️ 已超时 **{overdue_hours:.0f}h** |\n\n"
            f"@{m['github']} 请尽快响应，给出排查方向或确认接收。\n\n"
            f"如 24h 内仍无响应，将升级至 @{esc['manager_github']}（{esc['manager_name']}）。"
        )
        subprocess.run(['gh', 'issue', 'comment', str(issue_number), '--body', comment, '--repo', repo], check=True)
        subprocess.run(['gh', 'issue', 'edit', str(issue_number), '--add-label', 'status/escalated-l1', '--repo', repo], check=True)
        print(f"  -> L1 warning posted")

    elif 'status/escalated-l2' in labels:
        last_warning = bot_warnings[-1]
        last_warn_time = datetime.fromisoformat(last_warning['created_at'].replace('Z', '+00:00'))
        hours_since_warn = (now - last_warn_time).total_seconds() / 3600
        if hours_since_warn > 24:
            comment = (
                f"🔴 **SLA 严重告警 — Issue #{issue_number}**\n\n"
                "| 项目 | 内容 |\n"
                "|------|------|\n"
                f"| 产品线 | {prod['name']} |\n"
                f"| 超时 | {overdue_hours:.0f}h |\n"
                f"| 状态 | 已升级 L1、L2，均无响应 |\n\n"
                f"**需项目组人工介入。** 请联系 {esc['manager_name']} 并评估是否执行降权/下架。"
            )
            subprocess.run(['gh', 'issue', 'comment', str(issue_number), '--body', comment, '--repo', repo], check=True)
            subprocess.run(['gh', 'issue', 'edit', str(issue_number), '--add-label', 'status/escalated', '--repo', repo], check=True)
            print(f"  -> L3 escalation posted")

    elif 'status/escalated-l1' in labels:
        last_warning = bot_warnings[-1]
        last_warn_time = datetime.fromisoformat(last_warning['created_at'].replace('Z', '+00:00'))
        hours_since_warn = (now - last_warn_time).total_seconds() / 3600
        if hours_since_warn > 24:
            comment = (
                f"🟠 **SLA 二次告警 — Issue #{issue_number}**\n\n"
                "| 项目 | 内容 |\n"
                "|------|------|\n"
                f"| 产品线 | {prod['name']} |\n"
                f"| 距首次告警 | {hours_since_warn:.0f}h |\n"
                f"| SLA 要求 | {sla_hours}h 内首次响应 |\n\n"
                f"@{esc['manager_github']}（{esc['manager_name']}）您好，此 Issue 已超 SLA 且 L1 告警后 24h 仍无响应，请推动处理。"
            )
            subprocess.run(['gh', 'issue', 'comment', str(issue_number), '--body', comment, '--repo', repo], check=True)
            subprocess.run(['gh', 'issue', 'edit', str(issue_number), '--add-label', 'status/escalated-l2', '--repo', repo], check=True)
            print(f"  -> L2 escalation posted")
    else:
        print(f"  -> Already warned (L1), waiting for next check window")

print("SLA check complete!")
