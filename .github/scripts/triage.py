"""Issue triage script — called by issue-triage.yml workflow."""
import os, re, yaml, subprocess, sys

body = os.environ['ISSUE_BODY']
title = os.environ['ISSUE_TITLE']
issue_number = os.environ['ISSUE_NUMBER']
repo = os.environ['REPO']

# ---- 1. Parse product from issue form ----
match = re.search(r'###\s*产品线\s*\n+\s*(.+?)\s*\n+\s*###', body, re.DOTALL)
if not match:
    match = re.search(r'###\s*产品线\s*\n+\s*(.+?)\s*$', body, re.DOTALL)

selected = match.group(1).strip() if match else None
if not selected:
    print("ERROR: Could not parse product from issue body")
    print(f"Body:\n{body}")
    sys.exit(1)
print(f"Product selected: {selected}")

# ---- 2. Match against routing config ----
with open('.github/issue-routing.yml', 'r', encoding='utf-8') as f:
    config = yaml.safe_load(f)

matched_key, matched = None, None
for key, prod in config['products'].items():
    if prod.get('form_label') == selected:
        matched_key, matched = key, prod
        break

if not matched:
    print(f"WARN: No routing match for '{selected}', defaulting to 'other'")
    matched_key, matched = 'other', config['products']['other']

print(f"Routed to: {matched_key} -> {matched['name']}")

# ---- 3. Ensure labels exist, then add to issue ----
labels = [matched['label'], 'status/new']

# Create labels first (ignore error if already exists)
for lbl in labels:
    r = subprocess.run(
        ['gh', 'label', 'create', lbl, '--repo', repo],
        check=False, capture_output=True, text=True
    )
    if r.returncode != 0:
        if 'already exists' in r.stderr:
            print(f"Label already exists: {lbl}")
        else:
            print(f"Label create error ({lbl}): {r.stderr}")
    else:
        print(f"Label created: {lbl}")

cmd = ['gh', 'issue', 'edit', issue_number, '--repo', repo]
for lbl in labels:
    cmd += ['--add-label', lbl]
subprocess.run(cmd, check=True)
print(f"Labels added to issue: {labels}")

# ---- 4. Post comment @maintainer ----
m = matched['maintainer']
sla = matched['sla']

comment = (
    f"@{m['github']} 您好，收到一个新 Issue：\n\n"
    "| 项目 | 内容 |\n"
    "|------|------|\n"
    f"| Issue 编号 | #{issue_number} |\n"
    f"| 产品线 | {matched['name']} |\n"
    f"| 标题 | {title} |\n"
    f"| SLA 首次响应 | **{sla['first_response_hours']}h** 内 |\n\n"
    f"请在 **{sla['first_response_hours']}h 内** 给出排查方向或确认接收。如有疑问请在评论区沟通。"
)

subprocess.run(
    ['gh', 'issue', 'comment', issue_number, '--body', comment, '--repo', repo],
    check=True
)
print("Comment posted. Triage complete!")
