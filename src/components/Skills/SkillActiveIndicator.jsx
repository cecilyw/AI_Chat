import React from 'react';
import './SkillActiveIndicator.css';

/**
 * 技能使用指示器组件
 * 在消息上方显示当前使用的技能
 */
const SkillActiveIndicator = ({ skill }) => {
  if (!skill) return null;

  return (
    <div className="skill-active-indicator">
      <span className="skill-icon">🎯</span>
      <span className="skill-name">{skill.name}</span>
      <span className="skill-badge">已启用</span>
    </div>
  );
};

export default SkillActiveIndicator;