// src/api/axiosInstance.js
import axios from 'axios';
import router from '@/router';

// 创建Axios实例
const axiosInstance = axios.create({
  baseURL: 'http://localhost:8081/api', // 设置后端API基础URL
  timeout: 10000, // 设置请求超时时间
});

// 设置请求拦截器
axiosInstance.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken'); // 从localStorage中获取JWT令牌
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // 在请求头中添加JWT令牌
  }
  config.headers['Content-Type'] = 'application/json'; // 确保请求头包含Content-Type
  return config;
}, error => {
  return Promise.reject(error);
});

// 设置响应拦截器，自动处理未登录/失效跳转
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('authToken');
      // 可选：清除vuex用户信息
      // import store from '@/store'; store.commit('setUserInfo', null);
      router.push('/login');
    } else if (!error.response) {
      // 网络断开等情况
      localStorage.removeItem('authToken');
      router.push('/login');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
