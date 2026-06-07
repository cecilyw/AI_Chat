import React, { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { getCurrentRoute } from './routes';
import SkillsManager from './components/Skills/SkillsManager';
import SkillEditor from './components/Skills/SkillEditor';
import Main from './components/Main/Main';
import SideBar from './components/SideBar/SideBar';

const AppRouter = () => {
  const [currentRoute, setCurrentRoute] = useState(getCurrentRoute());
  const [routeParams, setRouteParams] = useState(null);

  // 监听路由变化
  useEffect(() => {
    const handleHashChange = () => {
      const route = getCurrentRoute();
      setCurrentRoute(route);

      // 提取路由参数
      const match = route.match(/^\/skills\/([^\/]+)\/([^\/]+)$/);
      setRouteParams(match ? { id: match[1], action: match[2] } : null);
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

    // 技能管理页面
    if (route === '/skills') {
      console.log('渲染技能管理页面');
      return (
        <div className="app-container">
          <SideBar />
          <div className="main-content">
            <SkillsManager />
          </div>
        </div>
      );
    }

    // 新建技能页面
    if (route === '/skills/new') {
      return (
        <div className="app-container">
          <SideBar />
          <div className="main-content">
            <SkillEditor />
          </div>
        </div>
      );
    }

    // 编辑技能页面
    if (route.startsWith('/skills/') && route.endsWith('/edit')) {
      const id = route.split('/')[2];
      return (
        <div className="app-container">
          <SideBar />
          <div className="main-content">
            <SkillEditor skillId={id} />
          </div>
        </div>
      );
    }

    // 使用技能页面（参数输入）
    if (route.startsWith('/skills/') && route.endsWith('/use')) {
      const id = route.split('/')[2];
      return (
        <div className="app-container">
          <SideBar />
          <div className="main-content">
            {/* SkillParameterForm 已移除，技能使用功能已简化 */}
          </div>
        </div>
      );
    }

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