import { skillService } from './skillService';

/**
 * 技能匹配器
 * 根据用户输入自动匹配对应的技能
 */
export class SkillMatcher {
  /**
   * 匹配输入对应的技能
   * @param {string} input - 用户输入的文本
   * @returns {Promise<Skill|null>} - 匹配到的技能，或 null
   */
  static async matchSkill(input) {
    try {
      const allSkills = await skillService.getAllSkills();

      // 查找第一个匹配的技能
      const matchedSkill = allSkills.find(skill => skill.matches(input));

      return matchedSkill || null;
    } catch (error) {
      console.error('技能匹配失败:', error);
      return null;
    }
  }

  /**
   * 获取所有技能的关键词映射（用于调试）
   * @returns {Promise<Object>} - { skillName: [keywords] }
   */
  static async getAllKeywords() {
    try {
      const allSkills = await skillService.getAllSkills();
      const keywordsMap = {};

      allSkills.forEach(skill => {
        keywordsMap[skill.name] = skill.keywords;
      });

      return keywordsMap;
    } catch (error) {
      console.error('获取关键词映射失败:', error);
      return {};
    }
  }

  /**
   * 批量匹配多个输入
   * @param {string[]} inputs - 输入数组
   * @returns {Promise<Skill[]>} - 匹配到的技能数组
   */
  static async matchSkills(inputs) {
    try {
      const allSkills = await skillService.getAllSkills();
      const matchedSkills = [];

      for (const input of inputs) {
        const matched = allSkills.find(skill => skill.matches(input));
        if (matched && !matchedSkills.find(s => s.id === matched.id)) {
          matchedSkills.push(matched);
        }
      }

      return matchedSkills;
    } catch (error) {
      console.error('批量匹配失败:', error);
      return [];
    }
  }
}