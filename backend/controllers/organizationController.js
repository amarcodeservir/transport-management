import Organization from "../model/Organization.js";
import User from "../model/User.js";
import Vehicle from "../model/Vehicle.js";
import Driver from "../model/Driver.js";
import Shipment from "../model/Shipment.js";
import Trip from "../model/Trip.js";
import Invoice from "../model/Invoice.js";
import Payment from "../model/Payment.js";
import VehicleDocument from "../model/VehicleDocument.js";
import bcrypt from "bcrypt";
import OrganizationSubscription from "../model/OrganizationSubscription.js";
import { recordActivity } from "../utils/activityLogger.js";
import { checkSubscriptionLimit } from "../utils/subscriptionLimits.js";
import path from "path";
import {
  BRANDING_FILE_PREFIX,
  BRANDING_UPLOAD_DIR,
  getStoredBrandingFilename,
  removeBrandingFile,
} from "../middlelware/brandingUpload.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

const themeFields = ["primary_color", "secondary_color", "accent_color"];
const organizationSettingFields = [
  "name",
  "code",
  "gst_number",
  "pan_number",
  "cin_number",
  "email",
  "phone",
  "website",
  "address",
  "city",
  "state",
  "country",
  "pincode",
  "logo",
  "browser_title",
  "favicon",
  ...themeFields,
  "timezone",
  "currency",
  "date_format",
  "invoice_prefix",
  "support_email",
  "billing_email",
  "bank_name",
  "bank_account_number",
  "bank_ifsc",
  "bank_branch",
  "payment_terms",
  "owner_name",
  "location",
  "service_areas",
  "service_types",
  "opening_hours",
  "whatsapp",
];

const requestFiles = (req) => Object.values(req.files || {}).flat();

const normalizeThemeUpdate = (updateData) => {
  for (const field of themeFields) {
    if (updateData[field] === undefined) continue;
    const color = String(updateData[field] || "")
      .trim()
      .toUpperCase();
    if (!/^#[0-9A-F]{6}$/.test(color)) return field;
    updateData[field] = color;
  }
  return null;
};

const validateLocationUpdate = (location) => {
  if (location === undefined || location === null) return null;
  const coordinates = location?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length !== 2)
    return "Location coordinates must be [longitude, latitude]";
  const [lng, lat] = coordinates.map(Number);
  if (!Number.isFinite(lng) || lng < -180 || lng > 180)
    return "Longitude must be between -180 and 180";
  if (!Number.isFinite(lat) || lat < -90 || lat > 90)
    return "Latitude must be between -90 and 90";
  location.type = "Point";
  location.coordinates = [lng, lat];
  return null;
};

export const viewBrandingAsset = async (req, res) => {
  try {
    const reference = `${BRANDING_FILE_PREFIX}${req.params.filename}`;
    const filename = getStoredBrandingFilename(reference);
    if (!filename)
      return res
        .status(400)
        .json({ success: false, message: "Invalid branding file" });

    const organization = await Organization.findOne({
      $or: [
        { logo: `${BRANDING_FILE_PREFIX}${filename}` },
        { favicon: `${BRANDING_FILE_PREFIX}${filename}` },
      ],
    });
    if (!organization)
      return res
        .status(404)
        .json({ success: false, message: "Branding file not found" });

    const filePath = path.join(BRANDING_UPLOAD_DIR, filename);
    res.set("Cache-Control", "public, max-age=86400");
    return res.sendFile(filePath);
  } catch (error) {
    if (error.code === "ENOENT")
      return res
        .status(404)
        .json({ success: false, message: "Branding file is missing" });
    return res
      .status(500)
      .json({ success: false, message: "Failed to open branding file" });
  }
};

export const getOrganizationBranding = async (req, res) => {
  try {
    if (!req.user?.organization_id) {
      return res.json({
        success: true,
        data: {
          name: "Difmo Logistics",
          logo: null,
          browser_title: "Difmo Logistics",
          favicon: null,
          primary_color: "#F7941D",
          secondary_color: "#1B2A5B",
          accent_color: "#2563EB",
          is_default: true,
        },
      });
    }
    const organization = await Organization.findById(req.user.organization_id);
    if (!organization)
      return res
        .status(404)
        .json({ success: false, message: "Organization not found" });
    return res.json({ success: true, data: organization });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch organization branding",
        error: error.message,
      });
  }
};

export const getMyOrganization = async (req, res) => {
  try {
    const organization = await Organization.findById(req.user.organization_id);
    if (!organization)
      return res
        .status(404)
        .json({ success: false, message: "Organization not found" });
    res.json({ success: true, data: organization });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch organization settings",
        error: error.message,
      });
  }
};

export const updateMyOrganization = async (req, res) => {
  try {
    const organization = await Organization.findById(req.user.organization_id);
    if (!organization)
      return res
        .status(404)
        .json({ success: false, message: "Organization not found" });

    const previousBranding = {
      logo: organization.logo,
      favicon: organization.favicon,
    };
    const updateData = {};
    for (const key of organizationSettingFields) {
      if (req.body[key] !== undefined) updateData[key] = req.body[key];
    }
    const invalidThemeField = normalizeThemeUpdate(updateData);
    if (invalidThemeField) {
      return res
        .status(400)
        .json({
          success: false,
          message: `${invalidThemeField} must be a valid hex color`,
        });
    }
    const locationError = validateLocationUpdate(updateData.location);
    if (locationError)
      return res.status(400).json({ success: false, message: locationError });
    if (updateData.browser_title !== undefined) {
      updateData.browser_title =
        String(updateData.browser_title || "")
          .trim()
          .slice(0, 120) || null;
    }

    Object.assign(organization, updateData);
    await organization.save();

    await Promise.all(
      ["logo", "favicon"].map((key) =>
        updateData[key] !== undefined &&
        previousBranding[key] !== organization[key]
          ? removeBrandingFile(previousBranding[key])
          : Promise.resolve(),
      ),
    );

    await recordActivity({
      req,
      organizationId: organization._id,
      action: "ORGANIZATION_SETTINGS_UPDATED",
      entityType: "organization",
      entityId: organization.id,
      description: `Organization ${organization.name} settings updated`,
      metadata: { fields: Object.keys(updateData) },
    });

    return res.json({
      success: true,
      message: "Organization settings updated",
      data: organization,
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to update organization settings",
        error: error.message,
      });
  }
};

export const uploadMyBrandingAssets = async (req, res) => {
  const uploadedFiles = requestFiles(req);
  try {
    if (!uploadedFiles.length) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Logo ya favicon file select karein",
        });
    }
    const organization = await Organization.findById(req.user.organization_id);
    if (!organization) {
      await Promise.all(
        uploadedFiles.map((file) => removeBrandingFile(file.path)),
      );
      return res
        .status(404)
        .json({ success: false, message: "Organization not found" });
    }

    const logoFile = req.files?.logo_file?.[0];
    const faviconFile = req.files?.favicon_file?.[0];
    const previousBranding = {
      logo: organization.logo,
      favicon: organization.favicon,
    };
    const updateData = {};

    if (logoFile) {
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        updateData.logo = await uploadToCloudinary(
          logoFile.path,
          "transport_management/branding",
        );
      } else {
        updateData.logo = `${BRANDING_FILE_PREFIX}${logoFile.filename}`;
      }
    }

    if (faviconFile) {
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        updateData.favicon = await uploadToCloudinary(
          faviconFile.path,
          "transport_management/branding",
        );
      } else {
        updateData.favicon = `${BRANDING_FILE_PREFIX}${faviconFile.filename}`;
      }
    }

    Object.assign(organization, updateData);
    await organization.save();

    await Promise.all(
      Object.keys(updateData).map((key) =>
        removeBrandingFile(previousBranding[key]),
      ),
    );

    await recordActivity({
      req,
      organizationId: organization._id,
      action: "ORGANIZATION_BRANDING_UPDATED",
      entityType: "organization",
      entityId: organization.id,
      description: `Organization ${organization.name} branding uploaded`,
      metadata: { assets: Object.keys(updateData) },
    });

    return res.json({
      success: true,
      message: "Branding assets uploaded successfully",
      data: organization,
    });
  } catch (error) {
    await Promise.all(
      uploadedFiles.map((file) => removeBrandingFile(file.path)),
    );
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to upload branding assets",
        error: error.message,
      });
  }
};

export const createOrganization = async (req, res) => {
  try {
    const {
      name,
      code,
      gst_number,
      pan_number,
      email,
      phone,
      address,
      city,
      state,
      country,
      pincode,
      status,
    } = req.body;

    if (!name || !code) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Organization name and code are required",
        });
    }

    const normalizedCode = String(code).trim().toUpperCase();
    const existing = await Organization.findOne({ code: normalizedCode });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "Organization code already exists" });
    }

    const organization = await Organization.create({
      name: String(name).trim(),
      code: normalizedCode,
      gst_number: gst_number || null,
      pan_number: pan_number || null,
      email: email || null,
      phone: phone || null,
      address: address || null,
      city: city || null,
      state: state || null,
      country: country || null,
      pincode: pincode || null,
      status: status || "Active",
    });

    await OrganizationSubscription.create({
      organization_id: organization._id,
      plan: "STARTER",
      status: "ACTIVE",
      billing_cycle: "MONTHLY",
      start_date: new Date(),
      price: 0,
      max_admins: 2,
      max_users: 50,
      max_vehicles: 25,
      max_shipments_per_month: 500,
    });

    res
      .status(201)
      .json({
        success: true,
        message: "Organization created successfully",
        data: organization,
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to create organization",
        error: error.message,
      });
  }
};

export const getOrganizations = async (req, res) => {
  try {
    const organizations = await Organization.find().sort({ created_at: -1 });

    const rows = await Promise.all(
      organizations.map(async (org) => {
        const doc = org.toJSON();
        const admin_count = await User.countDocuments({
          organization_id: org._id,
          role: "organization_admin",
        });
        const user_count = await User.countDocuments({
          organization_id: org._id,
        });
        const vehicle_count = await Vehicle.countDocuments({
          organization_id: org._id,
        });
        const shipment_count = await Shipment.countDocuments({
          organization_id: org._id,
        });
        const active_trip_count = await Trip.countDocuments({
          organization_id: org._id,
          status: { $ne: "Completed" },
        });
        const subscription = await OrganizationSubscription.findOne({
          organization_id: org._id,
        });

        return {
          ...doc,
          admin_count,
          user_count,
          vehicle_count,
          shipment_count,
          active_trip_count,
          subscription_plan: subscription?.plan || "STARTER",
          subscription_status: subscription?.status || "ACTIVE",
        };
      }),
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch organizations",
        error: error.message,
      });
  }
};

export const getOrganizationById = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);
    if (!organization)
      return res
        .status(404)
        .json({ success: false, message: "Organization not found" });
    res.json({ success: true, data: organization });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch organization",
        error: error.message,
      });
  }
};

export const updateOrganization = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);
    if (!organization)
      return res
        .status(404)
        .json({ success: false, message: "Organization not found" });

    const allowed = [
      "name",
      "code",
      "gst_number",
      "pan_number",
      "cin_number",
      "email",
      "phone",
      "website",
      "address",
      "city",
      "state",
      "country",
      "pincode",
      "status",
      "owner_name",
      "location",
      "service_areas",
      "service_types",
      "opening_hours",
      "whatsapp",
      "transport_profile_approved",
      "rating",
    ];
    const locationError = validateLocationUpdate(req.body.location);
    if (locationError)
      return res.status(400).json({ success: false, message: locationError });
    for (const key of allowed) {
      if (req.body[key] !== undefined) organization[key] = req.body[key];
    }

    await organization.save();
    res.json({
      success: true,
      message: "Organization updated successfully",
      data: organization,
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to update organization",
        error: error.message,
      });
  }
};

export const createOrganizationAdmin = async (req, res) => {
  try {
    const { organization_id, name, email, phone, password } = req.body;

    if (!organization_id || !name || !email || !password) {
      return res
        .status(400)
        .json({
          success: false,
          message: "organization_id, name, email and password are required",
        });
    }

    const organization = await Organization.findById(organization_id);
    if (
      !organization ||
      String(organization.status).toUpperCase() !== "ACTIVE"
    ) {
      return res
        .status(404)
        .json({ success: false, message: "Active organization not found" });
    }

    const adminLimit = await checkSubscriptionLimit(organization_id, "admins");
    if (!adminLimit.allowed)
      return res
        .status(adminLimit.statusCode)
        .json({ success: false, message: adminLimit.message });

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing)
      return res
        .status(409)
        .json({ success: false, message: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      phone: phone || null,
      password: passwordHash,
      role: "organization_admin",
      organization_id,
      status: "Active",
    });

    const data = admin.toJSON();
    delete data.password;

    res
      .status(201)
      .json({
        success: true,
        message: "Organization admin created successfully",
        data,
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to create organization admin",
        error: error.message,
      });
  }
};

export const getOrganizationAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "organization_admin" })
      .populate("organization_id", "name code")
      .select("-password")
      .sort({ created_at: -1 });

    const data = admins.map((a) => {
      const doc = a.toJSON();
      return {
        ...doc,
        organization_name: a.organization_id?.name || null,
        organization_code: a.organization_id?.code || null,
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch organization admins",
        error: error.message,
      });
  }
};

export const updateOrganizationAdmin = async (req, res) => {
  try {
    const admin = await User.findOne({
      _id: req.params.id,
      role: "organization_admin",
    });
    if (!admin)
      return res
        .status(404)
        .json({ success: false, message: "Organization admin not found" });

    const { name, phone, status } = req.body;
    if (name) admin.name = name;
    if (phone !== undefined) admin.phone = phone;
    if (status) admin.status = status;

    await admin.save();
    res.json({
      success: true,
      message: "Organization admin updated successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to update organization admin",
        error: error.message,
      });
  }
};

export const resetOrganizationAdminPassword = async (req, res) => {
  try {
    const admin = await User.findOne({
      _id: req.params.id,
      role: "organization_admin",
    });
    if (!admin)
      return res
        .status(404)
        .json({ success: false, message: "Organization admin not found" });

    const { password } = req.body;
    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Password must be at least 6 characters",
        });
    }

    admin.password = await bcrypt.hash(password, 10);
    await admin.save();

    res.json({ success: true, message: "Admin password reset successfully" });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to reset admin password",
        error: error.message,
      });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const requestedOrganizationId =
      req.user?.role === "super_admin"
        ? req.query.organization_id
        : req.user?.organization_id;
    const orgFilter = requestedOrganizationId
      ? { organization_id: requestedOrganizationId }
      : {};
    const activeShipmentStatuses = [
      "PENDING",
      "UNASSIGNED",
      "ASSIGNED",
      "IN_TRANSIT",
      "OUT_FOR_DELIVERY",
    ];
    const activeTripStatuses = [
      "Booked",
      "Planned",
      "In Progress",
      "In Transit",
      "OUT_FOR_DELIVERY",
      "ACCEPTED",
    ];
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const expiryLimit = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const [
      shipments,
      vehicles,
      drivers,
      trips,
      invoices,
      payments,
      users,
      organizations,
    ] = await Promise.all([
      Shipment.find(orgFilter)
        .populate("customer_id", "name company_name")
        .sort({ created_at: -1 }),
      Vehicle.find(orgFilter),
      Driver.find(orgFilter),
      Trip.find(orgFilter),
      Invoice.find(orgFilter),
      Payment.find(orgFilter),
      User.find(orgFilter).select("name email role status organization_id"),
      requestedOrganizationId
        ? Organization.find({ _id: requestedOrganizationId })
        : Organization.find(),
    ]);

    const statusCounts = shipments.reduce((counts, shipment) => {
      const status = shipment.current_status || "PENDING";
      counts[status] = (counts[status] || 0) + 1;
      return counts;
    }, {});
    const deliveredStatuses = ["DELIVERED", "POD_UPLOADED", "COMPLETED"];
    const deliveredShipments = deliveredStatuses.reduce(
      (sum, status) => sum + (statusCounts[status] || 0),
      0,
    );
    const invoicedAmount = invoices.reduce(
      (sum, invoice) => sum + Number(invoice.total_amount || 0),
      0,
    );
    const collectedAmount = payments
      .filter((payment) => payment.status === "COMPLETED")
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const trendMap = new Map();
    for (let offset = 29; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - offset);
      date.setHours(0, 0, 0, 0);
      trendMap.set(date.toISOString().slice(0, 10), {
        label: date.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        }),
        value: 0,
      });
    }
    shipments.forEach((shipment) => {
      const key = new Date(shipment.booking_date || shipment.created_at)
        .toISOString()
        .slice(0, 10);
      if (trendMap.has(key)) trendMap.get(key).value += 1;
    });
    const expiringDocuments = await VehicleDocument.countDocuments({
      ...orgFilter,
      expiry_date: { $gte: new Date(), $lte: expiryLimit },
    });
    const selectedOrganization = requestedOrganizationId
      ? organizations[0]
      : null;

    const organizationDetails = await Promise.all(
      organizations.map(async (organization) => {
        const id = String(organization._id);
        const orgShipments = shipments.filter(
          (item) => String(item.organization_id) === id,
        );
        const orgVehicles = vehicles.filter(
          (item) => String(item.organization_id) === id,
        );
        const orgDrivers = drivers.filter(
          (item) => String(item.organization_id) === id,
        );
        const orgTrips = trips.filter(
          (item) => String(item.organization_id) === id,
        );
        const orgInvoices = invoices.filter(
          (item) => String(item.organization_id) === id,
        );
        const orgPayments = payments.filter(
          (item) =>
            String(item.organization_id) === id && item.status === "COMPLETED",
        );
        const orgUsers = users.filter(
          (item) => String(item.organization_id) === id,
        );
        const subscription = await OrganizationSubscription.findOne({
          organization_id: organization._id,
        });
        const primaryAdmin = orgUsers.find(
          (item) => item.role === "organization_admin",
        );
        const orgInvoiced = orgInvoices.reduce(
          (sum, item) => sum + Number(item.total_amount || 0),
          0,
        );
        const orgCollected = orgPayments.reduce(
          (sum, item) => sum + Number(item.amount || 0),
          0,
        );
        return {
          id,
          name: organization.name,
          code: organization.code,
          status: organization.status,
          logo: organization.logo,
          createdAt: organization.created_at,
          contact: {
            email: organization.email,
            phone: organization.phone,
            website: organization.website,
            primaryAdminName: primaryAdmin?.name,
            primaryAdminEmail: primaryAdmin?.email,
          },
          location: {
            address: organization.address,
            city: organization.city,
            state: organization.state,
            country: organization.country,
            pincode: organization.pincode,
            timezone: organization.timezone,
          },
          compliance: {
            gstNumber: organization.gst_number,
            panNumber: organization.pan_number,
            cinNumber: organization.cin_number,
          },
          subscription: {
            plan: subscription?.plan,
            status: subscription?.status,
            billingCycle: subscription?.billing_cycle,
            startDate: subscription?.start_date,
            endDate: subscription?.end_date,
            price: subscription?.price,
            maxAdmins: subscription?.max_admins,
            maxUsers: subscription?.max_users,
            maxVehicles: subscription?.max_vehicles,
            maxShipmentsPerMonth: subscription?.max_shipments_per_month,
          },
          users: {
            admins: orgUsers.filter(
              (item) => item.role === "organization_admin",
            ).length,
            customers: orgUsers.filter((item) => item.role === "customer")
              .length,
            activeCustomers: orgUsers.filter(
              (item) =>
                item.role === "customer" && /^active$/i.test(item.status),
            ).length,
          },
          fleet: {
            vehicles: orgVehicles.length,
            availableVehicles: orgVehicles.filter(
              (item) => item.status === "AVAILABLE",
            ).length,
            drivers: orgDrivers.length,
            availableDrivers: orgDrivers.filter(
              (item) => item.status === "AVAILABLE",
            ).length,
            activeTrips: orgTrips.filter((item) =>
              activeTripStatuses.includes(item.status),
            ).length,
          },
          operations: {
            shipments: orgShipments.length,
            shipmentsThisMonth: orgShipments.filter(
              (item) =>
                new Date(item.booking_date || item.created_at) >= monthStart,
            ).length,
            activeShipments: orgShipments.filter((item) =>
              activeShipmentStatuses.includes(item.current_status),
            ).length,
            deliveredShipments: orgShipments.filter((item) =>
              deliveredStatuses.includes(item.current_status),
            ).length,
            delayedShipments: orgShipments.filter(
              (item) =>
                item.expected_delivery_date &&
                new Date(item.expected_delivery_date) < new Date() &&
                !deliveredStatuses.includes(item.current_status),
            ).length,
            needsAttention: orgShipments.filter((item) =>
              ["PENDING", "UNASSIGNED"].includes(item.current_status),
            ).length,
            lastActivity: orgShipments[0]?.updated_at,
          },
          billing: {
            invoicedAmount: orgInvoiced,
            collectedAmount: orgCollected,
            outstandingAmount: Math.max(0, orgInvoiced - orgCollected),
          },
        };
      }),
    );

    return res.json({
      success: true,
      data: {
        organization: selectedOrganization
          ? { id: selectedOrganization.id, name: selectedOrganization.name }
          : null,
        organizations: organizations.length,
        activeOrganizations: organizations.filter((item) =>
          /^active$/i.test(item.status),
        ).length,
        organizationAdmins: users.filter(
          (item) => item.role === "organization_admin",
        ).length,
        customers: users.filter((item) => item.role === "customer").length,
        vehicles: vehicles.length,
        availableVehicles: vehicles.filter(
          (item) => item.status === "AVAILABLE",
        ).length,
        drivers: drivers.length,
        availableDrivers: drivers.filter((item) => item.status === "AVAILABLE")
          .length,
        shipments: shipments.length,
        activeShipments: shipments.filter((item) =>
          activeShipmentStatuses.includes(item.current_status),
        ).length,
        pendingShipments: statusCounts.PENDING || 0,
        unassignedShipments: statusCounts.UNASSIGNED || 0,
        assignedShipments: statusCounts.ASSIGNED || 0,
        inTransitShipments: statusCounts.IN_TRANSIT || 0,
        outForDeliveryShipments: statusCounts.OUT_FOR_DELIVERY || 0,
        deliveredShipments,
        deliveredToday: shipments.filter(
          (item) =>
            deliveredStatuses.includes(item.current_status) &&
            new Date(item.updated_at) >= todayStart,
        ).length,
        delayedShipments: shipments.filter(
          (item) =>
            item.expected_delivery_date &&
            new Date(item.expected_delivery_date) < new Date() &&
            !deliveredStatuses.includes(item.current_status),
        ).length,
        activeTrips: trips.filter((item) =>
          activeTripStatuses.includes(item.status),
        ).length,
        podPending: statusCounts.DELIVERED || 0,
        expiringDocuments,
        invoicedAmount,
        collectedAmount,
        outstandingAmount: Math.max(0, invoicedAmount - collectedAmount),
        statusBreakdown: Object.entries(statusCounts).map(
          ([status, value]) => ({ status, value }),
        ),
        trend: [...trendMap.values()],
        recentShipments: shipments
          .slice(0, 8)
          .map((shipment) => ({
            ...shipment.toJSON(),
            customer_name: shipment.customer_id?.name,
            company_name: shipment.customer_id?.company_name,
          })),
        organizationDetails,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch dashboard stats",
        error: error.message,
      });
  }
};

export const deleteOrganization = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);
    if (!organization)
      return res
        .status(404)
        .json({ success: false, message: "Organization not found" });

    await Promise.all([
      User.deleteMany({ organization_id: organization._id }),
      Vehicle.deleteMany({ organization_id: organization._id }),
      Driver.deleteMany({ organization_id: organization._id }),
      Shipment.deleteMany({ organization_id: organization._id }),
      Trip.deleteMany({ organization_id: organization._id }),
      OrganizationSubscription.deleteMany({
        organization_id: organization._id,
      }),
      Organization.deleteOne({ _id: organization._id }),
    ]);

    res.json({
      success: true,
      message: "Organization and all related records deleted successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to delete organization",
        error: error.message,
      });
  }
};
