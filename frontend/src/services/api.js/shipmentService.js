import api from "../axiosInstance.js";

export const getShipments = async (params = {}) => {
  const response = await api.get("/shipments", { params });
  return response.data;
};

export const getShipmentById = async (id) => {
  const response = await api.get(`/shipments/${id}`);
  return response.data;
};

export const createShipment = async (shipmentData) => {
  const response = await api.post("/shipments", shipmentData);
  return response.data;
};

export const updateShipment = async (id, data) => {
  const response = await api.put(`/shipments/${id}`, data);
  return response.data;
};

export const deleteShipment = async (id) => {
  const response = await api.delete(`/shipments/${id}`);
  return response.data;
};

export const updateShipmentStatus = async (id, status) => {
  const response = await api.patch(`/shipments/${id}/status`, { status });
  return response.data;
};

export const approveShipment = async (id) => {
  const response = await api.post(`/shipments/${id}/approve`);
  return response.data;
};

export const assignShipmentToDriver = async (id, data) => {
  const response = await api.post(`/shipments/${id}/assign`, data);
  return response.data;
};

