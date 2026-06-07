import { Skill } from '../models/Skill';

// 技能存储服务类
export class SkillStorage {
  constructor() {
    this.storageKey = 'yuanai_skills';
    this.version = '1.0.0';
    this.migrationKey = `${this.storageKey}_version`;
  }

  // 检查是否需要迁移数据
  checkMigration() {
    const storedVersion = localStorage.getItem(this.migrationKey);
    if (storedVersion !== this.version) {
      this.migrateData(storedVersion);
      localStorage.setItem(this.migrationKey, this.version);
    }
  }

  // 数据迁移
  migrateData(oldVersion) {
    if (!oldVersion) {
      // 首次初始化
      return;
    }

    try {
      const localSkills = localStorage.getItem(this.storageKey);
      if (!localSkills) {
        return;
      }

      const skillsData = JSON.parse(localSkills);
      const migratedSkills = skillsData.map(skillData => {
        // 如果已经是新格式，直接返回
        if (skillData.hasOwnProperty('content') && !skillData.hasOwnProperty('template')) {
          return skillData;
        }

        // 迁移旧格式到新格式
        const migratedData = {
          id: skillData.id,
          name: skillData.name || skillData.id || '未命名技能',
          description: skillData.description || '无描述',
          content: skillData.content ||
                  (skillData.template && (skillData.template.userPrompt || skillData.template.systemPrompt)) ||
                  '## 使用指引\n请在此处填写技能的具体使用说明。\n\n## 示例\n提供该技能的使用示例。',
          usageCount: skillData.usageCount || 0,
          createdAt: skillData.createdAt || Date.now(),
          updatedAt: skillData.updatedAt || Date.now()
        };

        return migratedData;
      });

      localStorage.setItem(this.storageKey, JSON.stringify(migratedSkills));
      console.log(`数据已从版本 ${oldVersion} 迁移到 ${this.version}`);
    } catch (error) {
      console.error('数据迁移失败:', error);
    }
  }

  // 获取所有技能
  async getAllSkills() {
    try {
      this.checkMigration();
      const localSkills = localStorage.getItem(this.storageKey);
      if (!localSkills) {
        return [];
      }

      const skillsData = JSON.parse(localSkills);
      return skillsData.map(skillData => new Skill(skillData));
    } catch (error) {
      console.error('读取技能数据失败:', error);
      return [];
    }
  }

  // 保存技能
  async saveSkill(skill) {
    try {
      const skills = await this.getAllSkills();
      const index = skills.findIndex(s => s.id === skill.id);

      // 验证技能数据
      skill.validate();

      const skillData = skill.toObject();

      if (index >= 0) {
        // 更新现有技能
        skills[index] = new Skill({ ...skills[index].toObject(), ...skillData });
        console.log(`技能 "${skills[index].name}" 已更新`);
      } else {
        // 添加新技能
        skills.push(new Skill(skillData));
        console.log(`技能 "${skillData.name}" 已创建`);
      }

      // 保存到本地存储
      localStorage.setItem(this.storageKey, JSON.stringify(skills.map(s => s.toObject())));

      return skills[index >= 0 ? index : skills.length - 1];
    } catch (error) {
      console.error('保存技能失败:', error);
      throw error;
    }
  }

  // 批量保存技能
  async saveSkills(skills) {
    try {
      // 验证所有技能
      skills.forEach(skill => skill.validate());

      const skillsData = skills.map(skill => skill.toObject());
      localStorage.setItem(this.storageKey, JSON.stringify(skillsData));

      return skillsData;
    } catch (error) {
      console.error('批量保存技能失败:', error);
      throw error;
    }
  }

  // 删除技能
  async deleteSkill(skillId) {
    try {
      const skills = await this.getAllSkills();
      const index = skills.findIndex(s => s.id === skillId);

      if (index >= 0) {
        const deletedSkill = skills.splice(index, 1)[0];
        localStorage.setItem(this.storageKey, JSON.stringify(skills.map(s => s.toObject())));
        console.log(`技能 "${deletedSkill.name}" 已删除`);
        return deletedSkill;
      } else {
        throw new Error('技能不存在');
      }
    } catch (error) {
      console.error('删除技能失败:', error);
      throw error;
    }
  }

  // 根据ID获取技能
  async getSkillById(skillId) {
    try {
      const skills = await this.getAllSkills();
      const skill = skills.find(s => s.id === skillId);
      return skill || null;
    } catch (error) {
      console.error('获取技能失败:', error);
      return null;
    }
  }

  // 搜索技能
  async searchSkills(query) {
    try {
      const skills = await this.getAllSkills();
      if (!query.trim()) {
        return skills;
      }

      const searchTerms = query.toLowerCase().split(' ');

      return skills.filter(skill => {
        const searchableText = [
          skill.name,
          skill.description,
          skill.content
        ].join(' ').toLowerCase();

        return searchTerms.every(term => searchableText.includes(term));
      });
    } catch (error) {
      console.error('搜索技能失败:', error);
      return [];
    }
  }

  // 增加使用次数
  async incrementUsage(skillId) {
    try {
      const skills = await this.getAllSkills();
      const skill = skills.find(s => s.id === skillId);

      if (skill) {
        skill.usageCount += 1;
        await this.saveSkills(skills);
        return skill;
      } else {
        throw new Error('技能不存在');
      }
    } catch (error) {
      console.error('增加使用次数失败:', error);
      throw error;
    }
  }

  // 导出技能配置
  async exportSkills() {
    try {
      const skills = await this.getAllSkills();
      const exportData = {
        version: this.version,
        exportTime: new Date().toISOString(),
        skills: skills.map(skill => skill.toObject()),
        totalCount: skills.length
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('导出技能配置失败:', error);
      throw error;
    }
  }

  // 导入技能配置
  async importSkills(jsonData) {
    try {
      const importData = JSON.parse(jsonData);

      // 验证导入数据格式
      if (!importData.skills || !Array.isArray(importData.skills)) {
        throw new Error('导入数据格式错误');
      }

      // 创建技能对象并验证
      const skills = importData.skills.map(skillData => {
        const skill = new Skill(skillData);
        skill.validate();
        return skill;
      });

      // 合并到现有技能（避免重复ID）
      const existingSkills = await this.getAllSkills();
      const existingIds = new Set(existingSkills.map(s => s.id));

      const newSkills = skills.filter(skill => !existingIds.has(skill.id));

      if (newSkills.length > 0) {
        const updatedSkills = [...existingSkills, ...newSkills];
        await this.saveSkills(updatedSkills);
        console.log(`成功导入 ${newSkills.length} 个技能`);
        return newSkills;
      } else {
        console.log('没有新技能需要导入');
        return [];
      }
    } catch (error) {
      console.error('导入技能配置失败:', error);
      throw error;
    }
  }

  // 清空所有技能
  async clearAllSkills() {
    try {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.migrationKey);
      console.log('所有技能已清空');
      return true;
    } catch (error) {
      console.error('清空技能失败:', error);
      return false;
    }
  }

  // 获取存储统计
  async getStorageStats() {
    try {
      const skills = await this.getAllSkills();
      const totalSize = new Blob([localStorage.getItem(this.storageKey) || '']).size;

      return {
        totalSkills: skills.length,
        totalUsage: skills.reduce((sum, skill) => sum + skill.usageCount, 0),
        totalSize: totalSize,
        lastUpdate: skills.length > 0 ? Math.max(...skills.map(s => s.updatedAt)) : null
      };
    } catch (error) {
      console.error('获取存储统计失败:', error);
      return null;
    }
  }
}

// 创建单例实例
export const skillStorage = new SkillStorage();