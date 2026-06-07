import React, { useState, useEffect } from 'react';
import { Skill } from '../../models/Skill';
import { skillService } from '../../services/skillService';
import './SkillEditor.css';

const SkillEditor = ({ skill: propSkill, skillId, onSave, onCancel }) => {
  // 根据 skillId 获取技能数据
  const [skill, setSkill] = useState(propSkill || null);

  useEffect(() => {
    const loadSkill = async () => {
      if (skillId && !skill) {
        try {
          const skillData = await skillService.getSkillById(skillId);
          setSkill(skillData);
        } catch (error) {
          console.error('加载技能失败:', error);
          alert('加载技能失败，请检查技能ID是否正确');
        }
      }
    };

    loadSkill();
  }, [skillId, skill]);

  // 如果正在加载技能，显示加载状态
  if (skillId && !skill) {
    return (
      <div className="loading-editor">
        <div className="loading-spinner" />
        <p>加载技能中...</p>
      </div>
    );
  }

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    keywords: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (skill) {
      setFormData({
        name: skill.name || '',
        description: skill.description || '',
        content: skill.content || '',
        keywords: (skill.keywords || []).join(', ')
      });
    } else {
      setFormData({
        name: '',
        description: '',
        content: '## 使用指引\n[给 AI 的分步骤行为指引]\n\n## 示例\n[该 Skill 的具体使用示例]',
        keywords: ''
      });
    }
  }, [skill]);

  // 验证表单
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '技能名称不能为空';
    }

    if (!formData.description.trim()) {
      newErrors.description = '技能描述不能为空';
    }

    if (!formData.content.trim()) {
      newErrors.content = '技能内容不能为空';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理保存
  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const keywordsArray = formData.keywords
      ? formData.keywords.split(',').map(k => k.trim()).filter(k => k)
      : [];

    const isNew = !skill || !skill.id;

    const skillData = {
      name: formData.name,
      description: formData.description,
      content: formData.content,
      keywords: keywordsArray,
      id: skill && skill.id ? skill.id : undefined,
      createdAt: skill && skill.createdAt ? skill.createdAt : undefined,
      usageCount: skill && skill.usageCount ? skill.usageCount : 0,
      isNew: isNew
    };

    const skillObj = new Skill(skillData);
    const skillObject = skillObj.toObject();
    skillObject.isNew = isNew;
    onSave(skillObject);
  };

  return (
    <div className="skill-editor-modal">
      {/* 头部 */}
      <div className="editor-header">
        <div className="header-left">
          <button className="header-back-btn" onClick={onCancel} title="返回">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <h3 className="editor-title">
            {skill && skill.id ? '编辑技能' : (skill ? '从示例创建' : '新建技能')}
          </h3>
        </div>
        <div className="header-actions">
          <button onClick={onCancel} className="editor-btn editor-btn-secondary">取消</button>
          <button
            onClick={handleSave}
            className="editor-btn editor-btn-primary"
            disabled={!formData.name || !formData.description || !formData.content}
          >
            保存技能
          </button>
        </div>
      </div>

      {/* 表单内容 */}
      <div className="editor-body">
        <div className="editor-form">
          <div className="form-section">
            <div className="form-group">
              <label className="form-label">
                技能名称 <span className="required">*</span>
              </label>
              <input
                type="text"
                className={`form-input ${errors.name ? 'has-error' : ''}`}
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="请输入技能名称"
              />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">
                技能描述 <span className="required">*</span>
              </label>
              <textarea
                className={`form-textarea form-textarea--sm ${errors.description ? 'has-error' : ''}`}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                placeholder="一句话描述该 Skill 的功能和使用场景"
              />
              {errors.description && <div className="form-error">{errors.description}</div>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              技能内容 <span className="required">*</span>
            </label>
            <textarea
              className={`form-textarea form-textarea--lg ${errors.content ? 'has-error' : ''}`}
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="## 使用指引&#10;[给 AI 的分步骤行为指引]&#10;&#10;## 示例&#10;[该 Skill 的具体使用示例]"
            />
            {errors.content && <div className="form-error">{errors.content}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">触发关键词</label>
            <input
              type="text"
              className="form-input"
              value={formData.keywords}
              onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
              placeholder="翻译, translate, 翻译成"
            />
            <p className="form-hint">多个关键词用逗号分隔，用户输入匹配时将自动触发该技能</p>
          </div>
        </div>

        <div className="editor-footer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          <span>支持 Markdown 格式，将导出为标准 SKILL.md 文件</span>
        </div>
      </div>
    </div>
  );
};

export default SkillEditor;