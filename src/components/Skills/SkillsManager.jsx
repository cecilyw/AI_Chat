import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { navigateTo } from '../../routes';
import { skillService, skillStorage } from '../../services/skillService';
import SkillCard from './SkillCard';
import SkillEditor from './SkillEditor';
import './SkillsManager.css';

const SkillsManager = () => {
  console.log('SkillsManager 组件渲染');
  const navigate = useNavigate();

  // 状态管理
  const [skills, setSkills] = useState([]);
  const [filteredSkills, setFilteredSkills] = useState([]);
  const [editingSkill, setEditingSkill] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState('');

  // 预定义分类
  const categories = [
    '写作', '编程', '分析', '翻译', '总结',
    '创意', '学习', '办公', '生活', '娱乐'
  ];

  // 初始化
  const initialize = useCallback(async () => {
    try {
      await skillService.initialize();
      const allSkills = await skillService.getAllSkills();
      setSkills(allSkills);
      setFilteredSkills(allSkills);

      // 获取统计信息
      const stats = await skillStorage.getStorageStats();
      setStats(stats);
    } catch (error) {
      console.error('初始化失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // 搜索和筛选
  useEffect(() => {
    let filtered = skills;

    // 根据标签筛选
    if (activeTab === 'favorites') {
      filtered = skills.filter(skill => skill.isFavorite);
    }

    // 根据搜索词筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(skill =>
        skill.name.toLowerCase().includes(query) ||
        skill.description.toLowerCase().includes(query) ||
        skill.category.toLowerCase().includes(query) ||
        skill.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredSkills(filtered);
  }, [skills, searchQuery, activeTab]);

  // 保存技能
  const handleSaveSkill = async (skillData) => {
    try {
      setLoading(true);

      if (skillData.id) {
        // 更新技能
        await skillService.updateSkill(skillData.id, skillData);
      } else {
        // 创建新技能
        await skillService.createSkill(skillData);
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

      // 重新加载技能列表
      await reloadSkills();
    } catch (error) {
      console.error('删除技能失败:', error);
      alert('删除技能失败: ' + error.message);
    }
  };

  // 切换收藏状态
  const handleToggleFavorite = async (skillId) => {
    try {
      await skillService.toggleFavorite(skillId);

      // 重新加载技能列表
      const allSkills = await skillService.getAllSkills();
      setSkills(allSkills);
    } catch (error) {
      console.error('切换收藏失败:', error);
      alert('操作失败: ' + error.message);
    }
  };

  // 导入技能
  const handleImport = async () => {
    if (!importData.trim()) {
      alert('请输入要导入的技能数据');
      return;
    }

    try {
      setLoading(true);
      const imported = await skillService.importSkills(importData);

      if (imported.length > 0) {
        alert(`成功导入 ${imported.length} 个技能`);
      } else {
        alert('没有导入新技能（可能已存在）');
      }

      // 重新加载技能列表
      await reloadSkills();

      setShowImportDialog(false);
      setImportData('');
    } catch (error) {
      console.error('导入技能失败:', error);
      alert('导入技能失败: ' + error.message);
    } finally {
      setLoading(false);
    }
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

  // 批量删除
  const handleBatchDelete = async (skillIds) => {
    if (!window.confirm(`确定要删除选中的 ${skillIds.length} 个技能吗？`)) {
      return;
    }

    try {
      setLoading(true);
      await skillService.deleteSkills(skillIds);

      // 重新加载技能列表
      await reloadSkills();
    } catch (error) {
      console.error('批量删除失败:', error);
      alert('批量删除失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 重新加载技能列表
  const reloadSkills = async () => {
    try {
      const allSkills = await skillService.getAllSkills();
      setSkills(allSkills);

      // 获取统计信息
      const stats = await skillStorage.getStorageStats();
      setStats(stats);
    } catch (error) {
      console.error('重新加载失败:', error);
    }
  };

  // 快速创建示例技能
  const createExampleSkill = () => {
    const exampleSkill = {
      name: '代码审查助手',
      description: '帮助审查代码并提供改进建议',
      category: '编程',
      tags: ['代码', '审查', '优化'],
      template: {
        systemPrompt: '你是一个资深的软件工程师，请对以下代码进行专业的审查',
        userPrompt: '请审查以下代码并提供改进建议：\n```{{code}}```',
        parameters: [
          {
            key: 'code',
            type: 'text',
            label: '代码',
            required: true,
            defaultValue: ''
          }
        ]
      },
      outputFormat: 'markdown'
    };
    setEditingSkill(exampleSkill);
  };

  return (
    <div className="skills-manager">
      {/* 头部 */}
      <div className="skills-header">
        <div className="header-left">
          <button
            className="back-btn"
            onClick={() => navigateTo('/')}
            title="返回主界面"
          >
            ←
          </button>
          <h1>技能管理</h1>
        </div>
        {stats && (
          <div className="skills-stats">
            <span>总计: {stats.totalSkills}</span>
            <span>收藏: {stats.favoriteSkills}</span>
            <span>总使用: {stats.totalUsage}</span>
          </div>
        )}
      </div>

      {/* 搜索和筛选 */}
      <div className="skills-search">
        <div className="search-input">
          <input
            type="text"
            placeholder="搜索技能..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="skills-tabs">
          <button
            className={activeTab === 'all' ? 'active' : ''}
            onClick={() => setActiveTab('all')}
          >
            全部技能
            {skills.length > 0 && ` (${skills.length})`}
          </button>
          <button
            className={activeTab === 'favorites' ? 'active' : ''}
            onClick={() => setActiveTab('favorites')}
          >
            收藏技能
            {stats && ` (${stats.favoriteSkills})`}
          </button>
        </div>
      </div>

      {/* 操作栏 */}
      <div className="skills-actions">
        <button
          className="primary-btn"
          onClick={() => setEditingSkill({})}
          disabled={loading}
        >
          + 新建技能
        </button>
        <button
          className="secondary-btn"
          onClick={createExampleSkill}
          disabled={loading}
        >
          示例技能
        </button>
        <button
          className="secondary-btn"
          onClick={() => setShowImportDialog(true)}
          disabled={loading}
        >
          导入技能
        </button>
        <button
          className="secondary-btn"
          onClick={handleExport}
          disabled={loading}
        >
          导出技能
        </button>
        {stats && stats.totalSkills > 0 && (
          <button
            className="danger-btn"
            onClick={() => handleBatchDelete(skills.map(s => s.id))}
            disabled={loading}
          >
            清空全部
          </button>
        )}
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
            {searchQuery || activeTab === 'favorites' ? '没有找到技能' : '还没有技能'}
          </h3>
          <p>
            {searchQuery || activeTab === 'favorites'
              ? '尝试调整搜索条件或切换到全部技能标签页'
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
        <div className="skills-grid">
          {filteredSkills.map(skill => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onEdit={(skill) => setEditingSkill(skill)}
              onDelete={handleDeleteSkill}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}

      {/* 技能编辑器 */}
      {editingSkill && (
        <SkillEditor
          skill={editingSkill}
          categories={categories}
          onSave={handleSaveSkill}
          onCancel={() => setEditingSkill(null)}
        />
      )}

      {/* 导入对话框 */}
      {showImportDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div className="dialog-header">
              <h3>导入技能配置</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowImportDialog(false);
                  setImportData('');
                }}
              >
                ×
              </button>
            </div>
            <div className="dialog-content">
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                rows={10}
                placeholder="粘贴技能配置 JSON 数据..."
              />
            </div>
            <div className="dialog-actions">
              <button
                className="secondary-btn"
                onClick={() => {
                  setShowImportDialog(false);
                  setImportData('');
                }}
              >
                取消
              </button>
              <button
                className="primary-btn"
                onClick={handleImport}
                disabled={!importData.trim()}
              >
                导入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillsManager;