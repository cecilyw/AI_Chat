/**
 * SideBar 组件
 *
 * 功能：
 * 1. 侧边栏折叠/展开切换
 * 2. 新建对话按钮
 * 3. 显示历史会话列表
 * 4. 切换当前会话
 * 5. 删除会话
 * 6. 底部导航项（帮助、活动、设置）
 */
import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { navigateTo } from "../../routes";
import "./SideBar.css";
import { assets } from "../../assets/assets";
import { Context } from "../../context/Context";

const SideBar = () => {
  // 侧边栏展开/折叠状态
  const [extended, setExtended] = useState(true);
  const navigate = useNavigate();

  // 从 Context 中获取会话管理相关的状态和函数
  const {
    sessions,          // 所有会话列表
    currentSessionId,  // 当前选中的会话 ID
    createNewSession,  // 创建新会话
    loadSession,       // 加载指定会话
    deleteSession,     // 删除会话
  } = useContext(Context);

  return (
    <div
      className={`sidebar ${extended ? "sidebar-extended" : "sidebar-collapsed"}`}
    >
      {/* 侧边栏顶部区域 */}
      <div className="top">
        {/* 菜单图标 - 点击切换侧边栏展开/折叠 */}
        <img
          className="menu"
          src={assets.menu_icon}
          alt=""
          onClick={() => setExtended(!extended)}
        />

        {/* 新建对话按钮 */}
        <div onClick={() => createNewSession()} className="new-chat">
          <img src={assets.plus_icon} alt="" />
          {extended && <p>New Chat</p>}
        </div>

        {/* 展开时显示历史会话列表 */}
        {extended && (
          <div className="recent">
            <p className="recent-title">Recent</p>
            {/* 遍历所有会话，渲染会话列表 */}
            {sessions.map((session) => (
              <div
                key={session.id}  // React key，用于列表渲染优化
                // 点击会话项切换到该会话
                onClick={() => loadSession(session.id)}
                // 如果是当前会话，添加 active 样式
                className={`recent-entry ${session.id === currentSessionId ? "active" : ""}`}
              >
                <img src={assets.message_icon} alt="" />
                {/* 显示会话标题，超过18个字符用省略号 */}
                <p>{session.title.slice(0, 18)}...</p>
                {/* 删除按钮，阻止事件冒泡（避免触发 loadSession） */}
                <img
                  src={assets.trash}
                  onClick={(e) => {
                    e.stopPropagation();  // 阻止点击事件冒泡
                    deleteSession(session.id);  // 删除会话
                  }}
                  alt=""
                  className="delete-icon"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 侧边栏底部区域 */}
      <div className="bottom">
        {/* 帮助按钮 */}
        <div className="bottom-item recent-entry">
          <img src={assets.question_icon} alt="" />
          {extended && <p>Help</p>}
        </div>

        {/* 活动记录按钮 */}
        <div className="bottom-item recent-entry">
          <img src={assets.history_icon} alt="" />
          {extended && <p>Activity</p>}
        </div>

        {/* 技能管理按钮 - 已移除，使用新的简化模型 */}
        {/* <div
          className="bottom-item recent-entry"
          onClick={() => navigateTo('/skills')}
          title="技能管理"
        >
          <img
            src={assets.bulb_icon || assets.setting_icon}
            alt=""
          />
          {extended && <p>Skills</p>}
          {extended && availableSkills.length > 0 && (
            <span className="skills-count">{availableSkills.length}</span>
          )}
        </div> */}

        {/* 设置按钮 */}
        <div className="bottom-item recent-entry">
          <img src={assets.setting_icon} alt="" />
          {extended && <p>Setting</p>}
        </div>
      </div>
    </div>
  );
};

export default SideBar;
