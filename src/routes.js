// 简单的路由处理函数
export const navigateTo = (path) => {
  window.location.hash = path;
};

// 当前路由
export const getCurrentRoute = () => {
  const hash = window.location.hash.slice(1) || '/';
  return hash.split('?')[0];
};