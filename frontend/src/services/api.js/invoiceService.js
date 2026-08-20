import api from "../axiosInstance.js";
export const getInvoices = async () => (await api.get("/invoices")).data;
export const getInvoiceTemplate = async (id) => (await api.get(`/invoices/${id}/template`, { responseType: "text" })).data;
export const getInvoiceById = async (id) => (await api.get(`/invoices/${id}`)).data;
export const getInvoiceShipments = async () => (await api.get("/invoices/shipments")).data;
export const createInvoice = async (payload) => (await api.post("/invoices", payload)).data;
export const updateInvoiceStatus = async (id, status) => (await api.patch(`/invoices/${id}/status`, { status })).data;