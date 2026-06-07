// 路由配置
export const routes = {
  '/skills': {
    path: '/skills',
    component: () => import('./components/Skills/SkillsManager.jsx'),
    title: '技能管理'
  },
  '/skills/new': {
    path: '/skills/new',
    component: () => import('./components/Skills/SkillEditor.jsx'),
    title: '新建技能'
  },
  '/skills/:id/edit': {
    path: '/skills/:id/edit',
    component: () => import('./components/Skills/SkillEditor.jsx'),
    title: '编辑技能'
  },
  '/skills/:id/use': {
    path: '/skills/:id/use',
    component: () => import('./components/Skills/SkillEditor.jsx'),
    title: '使用技能'
  }
};

// 简单的路由处理函数
export const navigateTo = (path) => {
  window.location.hash = path;
};

// 当前路由
export const getCurrentRoute = () => {
  const hash = window.location.hash.slice(1) || '/';
  return hash.split('?')[0];
};

// 路由参数
export const getRouteParams = () => {
  const hash = window.location.hash;
  const match = hash.match(/\/skills\/([^\/]+)\/([^\/]+)/);
  if (match) {
    return {
      id: match[1],
      action: match[2]
    };
  }
  return null;
};