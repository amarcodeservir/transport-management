import api from "../axiosInstance.js";

export const getOrganizationDashboard = async (params = {}) => {
  const response = await api.get("/organizations/dashboard", { params });
  return response.data;
};

// Get all organizations
export const getAllOrganizations = async () => {
  const response = await api.get("/organizations");
  return response.data;
};

// Get organization by ID
export const getOrganizationById = async (id) => {
  const response = await api.get(`/organizations/${id}`);
  return response.data;
};

// Create new organization
export const createOrganization = async (orgData) => {
  const response = await api.post("/organizations", orgData);
  return response.data;
};

// Update organization
export const updateOrganization = async (id, orgData) => {
  const response = await api.put(`/organizations/${id}`, orgData);
  return response.data;
};

// Get all organization admins
export const getOrganizationAdmins = async () => {
  const response = await api.get("/organizations/admins");
  return response.data;
};

// Create organization admin
export const createOrganizationAdmin = async (adminData) => {
  const response = await api.post("/organizations/admins", adminData);
  return response.data;
};

export const updateOrganizationAdmin = async (id, adminData) => {
  const response = await api.put(`/organizations/admins/${id}`, adminData);
  return response.data;
};

export const resetOrganizationAdminPassword = async (id, password) => {
  const response = await api.post(`/organizations/admins/${id}/reset-password`, { password });
  return response.data;
};
