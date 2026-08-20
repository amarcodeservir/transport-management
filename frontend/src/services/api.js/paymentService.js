import api from "../axiosInstance.js";
export const getPayments = async () => (await api.get("/payments")).data;
export const getPaymentInvoices = async () => (await api.get("/payments/invoices")).data;
export const createPayment = async (payload) => (await api.post("/payments", payload)).data;
export const updatePayment = async (id, payload) => (await api.put(`/payments/${id}`, payload)).data;
export const deletePayment = async (id) => (await api.delete(`/payments/${id}`)).data;
