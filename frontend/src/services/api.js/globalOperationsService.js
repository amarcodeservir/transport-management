import api from "../axiosInstance.js";
export const getGlobalOperations = async (params) => (await api.get("/global-operations", { params })).data;