import api from "../axiosInstance.js";

// Get all customers
export const getAllCustomers = async () => {
  const response = await api.get("/customers");
  return response.data;
};

// Get customer by ID
export const getCustomerById = async (id) => {
  const response = await api.get(`/customers/${id}`);
  return response.data;
};

// Create new customer
export const createCustomer = async (customerData) => {
  const response = await api.post("/customers", customerData);
  return response.data;
};

// Update customer
export const updateCustomer = async (id, customerData) => {
  const response = await api.put(`/customers/${id}`, customerData);
  return response.data;
};

// Delete customer
export const deleteCustomer = async (id) => {
  const response = await api.delete(`/customers/${id}`);
  return response.data;
};

// Toggle customer status (active/inactive)
export const toggleCustomerStatus = async (id, status) => {
  const response = await api.patch(`/customers/${id}/status`, { status });
  return response.data;
};
