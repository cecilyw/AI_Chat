import { Skill } from '../models/Skill';

// 技能参数解析器类
export class SkillParameterParser {
  // 从用户输入中提取参数值
  static parseParameters(template, inputText) {
    const parameters = {};

    // 模板中的参数定义
    const parameterDefinitions = template.parameters || [];

    // 从用户输入中提取参数值
    parameterDefinitions.forEach(param => {
      const placeholder = `{{${param.key}}}`;

      // 根据参数类型采用不同的提取策略
      switch (param.type) {
        case 'text':
          // 文本类型：从输入中提取匹配的文本
          const textMatch = this.extractTextValue(inputText, param.key);
          if (textMatch) {
            parameters[param.key] = textMatch;
          }
          break;

        case 'number':
          // 数字类型：从输入中提取数字
          const numberMatch = this.extractNumberValue(inputText, param.key);
          if (numberMatch) {
            parameters[param.key] = numberMatch;
          }
          break;

        case 'boolean':
          // 布尔类型：检查是否包含布尔关键词
          const boolMatch = this.extractBooleanValue(inputText, param.key);
          if (boolMatch !== null) {
            parameters[param.key] = boolMatch;
          }
          break;

        case 'select':
          // 选择类型：检查是否包含选项关键词
          const selectMatch = this.extractSelectValue(inputText, param.key, param.options);
          if (selectMatch) {
            parameters[param.key] = selectMatch;
          }
          break;

        case 'date':
          // 日期类型：提取日期
          const dateMatch = this.extractDateValue(inputText, param.key);
          if (dateMatch) {
            parameters[param.key] = dateMatch;
          }
          break;

        default:
          // 默认：直接使用占位符后面的内容
          const defaultMatch = this.extractDefaultValue(inputText, placeholder);
          if (defaultMatch) {
            parameters[param.key] = defaultMatch;
          }
      }
    });

    return parameters;
  }

  // 提取文本值
  static extractTextValue(inputText, key) {
    const patterns = [
      // 模式1: 参数名: 值
      new RegExp(`\\b${key}[:：]?\\s*([^\\s，。！？\\n]+)`, 'i'),
      // 模式2: "值" (对于参数名在模板中占位符前的情况)
      new RegExp(`["']([^"']*?)["']\\s*(?:is|是|为)?\\s*\\b${key}\\b`, 'i'),
      // 模式3: 直接提取占位符后面的内容
      new RegExp(`\\{\\{${key}\\}\\}\\s*[:：]?\\s*([^\\s，。！？\\n]+)`, 'i')
    ];

    for (const pattern of patterns) {
      const match = inputText.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // 尝试从整个输入中提取关键词
    const keywordMatch = inputText.match(new RegExp(`\\b${key}\\s*[:：]?\\s*([^\\s，。！？\\n]+)`, 'i'));
    if (keywordMatch && keywordMatch[1]) {
      return keywordMatch[1].trim();
    }

    return null;
  }

  // 提取数字值
  static extractNumberValue(inputText, key) {
    const patterns = [
      new RegExp(`\\b${key}[:：]?\\s*(\\d+(?:\\.\\d+)?)`, 'i'),
      new RegExp(`\\b${key}\\s*[=:：]\\s*(\\d+(?:\\.\\d+)?)`, 'i')
    ];

    for (const pattern of patterns) {
      const match = inputText.match(pattern);
      if (match && match[1]) {
        const num = parseFloat(match[1]);
        if (!isNaN(num)) {
          return num;
        }
      }
    }

    return null;
  }

  // 提取布尔值
  static extractBooleanValue(inputText, key) {
    const patterns = [
      // 肯定值
      new RegExp(`\\b${key}\\s*(?:is|是|为|等于)?\\s*(?:true|是|yes|1|正确)`, 'i'),
      // 否定值
      new RegExp(`\\b${key}\\s*(?:is|是|为|等于)?\\s*(?:false|否|no|0|错误)`, 'i')
    ];

    for (const pattern of patterns) {
      const match = inputText.match(pattern);
      if (match) {
        return pattern.toString().includes('false|否|no|0|错误') ? false : true;
      }
    }

    return null;
  }

  // 提取选择值
  static extractSelectValue(inputText, key, options) {
    if (!options || !Array.isArray(options)) {
      return null;
    }

    // 构建选项的正则表达式
    const optionPatterns = options.map(option => {
      // 转义特殊字符
      const escaped = option.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`\\b${escaped}\\b`, 'i');
    });

    // 检查输入中是否包含任何选项
    for (let i = 0; i < optionPatterns.length; i++) {
      if (optionPatterns[i].test(inputText)) {
        return options[i];
      }
    }

    return null;
  }

  // 提取日期值
  static extractDateValue(inputText, key) {
    const datePatterns = [
      // YYYY-MM-DD
      new RegExp(`\\b${key}\\s*[:：]?\\s*(\\d{4}-\\d{1,2}-\\d{1,2})`, 'i'),
      // YYYY/MM/DD
      new RegExp(`\\b${key}\\s*[:：]?\\s*(\\d{4}/\\d{1,2}/\\d{1,2})`, 'i'),
      // MM-DD-YYYY
      new RegExp(`\\b${key}\\s*[:：]?\\s*(\\d{1,2}-\\d{1,2}-\\d{4})`, 'i'),
      // 中文日期
      new RegExp(`\\b${key}\\s*[:：]?\\s*(\\d{4}年\\d{1,2}月\\d{1,2}日)`, 'i')
    ];

    for (const pattern of patterns) {
      const match = inputText.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  // 提取默认值（占位符后面的内容）
  static extractDefaultValue(inputText, placeholder) {
    const pattern = new RegExp(`${placeholder}\\s*[:：]?\\s*([^\\s，。！？\\n]+)`, 'i');
    const match = inputText.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
    return null;
  }

  // 验证参数
  static validateParameters(parameters, template) {
    return template.parameters.every(param => {
      const value = parameters[param.key];

      // 检查必需参数
      if (param.required && !value) {
        return false;
      }

      // 检查参数类型
      switch (param.type) {
        case 'number':
          if (value && isNaN(Number(value))) {
            return false;
          }
          break;

        case 'boolean':
          if (value && !['true', 'false', '是', '否', '1', '0'].includes(value)) {
            return false;
          }
          break;

        case 'select':
          if (value && param.options && !param.options.includes(value)) {
            return false;
          }
          break;
      }

      return true;
    });
  }

  // 获取缺失的必需参数
  static getMissingRequiredParameters(parameters, template) {
    return template.parameters
      .filter(param => param.required && !parameters[param.key])
      .map(param => param.key);
  }

  // 构建参数提示
  static buildParameterHints(template) {
    return template.parameters.map(param => {
      let hint = `${param.label} (${param.key})`;

      switch (param.type) {
        case 'number':
          hint += ' - 请输入数字';
          break;
        case 'boolean':
          hint += ' - true/false 或 是/否';
          break;
        case 'select':
          hint += ` - 可选值: ${param.options.join(', ')}`;
          break;
        case 'date':
          hint += ' - 请输入日期 (YYYY-MM-DD)';
          break;
      }

      if (param.required) {
        hint += ' [必需]';
      } else {
        hint += ' [可选]';
      }

      return hint;
    }).join('\n');
  }

  // 格式化参数输出
  static formatOutput(output, format) {
    switch (format) {
      case 'json':
        return JSON.stringify(output, null, 2);
      case 'markdown':
        return this.formatAsMarkdown(output);
      case 'text':
      default:
        return this.formatAsText(output);
    }
  }

  // 格式化为Markdown
  static formatAsMarkdown(data) {
    if (typeof data === 'string') {
      return data;
    }

    let output = '';
    Object.entries(data).forEach(([key, value]) => {
      output += `**${key}**: ${value}\n\n`;
    });

    return output;
  }

  // 格式化为文本
  static formatAsText(data) {
    if (typeof data === 'string') {
      return data;
    }

    let output = '';
    Object.entries(data).forEach(([key, value]) => {
      output += `${key}: ${value}\n`;
    });

    return output;
  }

  // 生成示例输入
  static generateExampleInput(template) {
    let example = '';

    template.parameters.forEach(param => {
      if (param.type === 'select') {
        example += `${param.label}: ${param.options[0]} `;
      } else if (param.type === 'boolean') {
        example += `${param.label}: true `;
      } else if (param.type === 'number') {
        example += `${param.label}: 10 `;
      } else {
        example += `${param.label}: 示例值 `;
      }
    });

    return example.trim();
  }

  // 解析模板中的占位符
  static parsePlaceholders(template) {
    const placeholders = [];
    const matches = template.userPrompt.match(/\{\{(\w+)\}\}/g);

    if (matches) {
      matches.forEach(match => {
        const key = match.slice(2, -2);
        placeholders.push(key);
      });
    }

    return [...new Set(placeholders)];
  }
}