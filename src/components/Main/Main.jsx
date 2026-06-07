// 引入React相关钩子和组件
import React, { useContext, useEffect, useState } from "react";
// 引入虚拟滚动组件Virtuoso
import { Virtuoso } from "react-virtuoso";
// 引入样式文件
import "./Main.css";
// 引入图标资源
import { assets } from "../../assets/assets";
// 引入全局Context
import { Context } from "../../context/Context";
// 引入Markdown渲染组件
import MarkdownRenderer from "../MarkdownRenderer/MarkdownRenderer";
// 引入技能相关组件
import SkillsModal from "../Skills/SkillsModal";
import SkillActiveIndicator from "../Skills/SkillActiveIndicator";

// 单条消息组件
const MessageRow = ({ message }) => (
  <div
    className={`message-item ${message.role === "assistant" ? "ai-message" : "user-message"}`}
  >
    {/* 根据角色显示不同头像 */}
    <img
      src={message.role === "assistant" ? assets.gemini_icon : assets.user_icon}
      alt=""
      className="message-avatar"
    />
    {/* 消息内容区域 */}
    <div className="message-content">
      {/* 显示技能指示器 */}
      {message.skillId && (
        <SkillActiveIndicator
          skill={{
            id: message.skillId,
            name: message.skillName
          }}
        />
      )}
      {/* 如果正在生成且还没有内容，显示加载动画 */}
      {message.status === "generating" && !message.content ? (
        <div className="loader">
          <hr />
          <hr />
          <hr />
        </div>
      ) : (
        // 否则用Markdown渲染内容
        <div className="markdown-content">
          <MarkdownRenderer content={message.content} />
        </div>
      )}
      {/* 显示消息状态：已中断或生成失败 */}
      {message.status === "aborted" && (
        <span className="message-status">已中断</span>
      )}
      {message.status === "failed" && (
        <span className="message-status error">生成失败</span>
      )}
    </div>
  </div>
);

// 主页面组件
const Main = () => {
  console.log('Main 组件开始渲染...');

  // 技能弹窗显示状态
  const [showSkillsModal, setShowSkillsModal] = useState(false);

  // 从全局Context中获取需要的状态和方法
  const {
    abortGeneration,
    activeSkill,
    handleKeyPress,
    input,
    isAtBottom,
    isGenerating,
    isVoiceSupported,
    messages,
    onSent,
    setInput,
    setIsAtBottom,
    showResult,
    toggleVoiceInput,
    updateSessionMessages,
    virtuosoRef,
    voiceError,
    voiceInputStatus,
    voiceTranscript,
    scrollToBottom,
  } = useContext(Context);

  // 处理输入框变化
  const handleInputChange = (event) => {
    const value = event.target.value;
    setInput(value);
    updateSessionMessages(messages, { input: value });
  };

  // 消息变化时自动滚动到底部
  useEffect(() => {
    if (messages.length === 0) {
      return;
    }

    scrollToBottom(isGenerating ? "auto" : "smooth");
  }, [isGenerating, messages.length, scrollToBottom]);

  return (
    <div className="main">
      {/* 顶部导航栏 */}
      <div className="nav">
        <p>yuanAI</p>
        <div className="nav-actions">
          {/* 技能管理按钮 */}
          <button
            className="skill-button"
            onClick={() => setShowSkillsModal(true)}
            title="技能管理"
          >
            🎯
          </button>
          <img src={assets.user_icon} alt="" />
        </div>
      </div>

      {/* 主内容容器 */}
      <div className="main-container">
        {/* 欢迎页面：没有消息时显示 */}
        {!showResult ? (
          <>
            {/* 问候语 */}
            <div className="greet">
              <p>
                <span>hello, yuan</span>
              </p>
              <p>How can I help you?</p>
            </div>
            {/* 快捷提示卡片 */}
            <div className="cards">
              <div
                className="card"
                onClick={() => onSent("建议一些即将自驾游时可以去的美丽景点")}
              >
                <p>建议一些即将自驾游时可以去的美丽景点</p>
                <img src={assets.compass_icon} alt="" />
              </div>
              <div
                className="card"
                onClick={() => onSent('简要总结一下"城市规划"这个概念')}
              >
                <p>简要总结一下"城市规划"这个概念</p>
                <img src={assets.bulb_icon} alt="" />
              </div>
              <div
                className="card"
                onClick={() => onSent("为我们的团队拓展活动集思广益")}
              >
                <p>为我们的团队拓展活动集思广益</p>
                <img src={assets.message_icon} alt="" />
              </div>
              <div
                className="card"
                onClick={() => onSent("提升以下代码的可读性")}
              >
                <p>提升以下代码的可读性</p>
                <img src={assets.code_icon} alt="" />
              </div>
            </div>
          </>
        ) : (
          // 聊天结果页面：显示消息列表
          <div className="result">
            <div className="chat-messages">
              {/* 使用Virtuoso虚拟滚动组件渲染消息列表 */}
              <Virtuoso
                ref={virtuosoRef}
                className="chat-virtuoso"
                data={messages}
                followOutput={isAtBottom ? "auto" : false}
                itemContent={(index, message) => (
                  <MessageRow key={message.id || index} message={message} />
                )}
                atBottomStateChange={(bottom) => setIsAtBottom(bottom)}
                overscan={240}
              />
            </div>
          </div>
        )}

        {/* 底部输入区域 */}
        <div className="main-bottom">
          <div className="search-box">
            {/* 输入框 */}
            <input
              onChange={handleInputChange}
              value={
                voiceInputStatus === "recording"
                  ? voiceTranscript || input
                  : input
              }
              type="text"
              onKeyDown={handleKeyPress}
              placeholder="在这里输入提示"
            />
            {/* 操作按钮区域 */}
            <div className="search-actions">
              <img src={assets.gallery_icon} alt="" />
              {/* 语音输入按钮 */}
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`icon-button mic-button mic-${voiceInputStatus}`}
                title={
                  !isVoiceSupported
                    ? "当前浏览器不支持语音输入"
                    : voiceInputStatus === "recording"
                      ? "结束录音"
                      : "开始语音输入"
                }
                disabled={
                  !isVoiceSupported || voiceInputStatus === "processing"
                }
              >
                <img
                  src={assets.mic_icon}
                  alt="麦克风图标"
                  className="mic-button-icon"
                />
              </button>
              {/* 根据状态显示不同按钮：正在生成时显示停止按钮，有输入时显示发送按钮 */}
              {isGenerating ? (
                <img
                  src={assets.stop_icon}
                  alt=""
                  onClick={abortGeneration}
                  className="stop-icon"
                  title="停止生成"
                />
              ) : input ? (
                <img onClick={() => onSent()} src={assets.send_icon} alt="" />
              ) : null}
            </div>
          </div>
          {/* 语音输入状态提示条 */}
          {(voiceInputStatus !== "idle" || voiceError) && (
            <div className="voice-status-bar">
              <span className={`voice-status-chip ${voiceInputStatus}`}>
                {voiceInputStatus === "recording"
                  ? "录音中"
                  : voiceInputStatus === "processing"
                    ? "识别中"
                    : "语音输入"}
              </span>
              <p>
                {voiceError ||
                  (voiceInputStatus === "recording"
                    ? "请开始说话，点击麦克风结束录音。"
                    : "正在处理语音内容…")}
              </p>
            </div>
          )}
          {/* 底部提示信息 */}
          <p className="bottom-info">
            yuanAI 可能会显示不准确的信息，请仔细检查其回复。
          </p>
        </div>
      </div>

      {/* 技能管理弹窗 */}
      <SkillsModal
        isOpen={showSkillsModal}
        onClose={() => setShowSkillsModal(false)}
      />
    </div>
  );
};

export default Main;
