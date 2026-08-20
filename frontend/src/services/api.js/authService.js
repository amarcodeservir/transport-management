import api from "../axiosInstance.js";

export const loginUser = async (email, password) => {
  const response = await api.post("/auth/login", { email, password });
  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.post("/auth/change-password", { currentPassword, newPassword });
  return response.data;
};
