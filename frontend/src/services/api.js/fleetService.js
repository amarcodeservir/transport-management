import api from "../axiosInstance.js";

export const getVehicles = async () => {
  const response = await api.get("/fleet/vehicles");
  return response.data;
};

export const createVehicle = async (vehicleData) => {
  const response = await api.post("/fleet/vehicles", vehicleData);
  return response.data;
};

export const getDrivers = async () => {
  const response = await api.get("/fleet/drivers");
  return response.data;
};

export const createDriver = async (driverData) => {
  const response = await api.post("/fleet/drivers", driverData);
  return response.data;
};

export const linkDriverLogin = async (driverId, loginData) => {
  const response = await api.post(`/fleet/drivers/${driverId}/link-login`, loginData);
  return response.data;
};

export const resetDriverPassword = async (driverId, password) => {
  const response = await api.post(`/fleet/drivers/${driverId}/reset-password`, { password });
  return response.data;
};

export const getTrips = async (params = {}) => {
  const response = await api.get("/fleet/trips", { params });
  return response.data;
};

export const createTrip = async (tripData) => {
  const response = await api.post("/fleet/trips", tripData);
  return response.data;
};

export const getFuelLogs = async () => {
  const response = await api.get("/fleet/fuel-logs");
  return response.data;
};

export const createFuelLog = async (fuelLog) => {
  const response = await api.post("/fleet/fuel-logs", fuelLog);
  return response.data;
};

export const getMaintenanceRecords = async () => {
  const response = await api.get("/fleet/maintenance");
  return response.data;
};

export const createMaintenanceRecord = async (record) => {
  const response = await api.post("/fleet/maintenance", record);
  return response.data;
};

export const getVehicleDocuments = async () => {
  const response = await api.get("/fleet/vehicle-documents");
  return response.data;
};

export const createVehicleDocument = async (documentData) => {
  const response = await api.post("/fleet/vehicle-documents", documentData);
  return response.data;
};

export const assignShipment = async (shipmentId, data) => {
  const response = await api.post(`/shipments/${shipmentId}/assign`, data);
  return response.data;
};

export const updateTrip = async (id, data) => {
  const response = await api.put(`/fleet/trips/${id}`, data);
  return response.data;
};

export const updateVehicle = async (id, data) => (await api.put(`/fleet/vehicles/${id}`, data)).data;
export const updateDriver = async (id, data) => (await api.put(`/fleet/drivers/${id}`, data)).data;
