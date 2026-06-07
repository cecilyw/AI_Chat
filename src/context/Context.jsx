// 引入React相关钩子和API
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
// 引入流式解析服务
import streamParser from "../services/streamParser";
// 引入语音识别自定义Hook
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
// 引入技能相关
import { skillService } from "../services/skillService";
import { SkillMatcher } from "../services/skillMatcher";

// 创建全局Context上下文对象
export const Context = createContext();

// Context提供者组件
const ContextProvider = (props) => {
  // 输入框内容状态
  const [input, setInput] = useState("");
  // 最近一次提示词状态
  const [recentPrompt, setRecentPrompt] = useState("");
  // 所有会话列表状态
  const [sessions, setSessions] = useState([]);
  // 当前会话ID状态
  const [currentSessionId, setCurrentSessionId] = useState(null);
  // 是否显示结果状态
  const [showResult, setShowResult] = useState(false);
  // 加载中状态
  const [loading, setLoading] = useState(false);
  // 结果数据状态
  const [resultData, setResultData] = useState("");
  // 消息列表状态
  const [messages, setMessages] = useState([]);
  // 是否正在生成回复状态
  const [isGenerating, setIsGenerating] = useState(false);
  // 是否在底部状态（用于滚动）
  const [isAtBottom, setIsAtBottom] = useState(true);

  // 技能相关状态
  const [activeSkill, setActiveSkill] = useState(null);  // 当前激活的技能
  const [skillsInitialized, setSkillsInitialized] = useState(false);  // 技能服务是否已初始化

  // Virtuoso虚拟滚动组件的引用
  const virtuosoRef = useRef(null);

  // 创建新会话的函数
  const createNewSession = useCallback(() => {
    const newSession = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: "New Chat",
      messages: [],
      createdAt: new Date().toISOString(),
      showResult: false,
      resultData: "",
      isGenerating: false,
      input: "",
    };

    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages([]);
    setShowResult(false);
    setResultData("");
    setInput("");
    setLoading(false);
    setIsGenerating(false);
    setIsAtBottom(true);
  }, []);

  // 初始化技能服务
  const initializeSkills = useCallback(async () => {
    try {
      await skillService.initialize();
      setSkillsInitialized(true);
      console.log('技能服务初始化完成');
    } catch (error) {
      console.error('初始化技能服务失败:', error);
    }
  }, []);

  // 组件挂载时初始化技能服务
  useEffect(() => {
    initializeSkills();
  }, [initializeSkills]);

  // 匹配并激活技能
  const matchAndActivateSkill = useCallback(async (input) => {
    if (!skillsInitialized) {
      return null;
    }

    try {
      const matchedSkill = await SkillMatcher.matchSkill(input);
      if (matchedSkill) {
        setActiveSkill(matchedSkill);
        await skillService.incrementUsage(matchedSkill.id);
        console.log(`匹配到技能: ${matchedSkill.name}`);
      } else {
        setActiveSkill(null);
      }
      return matchedSkill;
    } catch (error) {
      console.error('技能匹配失败:', error);
      setActiveSkill(null);
      return null;
    }
  }, [skillsInitialized]);

  // 加载指定会话的函数
  const loadSession = useCallback(
    (sessionId) => {
      const session = sessions.find((item) => item.id === sessionId);
      if (!session) {
        return;
      }

      setCurrentSessionId(sessionId);
      setMessages(session.messages);
      setShowResult(
        session.showResult !== undefined
          ? session.showResult
          : session.messages.length > 0,
      );
      setRecentPrompt(session.title);
      setResultData(session.resultData || "");
      setIsGenerating(session.isGenerating || false);
      setInput(session.input || "");
      setIsAtBottom(true);
    },
    [sessions],
  );

  // 删除指定会话的函数
  const deleteSession = useCallback(
    (sessionId) => {
      setSessions((prev) => {
        const updatedSessions = prev.filter(
          (session) => session.id !== sessionId,
        );

        if (currentSessionId === sessionId) {
          // 使用 requestAnimationFrame 替代 setTimeout，避免竞争条件
          requestAnimationFrame(() => {
            if (updatedSessions.length > 0) {
              loadSession(updatedSessions[0].id);
            } else {
              createNewSession();
            }
          });
        }

        return updatedSessions;
      });
    },
    [createNewSession, currentSessionId, loadSession],
  );

  // 更新当前会话消息的函数
  const updateSessionMessages = useCallback(
    (newMessages, additionalState = {}) => {
      setSessions((prev) =>
        prev.map((session) =>
          session.id === currentSessionId
            ? {
                ...session,
                messages: newMessages,
                title:
                  (() => {
                    // 查找最新的用户消息
                    const userMessage = newMessages
                      .slice()
                      .reverse()
                      .find((message) => message.role === "user");
                    return userMessage?.content?.slice(0, 20) || "New Chat";
                  })(),
                showResult:
                  additionalState.showResult !== undefined
                    ? additionalState.showResult
                    : session.showResult,
                resultData:
                  additionalState.resultData !== undefined
                    ? additionalState.resultData
                    : session.resultData,
                isGenerating:
                  additionalState.isGenerating !== undefined
                    ? additionalState.isGenerating
                    : session.isGenerating,
                input:
                  additionalState.input !== undefined
                    ? additionalState.input
                    : session.input,
              }
            : session,
        ),
      );
    },
    [currentSessionId],
  );

  // 用于防止 StrictMode 下重复创建会话的标记
  const hasCreatedSession = useRef(false);

  // 当没有会话时自动创建新会话的副作用
  useEffect(() => {
    if (sessions.length === 0 && !hasCreatedSession.current) {
      hasCreatedSession.current = true;
      createNewSession();
    }
  }, [sessions.length, createNewSession]);

  // 滚动到底部的函数
  const scrollToBottom = useCallback(
    (behavior = "auto") => {
      if (!virtuosoRef.current) {
        return;
      }

      virtuosoRef.current.scrollToIndex({
        align: "end",
        behavior,
        index: Math.max(messages.length - 1, 0),
      });
    },
    [messages.length],
  );

  // 发送消息的核心函数
  const onSent = useCallback(
    async (prompt) => {
      // 如果正在生成回复，则不处理
      if (isGenerating) {
        return;
      }

      const messageText = prompt !== undefined ? prompt : input;
      if (!messageText.trim()) {
        return;
      }

      const normalizedText = messageText.trim();

      // 匹配技能
      const matchedSkill = await matchAndActivateSkill(normalizedText);

      // 创建用户消息对象
      const userMessage = {
        id: Date.now(),
        role: "user",
        content: normalizedText,
        timestamp: new Date().toLocaleString(),
        skillId: matchedSkill?.id || null,
        skillName: matchedSkill?.name || null,
      };

      // 添加用户消息到消息列表
      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      updateSessionMessages(nextMessages, {
        showResult: true,
        input: "",
        isGenerating: true,
      });
      setInput("");
      setShowResult(true);
      setIsGenerating(true);
      setLoading(true);
      setRecentPrompt(normalizedText);
      setIsAtBottom(true);

      // 创建AI回复消息对象（初始为空）
      const aiMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: "",
        timestamp: new Date().toLocaleString(),
        status: "generating",
      };

      // 添加AI消息到消息列表
      const messagesWithAI = [...nextMessages, aiMessage];
      setMessages(messagesWithAI);
      updateSessionMessages(messagesWithAI, {
        showResult: true,
        input: "",
        isGenerating: true,
      });

      try {
        // 构建系统提示词（如果有匹配的技能）
        let systemPrompt = "";
        if (matchedSkill) {
          systemPrompt = `${matchedSkill.name}：\n\n${matchedSkill.description}\n\n${matchedSkill.content}`;
        }

        // 构建API请求格式的消息
        const apiMessages = [
          ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
          ...nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        ];

        // 调用流式解析服务发送请求
        await streamParser.fetchStream(
          apiMessages,
          // 处理流式数据块的回调
          (chunk) => {
            let streamedContent = "";
            const updatedMessages = messagesWithAI.map((message) => {
              if (message.id !== aiMessage.id) {
                return message;
              }

              streamedContent = `${message.content}${chunk}`;
              return {
                ...message,
                content: streamedContent,
              };
            });

            messagesWithAI.splice(0, messagesWithAI.length, ...updatedMessages);
            setMessages(updatedMessages);
            updateSessionMessages(updatedMessages, {
              resultData: streamedContent,
            });
          },
          // 处理错误的回调
          (error) => {
            console.error("Stream error:", error);
            const errorMessages = messagesWithAI.map((message) =>
              message.id === aiMessage.id
                ? {
                    ...message,
                    status: "failed",
                    content: message.content || "生成失败，请重试",
                  }
                : message,
            );
            setMessages(errorMessages);
            updateSessionMessages(errorMessages, { isGenerating: false });
            setIsGenerating(false);
            setLoading(false);
          },
          // 完成时的回调
          () => {
            let completedContent = "";
            const completedMessages = messagesWithAI.map((message) => {
              if (message.id !== aiMessage.id) {
                return message;
              }

              completedContent = message.content;
              return {
                ...message,
                status: "completed",
                content: message.content,
              };
            });

            setMessages(completedMessages);
            updateSessionMessages(completedMessages, {
              resultData: completedContent,
              isGenerating: false,
            });
            setIsGenerating(false);
            setLoading(false);
            setResultData(completedContent);
          },
        );
      } catch (error) {
        console.error("Error:", error);
        const errorMessages = messagesWithAI.map((message) =>
          message.id === aiMessage.id
            ? { ...message, status: "failed", content: "生成失败，请重试" }
            : message,
        );
        setMessages(errorMessages);
        updateSessionMessages(errorMessages, { isGenerating: false });
        setIsGenerating(false);
        setLoading(false);
      }
    },
    [input, isGenerating, updateSessionMessages], // 移除 messages 依赖
  );

  // 处理语音转文本的回调函数
  const handleVoiceTranscript = useCallback(
    (transcript) => {
      setInput(transcript);
      onSent(transcript);
    },
    [onSent],
  );

  // 使用语音识别Hook
  const {
    error: voiceError,
    isSupported: isVoiceSupported,
    status: voiceInputStatus,
    toggle: toggleVoiceInput,
    transcript: voiceTranscript,
  } = useSpeechRecognition({ onTranscript: handleVoiceTranscript });

  // 中止生成回复的函数
  const abortGeneration = useCallback(() => {
    streamParser.abort();
    setIsGenerating(false);
    setLoading(false);
    const updatedMessages = messages.map((message) =>
      message.status === "generating"
        ? { ...message, status: "aborted" }
        : message,
    );
    setMessages(updatedMessages);
    updateSessionMessages(updatedMessages, { isGenerating: false });
  }, [updateSessionMessages]); // 移除 messages 依赖

  // 处理键盘事件的函数（Enter键发送消息）
  const handleKeyPress = useCallback(
    (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        onSent();
      }
    },
    [onSent],
  );

  // 构建Context值对象
  const contextValue = useMemo(
    () => ({
      abortGeneration,
      activeSkill,
      createNewSession,
      currentSessionId,
      deleteSession,
      handleKeyPress,
      input,
      isAtBottom,
      isGenerating,
      isVoiceSupported,
      loadSession,
      loading,
      messages,
      onSent,
      recentPrompt,
      resultData,
      scrollToBottom,
      sessions,
      setActiveSkill,
      setInput,
      setIsAtBottom,
      setRecentPrompt,
      showResult,
      toggleVoiceInput,
      updateSessionMessages,
      virtuosoRef,
      voiceError,
      voiceInputStatus,
      voiceTranscript,
    }),
    [
      abortGeneration,
      activeSkill,
      createNewSession,
      currentSessionId,
      deleteSession,
      handleKeyPress,
      input,
      isAtBottom,
      isGenerating,
      isVoiceSupported,
      loadSession,
      loading,
      messages,
      onSent,
      recentPrompt,
      resultData,
      scrollToBottom,
      sessions,
      showResult,
      toggleVoiceInput,
      updateSessionMessages,
      voiceError,
      voiceInputStatus,
      voiceTranscript,
    ],
  );

  // 渲染Context提供者，将状态和方法传递给子组件
  return (
    <Context.Provider value={contextValue}>{props.children}</Context.Provider>
  );
};

export default ContextProvider;