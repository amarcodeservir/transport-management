import api from "../axiosInstance.js";

export const getAssignments = async (params = {}) => (await api.get("/assignments", { params })).data;
export const createAssignment = async (data) => (await api.post("/assignments", data)).data;
export const updateAssignmentStatus = async (id, status, remarks = "") => (await api.patch(`/assignments/${id}/status`, { status, remarks })).data;