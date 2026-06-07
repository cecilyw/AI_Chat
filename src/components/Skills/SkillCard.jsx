import React from 'react';
import { useNavigate } from 'react-router-dom';

const SkillCard = ({ skill, onEdit, onDelete, showUsageCount = true }) => {
  const navigate = useNavigate();

  const handleUseSkill = () => {
    // 直接使用技能，无需参数
    // 注意：useSkill 函数已从 Context 中移除，此处仅为占位
    console.log('使用技能:', skill.name);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`确定要删除技能 "${skill.name}" 吗？`)) {
      onDelete(skill.id);
    }
  };

  return (
    <div
      className="skill-card"
      onClick={handleUseSkill}
    >
      <div className="skill-card-header">
        <div className="skill-info">
          <div className="skill-title">
            <h3>{skill.name}</h3>
          </div>
          <p className="skill-description">{skill.description || '暂无描述'}</p>
        </div>

        <div className="skill-actions">
          <button
            className="edit-btn"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(skill);
            }}
            title="编辑"
          >
            <span className="icon">✏️</span>
          </button>
          <button
            className="delete-btn"
            onClick={handleDelete}
            title="删除"
          >
            <span className="icon">🗑️</span>
          </button>
        </div>
      </div>

      {/* 显示使用次数 */}
      {showUsageCount && skill.usageCount > 0 && (
        <div className="skill-usage">
          <span className="usage-count">使用 {skill.usageCount} 次</span>
        </div>
      )}

      {/* 显示创建时间 */}
      {skill.createdAt && (
        <div className="skill-meta">
          <span className="created-date">
            {new Date(skill.createdAt).toLocaleDateString()}
          </span>
        </div>
      )}
    </div>
  );
};

export default SkillCard;