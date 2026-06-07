// 生成唯一ID的辅助函数
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 技能数据模型 — 对齐 SKILL.md 标准格式
export class Skill {
  constructor(data) {
    this.id = data.id || generateId();
    this.name = data.name || '';
    this.description = data.description || '';
    this.content = data.content || '';
    this.usageCount = data.usageCount || 0;
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
  }

  // 验证技能数据
  validate() {
    if (!this.name.trim()) {
      throw new Error('技能名称不能为空');
    }

    if (!this.description.trim()) {
      throw new Error('技能描述不能为空');
    }

    if (!this.content.trim()) {
      throw new Error('技能内容不能为空');
    }

    return true;
  }

  // 转换为可序列化的对象
  toObject() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      content: this.content,
      usageCount: this.usageCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // 克隆技能
  clone() {
    return new Skill(this.toObject());
  }

  // 更新技能
  update(updates) {
    Object.assign(this, updates);
    this.updatedAt = Date.now();
    return this;
  }
}
