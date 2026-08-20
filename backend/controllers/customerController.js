import bcrypt from "bcrypt";
import User from "../model/User.js";
import Organization from "../model/Organization.js";
import { checkSubscriptionLimit } from "../utils/subscriptionLimits.js";

const ALLOWED_STATUSES = new Set(["Active", "Inactive"]);
const ALLOWED_TYPES = new Set(["Retail", "Wholesale", "Corporate", "Distributor"]);

const normalize = (value, fallback = null) => {
  if (value === undefined || value === null) return fallback;
  const next = String(value).trim();
  return next.length ? next : fallback;
};

const buildPayload = (body) => ({
  customer_code: normalize(body.customer_code),
  name: normalize(body.name),
  email: normalize(body.email),
  phone: normalize(body.phone),
  password: normalize(body.password),
  role: "customer",
  company_name: normalize(body.company_name),
  gst_number: normalize(body.gst_number),
  customer_type: normalize(body.customer_type, "Retail"),
  organization_id: normalize(body.organization_id),
  address: normalize(body.address),
  city: normalize(body.city),
  state: normalize(body.state),
  country: normalize(body.country),
  pincode: normalize(body.pincode),
  status: normalize(body.status, "Active"),
});

const buildFilter = (req) => {
  const { search, status, city } = req.query;
  const filter = { role: "customer" };

  if (req.user?.role !== "super_admin") {
    filter.organization_id = req.user?.organization_id;
  }

  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [
      { customer_code: regex },
      { name: regex },
      { company_name: regex },
      { email: regex },
      { phone: regex },
      { city: regex },
    ];
  }

  if (status) filter.status = status;
  if (city) filter.city = city;

  return filter;
};

const customerRecordFilter = (req, id) => {
  const filter = { _id: id, role: "customer" };
  if (req.user?.role === "customer") {
    filter._id = req.user.id;
  } else if (req.user?.role !== "super_admin") {
    filter.organization_id = req.user?.organization_id;
  }
  return filter;
};

export const createCustomer = async (req, res) => {
  try {
    const payload = buildPayload(req.body);

    if (!payload.customer_code || !payload.name || !payload.email || !payload.phone || !payload.password || !payload.company_name) {
      return res.status(400).json({
        success: false,
        message: "customer_code, name, email, phone, password and company_name are mandatory",
      });
    }

    if (!ALLOWED_STATUSES.has(payload.status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Allowed: Active, Inactive",
      });
    }

    if (!ALLOWED_TYPES.has(payload.customer_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer type",
      });
    }

    const emailExists = await User.findOne({ email: payload.email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    if (payload.customer_code) {
      const codeExists = await User.findOne({ customer_code: payload.customer_code });
      if (codeExists) {
        return res.status(400).json({
          success: false,
          message: "Customer code already exists",
        });
      }
    }

    const customerCode = payload.customer_code || `CUST-${Date.now()}`;
    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const organizationId = req.user?.role === "organization_admin"
      ? req.user?.organization_id
      : payload.organization_id;

    if (!organizationId) {
      return res.status(400).json({ success: false, message: "organization_id is required" });
    }

    const organization = await Organization.findById(organizationId);
    if (!organization || String(organization.status).toUpperCase() !== "ACTIVE") {
      return res.status(404).json({ success: false, message: "Active organization not found" });
    }
    const userLimit = await checkSubscriptionLimit(organizationId, "users");
    if (!userLimit.allowed) return res.status(userLimit.statusCode).json({ success: false, message: userLimit.message });

    const customer = await User.create({
      customer_code: customerCode,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      password: hashedPassword,
      role: "customer",
      company_name: payload.company_name,
      gst_number: payload.gst_number,
      customer_type: payload.customer_type,
      organization_id: organizationId,
      address: payload.address,
      city: payload.city,
      state: payload.state,
      country: payload.country,
      pincode: payload.pincode,
      status: payload.status,
    });

    const data = customer.toJSON();
    delete data.password;

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data,
    });
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getAllCustomers = async (req, res) => {
  try {
    const loggedInUser = req.user;

    if (loggedInUser && loggedInUser.role === "customer") {
      const customer = await User.findOne({ _id: loggedInUser.id, role: "customer" }).select("-password");

      return res.json({
        success: true,
        data: customer ? [customer] : [],
        pagination: {
          total: customer ? 1 : 0,
          page: 1,
          limit: 1,
          totalPages: 1,
        },
      });
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const filter = buildFilter(req);
    const total = await User.countDocuments(filter);
    const customers = await User.find(filter)
      .select("-password")
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: customers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await User.findOne(customerRecordFilter(req, id)).select("-password");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = buildPayload(req.body);

    const existing = await User.findOne(customerRecordFilter(req, id));
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const emailOwner = await User.findOne({ email: payload.email, _id: { $ne: id } });
    if (emailOwner) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    if (payload.customer_code) {
      const codeOwner = await User.findOne({ customer_code: payload.customer_code, _id: { $ne: id } });
      if (codeOwner) {
        return res.status(400).json({
          success: false,
          message: "Customer code already exists",
        });
      }
    }

    let hashedPassword;
    if (payload.password) {
      hashedPassword = await bcrypt.hash(payload.password, 10);
    }

    const customerCode = payload.customer_code || existing.customer_code || `CUST-${id}`;
    const organizationId = req.user?.role === "organization_admin"
      ? req.user?.organization_id
      : req.user?.role === "customer"
        ? existing.organization_id
        : payload.organization_id;

    existing.customer_code = customerCode;
    existing.name = payload.name;
    existing.email = payload.email;
    existing.phone = payload.phone;
    if (hashedPassword) existing.password = hashedPassword;
    existing.company_name = payload.company_name;
    existing.gst_number = payload.gst_number;
    existing.customer_type = payload.customer_type;
    existing.organization_id = organizationId;
    existing.address = payload.address;
    existing.city = payload.city;
    existing.state = payload.state;
    existing.country = payload.country;
    existing.pincode = payload.pincode;
    existing.status = payload.status;

    await existing.save();

    res.json({
      success: true,
      message: "Customer updated successfully",
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await User.findOne(customerRecordFilter(req, id));

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    await User.deleteOne({ _id: id });

    res.json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!ALLOWED_STATUSES.has(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Allowed: Active, Inactive",
      });
    }

    const existing = await User.findOne(customerRecordFilter(req, id));
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    existing.status = status;
    await existing.save();

    res.json({
      success: true,
      message: `Customer status updated to ${status}`,
    });
  } catch (error) {
    console.error("Error toggling status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
