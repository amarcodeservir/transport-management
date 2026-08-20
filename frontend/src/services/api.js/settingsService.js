import api from "../axiosInstance.js";
export const getMyOrganization = async () => (await api.get("/organizations/me")).data;
export const updateMyOrganization = async (payload) => (await api.put("/organizations/me", payload)).data;
export const getOrganizationBranding = async () => (await api.get("/organizations/branding")).data;
export const uploadMyBrandingAssets = async ({ logoFile, faviconFile }) => {
  const formData = new FormData();
  if (logoFile) formData.append("logo_file", logoFile);
  if (faviconFile) formData.append("favicon_file", faviconFile);
  return (await api.post("/organizations/me/branding-assets", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })).data;
};
