import axiosInstance from './axiosInstance';


export const login = (username, password) => {
  return axiosInstance.post('/login', { username, password });
};

export const register = (data) => {
  return axiosInstance.post('/register', data); // 确保传递整个对象
};
