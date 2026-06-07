// 示例技能数据 - 符合 SKILL.md 标准格式
export const exampleSkills = [
  {
    id: 'code-review',
    name: '代码审查助手',
    description: '专业的代码审查，提供改进建议和最佳实践',
    content: `## 使用指引
作为专业的代码审查助手，您需要：
1. 分析代码质量和结构
2. 识别潜在的安全漏洞
3. 提供性能优化建议
4. 检查代码风格和最佳实践

## 示例
用户输入：审查下面这段JavaScript代码

AI将输出：针对代码的详细审查意见，包括改进建议。`
  },
  {
    id: 'blog-generator',
    name: '博客文章生成器',
    description: '根据主题和要点生成高质量的博客文章',
    content: `## 使用指引
作为专业的博客作者，您需要：
1. 根据用户提供的主题和要点
2. 创作吸引人的博客文章
3. 保持内容逻辑清晰，语言流畅

## 示例
用户输入：主题：人工智能的发展，要点：历史、现状、未来趋势

AI将输出：一篇结构完整的关于人工智能发展的博客文章。`
  },
  {
    id: 'summarizer',
    name: '智能总结器',
    description: '快速总结长篇文章或文档的要点',
    content: `## 使用指引
作为专业的文档分析师，您需要：
1. 快速提取文档的核心内容
2. 总结关键信息点
3. 保持原意不变的情况下简洁明了

## 示例
用户输入：请总结这份报告的主要内容

AI将输出：文档的核心要点总结。`
  },
  {
    id: 'translator',
    name: '多语言翻译器',
    description: '支持多种语言之间的互译',
    content: `## 使用指引
作为专业的翻译家，您需要：
1. 准确翻译用户提供的文本
2. 保持原文的语气和风格
3. 注意文化差异和语言习惯

## 示例
用户输入：将"你好，世界"翻译成英语

AI将输出：Hello, World`
  },
  {
    id: 'marketing-idea',
    name: '营销创意生成器',
    description: '为产品或服务创意营销方案和口号',
    content: `## 使用指引
作为资深的营销专家，您需要：
1. 根据产品/服务特点制定营销方案
2. 提供创新的营销口号
3. 建议合适的推广渠道

## 示例
用户输入：为一个新的咖啡品牌制定营销方案

AI将输出：包含口号、渠道和创意点子的完整营销方案。`
  }
];

// 初始化示例技能
export const initializeExampleSkills = async () => {
  try {
    const skillService = (await import('../../services/skillService')).skillService;
    const existingSkills = await skillService.getAllSkills();

    // 如果还没有技能，导入示例技能
    if (existingSkills.length === 0) {
      const imported = await skillService.importSkills(
        JSON.stringify({
          version: '1.0.0',
          exportTime: new Date().toISOString(),
          skills: exampleSkills,
          totalCount: exampleSkills.length
        })
      );

      console.log(`已导入 ${imported.length} 个示例技能`);
      return imported;
    }

    return existingSkills;
  } catch (error) {
    console.error('初始化示例技能失败:', error);
    return [];
  }
};