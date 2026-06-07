import React, { useState, useEffect } from 'react';
import { Skill } from '../../models/Skill';
import { skillService } from '../../services/skillService';
import { navigateTo } from '../../routes';
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
        <div className="loading-spinner"></div>
        <p>加载技能中...</p>
      </div>
    );
  }

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (skill && skill.id) {
      // 编辑现有技能
      setFormData({
        name: skill.name,
        description: skill.description,
        content: skill.content
      });
    } else {
      // 创建新技能，设置默认值
      setFormData({
        name: '',
        description: '',
        content: '## 使用指引\n[给 AI 的分步骤行为指引]\n\n## 示例\n[该 Skill 的具体使用示例]'
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

    const skillData = {
      ...formData,
      id: skill ? skill.id : undefined,
      createdAt: skill ? skill.createdAt : undefined,
      usageCount: skill ? skill.usageCount : 0
    };

    const skillObj = new Skill(skillData);
    onSave(skillObj.toObject());
  };

  return (
    <div className="skill-editor">
      <div className="editor-header">
        <div className="header-left">
          <button
            className="back-btn"
            onClick={() => navigateTo('/skills')}
            title="返回技能列表"
          >
            ←
          </button>
          <h2>{skill && skill.id ? '编辑技能' : '新建技能'}</h2>
        </div>
        <div className="editor-actions">
          <button onClick={onCancel} className="cancel-btn">取消</button>
          <button onClick={handleSave} className="save-btn" disabled={!formData.name || !formData.description || !formData.content}>
            保存技能
          </button>
        </div>
      </div>

      <div className="editor-content">
        <div className="form-group">
          <label>技能名称 *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className={errors.name ? 'error' : ''}
            placeholder="请输入技能名称"
          />
          {errors.name && <div className="error-message">{errors.name}</div>}
        </div>

        <div className="form-group">
          <label>技能描述 *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className={errors.description ? 'error' : ''}
            placeholder="一句话描述该 Skill 的功能和使用场景"
          />
          {errors.description && <div className="error-message">{errors.description}</div>}
        </div>

        <div className="form-group">
          <label>内容 *</label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            rows={15}
            className={errors.content ? 'error' : ''}
            placeholder="## 使用指引\n[给 AI 的分步骤行为指引]\n\n## 示例\n[该 Skill 的具体使用示例]"
          />
          {errors.content && <div className="error-message">{errors.content}</div>}
        </div>

        <div className="editor-footer">
          <p className="markdown-hint">💡 支持 Markdown 格式，将导出为标准 SKILL.md</p>
        </div>
      </div>
    </div>
  );
};

export default SkillEditor;