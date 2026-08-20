import api from "../axiosInstance.js";

export const getSubscriptions = async (params = {}) => (await api.get("/subscriptions", { params })).data;
export const updateSubscription = async (organizationId, payload) => (await api.put(`/subscriptions/${organizationId}`, payload)).data;
