import { Skill } from '../models/Skill';
import { skillStorage } from './skillStorage';

// 技能业务逻辑服务类
export class SkillService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
    this.initialized = false;
  }

  // 初始化服务
  async initialize() {
    if (this.initialized) return;

    try {
      await this.loadSkills();
      this.initialized = true;
      console.log('技能服务初始化完成');
    } catch (error) {
      console.error('技能服务初始化失败:', error);
      throw error;
    }
  }

  // 加载技能到缓存
  async loadSkills() {
    try {
      const skills = await skillStorage.getAllSkills();
      this.cache.clear();

      skills.forEach(skill => {
        this.cache.set(skill.id, {
          skill,
          timestamp: Date.now()
        });
      });

      return skills;
    } catch (error) {
      console.error('加载技能失败:', error);
      throw error;
    }
  }

  // 获取缓存中的技能
  getSkillFromCache(skillId) {
    const cached = this.cache.get(skillId);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.skill;
    }
    return null;
  }

  // 设置技能到缓存
  setSkillToCache(skill) {
    this.cache.set(skill.id, {
      skill,
      timestamp: Date.now()
    });
  }

  // 获取所有技能
  async getAllSkills(forceReload = false) {
    if (forceReload) {
      await this.loadSkills();
    }

    const skills = Array.from(this.cache.values()).map(item => item.skill);
    return skills;
  }

  // 根据ID获取技能
  async getSkillById(skillId, forceReload = false) {
    let skill = this.getSkillFromCache(skillId);

    if (!skill && forceReload) {
      const skills = await this.loadSkills();
      skill = skills.find(s => s.id === skillId);
    }

    return skill || null;
  }

  // 创建新技能
  async createSkill(skillData) {
    try {
      // 创建技能对象
      const skill = new Skill(skillData);

      // 验证技能
      skill.validate();

      // 保存技能
      const savedSkill = await skillStorage.saveSkill(skill);

      // 更新缓存
      this.setSkillToCache(savedSkill);

      return savedSkill;
    } catch (error) {
      console.error('创建技能失败:', error);
      throw error;
    }
  }

  // 更新技能
  async updateSkill(skillId, updates) {
    try {
      let skill = this.getSkillFromCache(skillId);

      if (!skill) {
        skill = await this.getSkillById(skillId, true);
        if (!skill) {
          throw new Error('技能不存在');
        }
      }

      // 创建技能副本并更新
      const updatedSkill = skill.clone();
      Object.assign(updatedSkill, updates);

      // 验证更新后的技能
      updatedSkill.validate();

      // 保存技能
      const savedSkill = await skillStorage.saveSkill(updatedSkill);

      // 更新缓存
      this.setSkillToCache(savedSkill);

      return savedSkill;
    } catch (error) {
      console.error('更新技能失败:', error);
      throw error;
    }
  }

  // 删除技能
  async deleteSkill(skillId) {
    try {
      // 从缓存中移除
      this.cache.delete(skillId);

      // 从存储中删除
      const deletedSkill = await skillStorage.deleteSkill(skillId);

      return deletedSkill;
    } catch (error) {
      console.error('删除技能失败:', error);
      throw error;
    }
  }

  // 批量删除技能
  async deleteSkills(skillIds) {
    try {
      // 从缓存中移除
      skillIds.forEach(id => this.cache.delete(id));

      // 从存储中删除
      const deletedSkills = [];
      for (const skillId of skillIds) {
        const deleted = await skillStorage.deleteSkill(skillId);
        if (deleted) {
          deletedSkills.push(deleted);
        }
      }

      return deletedSkills;
    } catch (error) {
      console.error('批量删除技能失败:', error);
      throw error;
    }
  }

  // 搜索技能
  async searchSkills(query) {
    try {
      const skills = await skillStorage.searchSkills(query);

      // 更新缓存
      skills.forEach(skill => {
        this.setSkillToCache(skill);
      });

      return skills;
    } catch (error) {
      console.error('搜索技能失败:', error);
      throw error;
    }
  }

  // 导出技能
  async exportSkills() {
    return await skillStorage.exportSkills();
  }

  // 获取热门技能
  async getPopularSkills(limit = 10) {
    try {
      const skills = await this.getAllSkills();
      return skills
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, limit);
    } catch (error) {
      console.error('获取热门技能失败:', error);
      return [];
    }
  }

  // 获取最近使用的技能
  async getRecentSkills(limit = 10) {
    try {
      const skills = await this.getAllSkills();
      return skills
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, limit);
    } catch (error) {
      console.error('获取最近使用的技能失败:', error);
      return [];
    }
  }

  // 清空缓存
  clearCache() {
    this.cache.clear();
  }

  // 获取服务状态
  getStatus() {
    return {
      initialized: this.initialized,
      cachedSkills: this.cache.size,
      cacheSize: JSON.stringify(Array.from(this.cache.values())).length
    };
  }
}

// 创建单例实例
export const skillService = new SkillService();

// 导出 skillStorage 实例
export { skillStorage } from './skillStorage';