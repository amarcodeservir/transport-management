import api from "../axiosInstance.js";
export const getLiveTracking = async () => (await api.get("/live-tracking")).data;
export const updateLiveLocation = async (shipmentId, payload) => (await api.post(`/live-tracking/${shipmentId}/location`, payload)).data;