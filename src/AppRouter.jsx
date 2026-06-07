import React, { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { getCurrentRoute } from './routes';
import SkillEditor from './components/Skills/SkillEditor';
import Main from './components/Main/Main';
import SideBar from './components/SideBar/SideBar';

const AppRouter = () => {
  // 监听路由变化
  useEffect(() => {
    const handleHashChange = () => {
      const route = getCurrentRoute();
      console.log('当前路由:', route);
    };

    // 初始设置
    handleHashChange();

    // 监听 hash 变化
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // 渲染当前路由
  const renderRoute = () => {
    const route = getCurrentRoute();
    console.log('当前路由:', route);

    // 默认渲染主聊天界面
    return (
      <div className="app-container">
        <SideBar />
        <div className="main-content">
          <Main />
        </div>
      </div>
    );
  };

  return (
    <BrowserRouter>
      {renderRoute()}
    </BrowserRouter>
  );
};

export default AppRouter;