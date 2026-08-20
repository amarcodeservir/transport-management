import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../model/User.js";
import Organization from "../model/Organization.js";

const normalizeRole = (role = "") => String(role).trim().toLowerCase().replace(/[-\s]+/g, "_");
const isActive = (status) => ["active", "enabled"].includes(String(status || "").trim().toLowerCase());
const cookieBaseOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
});
const cookieOptions = () => ({ ...cookieBaseOptions(), maxAge: 24 * 60 * 60 * 1000 });

export const register = async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    phone,
    company_name,
    gst_number,
    customer_type,
    address,
    city,
    state,
    country,
    pincode,
    customer_code,
    organization_code,
  } = req.body;

  const requestedRole = normalizeRole(role || "customer");
  if (requestedRole !== "customer") {
    return res.status(403).json({ message: "Public registration is available for customers only." });
  }

  if (!name || !email || !password || !organization_code) {
    return res.status(400).json({ message: "Name, email, password and organization code are required" });
  }

  try {
    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const organization = await Organization.findOne({ code: String(organization_code).trim().toUpperCase() });
    if (!organization || !isActive(organization.status)) {
      return res.status(404).json({ message: "Active organization code not found" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const normalizedRole = "customer";
    const nextCustomerCode = customer_code || `CUST-${Date.now()}`;

    const newUser = await User.create({
      customer_code: nextCustomerCode,
      name,
      email: normalizedEmail,
      phone,
      password: hashedPassword,
      role: normalizedRole,
      company_name,
      gst_number,
      customer_type: customer_type || "Retail",
      organization_id: organization._id,
      address,
      city,
      state,
      country,
      pincode,
      status: "Active",
    });

    res.status(201).json({ message: "User registered successfully", userId: newUser.id });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Please provide email and password" });
  }

  try {
    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!isActive(user.status)) {
      return res.status(403).json({ message: "Your account is inactive. Contact your administrator." });
    }

    const normalizedUserRole = normalizeRole(user.role);
    if (["organization_admin", "driver"].includes(normalizedUserRole) && !user.organization_id) {
      return res.status(403).json({ message: "Your account is not linked to an organization." });
    }
    if (user.organization_id && normalizedUserRole !== "super_admin") {
      const organization = await Organization.findById(user.organization_id);
      if (!organization || !isActive(organization.status)) {
        return res.status(403).json({ message: "Your organization is inactive or unavailable." });
      }
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Authentication is not configured on the server." });
    }

    const token = jwt.sign(
      { id: user.id, role: normalizedUserRole, organization_id: user.organization_id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, cookieOptions()).status(200).json({
      message: "User logged in successfully",
      token,
      user: {
        id: user.id,
        customer_code: user.customer_code,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: normalizedUserRole,
        company_name: user.company_name,
        gst_number: user.gst_number,
        customer_type: user.customer_type,
        organization_id: user.organization_id,
        address: user.address,
        city: user.city,
        state: user.state,
        country: user.country,
        pincode: user.pincode,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = (req, res) => {
  try {
    res.clearCookie("token", cookieBaseOptions());
    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
