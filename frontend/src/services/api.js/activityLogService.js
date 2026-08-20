import api from "../axiosInstance.js";

export const getActivityLogs = async (params = {}) => (await api.get("/activity-logs", { params })).data;
