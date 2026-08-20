import api from "../axiosInstance.js";

export const getNearbyTransporters = async ({ lat, lng, radius = 25 }) => {
  const response = await api.get("/transporters/nearby", { params: { lat, lng, radius } });
  return response.data;
};

export const createTransportBooking = async (payload) => {
  const response = await api.post("/transporters/bookings", payload);
  return response.data;
};
