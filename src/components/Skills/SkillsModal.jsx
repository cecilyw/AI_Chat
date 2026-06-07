import React, { useState, useEffect, useCallback } from 'react';
import { skillService, skillStorage } from '../../services/skillService';
import SkillCard from './SkillCard';
import SkillEditor from './SkillEditor';
import './SkillsModal.css';

/**
 * 技能管理弹窗
 */
const SkillsModal = ({ isOpen, onClose }) => {
  const [skills, setSkills] = useState([]);
  const [filteredSkills, setFilteredSkills] = useState([]);
  const [editingSkill, setEditingSkill] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // 初始化
  const initialize = useCallback(async () => {
    if (!isOpen) return;

    try {
      await skillService.initialize();
      const allSkills = await skillService.getAllSkills();
      setSkills(allSkills);
      setFilteredSkills(allSkills);
    } catch (error) {
      console.error('初始化失败:', error);
    } finally {
      setLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // 搜索和筛选
  useEffect(() => {
    let filtered = skills;

    // 根据搜索词筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(skill =>
        skill.name.toLowerCase().includes(query) ||
        skill.description.toLowerCase().includes(query)
      );
    }

    setFilteredSkills(filtered);
  }, [skills, searchQuery]);

  // 保存技能
  const handleSaveSkill = async (skillData) => {
    try {
      setLoading(true);

      // 使用 isNew 标记判断是新建还是更新
      if (skillData.isNew) {
        // 创建新技能
        await skillService.createSkill(skillData);
      } else {
        // 更新技能
        await skillService.updateSkill(skillData.id, skillData);
      }

      // 重新加载技能列表
      await reloadSkills();
      setEditingSkill(null);
    } catch (error) {
      console.error('保存技能失败:', error);
      alert('保存技能失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 删除技能
  const handleDeleteSkill = async (skillId) => {
    try {
      await skillService.deleteSkill(skillId);
      await reloadSkills();
    } catch (error) {
      console.error('删除技能失败:', error);
      alert('删除技能失败: ' + error.message);
    }
  };

  // 导入技能
  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        setLoading(true);
        const text = await file.text();
        const imported = await skillStorage.importSkills(text);

        if (imported.length > 0) {
          alert(`成功导入 ${imported.length} 个技能`);
        } else {
          alert('没有导入新技能（可能已存在）');
        }

        await reloadSkills();
      } catch (error) {
        console.error('导入技能失败:', error);
        alert('导入技能失败: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    input.click();
  };

  // 导出技能
  const handleExport = async () => {
    try {
      const exportData = await skillService.exportSkills();

      // 创建下载链接
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `skills_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      alert('技能配置已导出');
    } catch (error) {
      console.error('导出技能失败:', error);
      alert('导出技能失败: ' + error.message);
    }
  };

  // 重新加载技能列表
  const reloadSkills = async () => {
    try {
      const allSkills = await skillService.getAllSkills();
      setSkills(allSkills);
      setFilteredSkills(allSkills);
    } catch (error) {
      console.error('重新加载失败:', error);
    }
  };

  // 创建示例技能（翻译官）
  const createExampleSkill = () => {
    const exampleSkill = {
      name: '翻译官',
      description: '专业的多语言翻译助手，支持中英日韩等语言的互译',
      content: `## 角色定义
你是一位专业的翻译大师，精通多种语言的互译。

## 技能说明
1. 准确翻译用户提供的文本
2. 保持原文的语气、风格和情感
3. 对于口语表达，选择自然流畅的目标语言表达
4. 对于专业术语，确保翻译准确，必要时保留原文

## 输出格式
请严格按照以下格式输出翻译结果：
- 原文：[原文内容]
- 源语言：[语言名称]
- 目标语言：[语言名称]
- 翻译：[翻译结果]

## 使用示例
用户输入：请把"今天天气真好"翻译成英语
你的输出：
- 原文：今天天气真好
- 源语言：中文
- 目标语言：英语
- 翻译：The weather is really nice today`,
      keywords: ['翻译', '翻译成', '把', 'translate', '中译', '英译'],
    };
    setEditingSkill(exampleSkill);
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog skills-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>技能管理</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* 技能编辑器 */}
        {editingSkill ? (
          <SkillEditor
            skill={editingSkill}
            onSave={handleSaveSkill}
            onCancel={() => setEditingSkill(null)}
          />
        ) : (
          <div className="dialog-content skills-content">
            {/* 顶部工具栏 */}
            <div className="skills-toolbar">
              <div className="skills-search">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="搜索技能..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              {/* 操作栏 */}
              <div className="skills-actions">
                <button
                  className="primary-btn"
                  onClick={() => setEditingSkill({})}
                  disabled={loading}
                >
                  + 新建
                </button>
                <button
                  className="secondary-btn"
                  onClick={createExampleSkill}
                  disabled={loading}
                >
                  示例
                </button>
                <button
                  className="secondary-btn"
                  onClick={handleImport}
                  disabled={loading}
                >
                  导入
                </button>
                <button
                  className="secondary-btn"
                  onClick={handleExport}
                  disabled={loading}
                >
                  导出
                </button>
              </div>
            </div>

              {/* 技能列表 */}
              {loading ? (
                <div className="loading">
                  <div className="loading-spinner"></div>
                  <p>加载中...</p>
                </div>
              ) : filteredSkills.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <h3>
                    {searchQuery ? '没有找到技能' : '还没有技能'}
                  </h3>
                  <p>
                    {searchQuery
                      ? '尝试调整搜索条件'
                      : '点击"新建技能"开始创建你的第一个技能'}
                  </p>
                  <button
                    className="primary-btn"
                    onClick={() => setEditingSkill({})}
                  >
                    创建技能
                  </button>
                </div>
              ) : (
                <div className="skills-list">
                  {filteredSkills.map(skill => (
                    <SkillCard
                      key={skill.id}
                      skill={skill}
                      onEdit={(skill) => setEditingSkill(skill)}
                      onDelete={handleDeleteSkill}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
      </div>
    </div>
  );
};

export default SkillsModal;