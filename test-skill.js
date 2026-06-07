// 测试文件
import { Skill } from '../src/models/Skill.js';

console.log('测试 Skill 类...');

// 测试数据
const testData = {
  id: 'test123',
  name: '测试技能',
  description: '这是一个测试技能',
  category: '测试',
  template: {
    systemPrompt: '你是一个测试助手',
    userPrompt: '请回答：{{question}}',
    parameters: [
      {
        key: 'question',
        label: '问题',
        type: 'text',
        required: true
      }
    ]
  }
};

try {
  const skill = new Skill(testData);
  console.log('Skill 类创建成功:', skill);
} catch (error) {
  console.error('Skill 类创建失败:', error);
}