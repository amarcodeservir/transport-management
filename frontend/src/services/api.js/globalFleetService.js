import api from "../axiosInstance.js";
export const getGlobalFleet = async (params) => (await api.get("/global-fleet", { params })).data;