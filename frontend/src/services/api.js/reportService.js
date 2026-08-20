import api from "../axiosInstance.js";
export const getReportSummary = async (params) => (await api.get("/reports/summary", { params })).data;