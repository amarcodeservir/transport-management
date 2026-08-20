export const normalizeRole = (role = "") => String(role).trim().toLowerCase().replace(/[-\s]+/g, "_");

export const isAdminLikeRole = (role = "") => {
  const normalizedRole = normalizeRole(role);
  return ["admin", "super_admin", "organization_admin"].includes(normalizedRole);
};

export const getDefaultOrganizationId = (user = {}, fallback = "") => {
  if (!user || !isAdminLikeRole(user.role)) {
    return fallback;
  }

  return user.organization_id ?? fallback;
};
