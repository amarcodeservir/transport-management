import api from "../axiosInstance.js";
export const getDeliveries = async () => (await api.get("/pod/deliveries")).data;
export const submitPod = async (id, payload) => {
  const formData = new FormData();
  formData.append("pod_file", payload.pod_file);
  formData.append("remarks", payload.remarks || "");
  return (await api.post(`/pod/${id}/submit`, formData, { headers: { "Content-Type": "multipart/form-data" } })).data;
};
export const getPodFile = async (filename) => (await api.get(`/pod/files/${encodeURIComponent(filename)}`, { responseType: "blob" })).data;
export const updateDeliveryStatus = async (id, payload) => (await api.patch(`/pod/${id}/status`, payload)).data;
