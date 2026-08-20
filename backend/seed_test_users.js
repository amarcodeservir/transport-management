import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "./model/User.js";
import Organization from "./model/Organization.js";
import OrganizationSubscription from "./model/OrganizationSubscription.js";
import Driver from "./model/Driver.js";
import Vehicle from "./model/Vehicle.js";

const DEFAULT_PASSWORD = "Password@123";

const seedTestAccounts = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/transport_management";
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB Atlas!");

    // 1. Ensure Default Active Organization
    let org = await Organization.findOne({ code: "GLOBALEX" });
    if (!org) {
      org = await Organization.create({
        name: "Globalex Logistics Pvt Ltd",
        code: "GLOBALEX",
        email: "contact@globalex.com",
        phone: "+91-9876543210",
        address: "Globalex Logistics Hub, Sector 62",
        city: "Noida",
        state: "Uttar Pradesh",
        country: "India",
        pincode: "201309",
        status: "Active",
        primary_color: "#0E60A8",
        secondary_color: "#0A2342",
        accent_color: "#F7941D",
        browser_title: "Globalex Logistics - Reliable Transport",
      });
      console.log("Created Default Organization:", org.name);
    }

    // 2. Ensure Subscription
    let sub = await OrganizationSubscription.findOne({ organization_id: org._id });
    if (!sub) {
      sub = await OrganizationSubscription.create({
        organization_id: org._id,
        plan: "ENTERPRISE",
        status: "ACTIVE",
        billing_cycle: "YEARLY",
        start_date: new Date(),
        price: 9999,
        max_admins: 10,
        max_users: 200,
        max_vehicles: 100,
        max_shipments_per_month: 5000,
      });
      console.log("Created Active Enterprise Subscription");
    }

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // 3. Super Admin
    let superAdmin = await User.findOne({ role: "super_admin" });
    if (!superAdmin) {
      superAdmin = await User.create({
        name: "Global Super Admin",
        email: "superadmin@globalex.com",
        phone: "+91-9999999999",
        password: hashedPassword,
        role: "super_admin",
        organization_id: null,
        status: "Active",
      });
      console.log("Created Super Admin:", superAdmin.email);
    } else {
      superAdmin.password = hashedPassword;
      superAdmin.status = "Active";
      await superAdmin.save();
    }

    // 4. Organization Admin
    let orgAdmin = await User.findOne({ email: "admin@globalex.com" });
    if (!orgAdmin) {
      orgAdmin = await User.create({
        name: "Globalex Org Admin",
        email: "admin@globalex.com",
        phone: "+91-9876543211",
        password: hashedPassword,
        role: "organization_admin",
        organization_id: org._id,
        status: "Active",
      });
      console.log("Created Organization Admin:", orgAdmin.email);
    } else {
      orgAdmin.password = hashedPassword;
      orgAdmin.organization_id = org._id;
      orgAdmin.status = "Active";
      await orgAdmin.save();
    }

    // 5. Driver Account & Profile
    let driverUser = await User.findOne({ email: "driver@globalex.com" });
    if (!driverUser) {
      driverUser = await User.create({
        name: "Rajesh Kumar (Driver)",
        email: "driver@globalex.com",
        phone: "+91-9876543212",
        password: hashedPassword,
        role: "driver",
        organization_id: org._id,
        status: "Active",
      });
      console.log("Created Driver User:", driverUser.email);
    } else {
      driverUser.password = hashedPassword;
      driverUser.organization_id = org._id;
      driverUser.status = "Active";
      await driverUser.save();
    }

    let driverProfile = await Driver.findOne({ user_id: driverUser._id });
    if (!driverProfile) {
      driverProfile = await Driver.create({
        name: "Rajesh Kumar",
        mobile: "+91-9876543212",
        license_number: "DL-1420260012345",
        license_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        address: "Fleet Quarters, Sector 62, Noida",
        status: "AVAILABLE",
        organization_id: org._id,
        user_id: driverUser._id,
      });
      console.log("Created Driver Profile:", driverProfile.license_number);
    }

    // 6. Customer Account
    let customerUser = await User.findOne({ email: "customer@globalex.com" });
    if (!customerUser) {
      customerUser = await User.create({
        name: "Amit Sharma (Customer)",
        email: "customer@globalex.com",
        phone: "+91-9876543213",
        password: hashedPassword,
        role: "customer",
        organization_id: org._id,
        status: "Active",
      });
      console.log("Created Customer User:", customerUser.email);
    } else {
      customerUser.password = hashedPassword;
      customerUser.organization_id = org._id;
      customerUser.status = "Active";
      await customerUser.save();
    }

    // 7. Demo Vehicle
    let vehicle = await Vehicle.findOne({ vehicle_number: "UP-16-GX-2026" });
    if (!vehicle) {
      vehicle = await Vehicle.create({
        vehicle_number: "UP-16-GX-2026",
        vehicle_type: "Container Truck 32Ft",
        brand: "Tata Motors",
        model: "Signa 4825.TK",
        capacity: "25 Tons",
        fuel_type: "Diesel",
        status: "AVAILABLE",
        organization_id: org._id,
      });
      console.log("Created Demo Vehicle:", vehicle.vehicle_number);
    }

    console.log("\n==========================================");
    console.log("   ALL TEST ROLE ACCOUNTS CREATED SUCCESSFULLY ");
    console.log("==========================================");
    console.log("Common Password for ALL roles: Password@123\n");
    console.log("1. SUPER ADMIN:");
    console.log("   Email: superadmin@globalex.com");
    console.log("   Role:  super_admin\n");
    console.log("2. ORGANIZATION ADMIN:");
    console.log("   Email: admin@globalex.com");
    console.log("   Role:  organization_admin\n");
    console.log("3. DRIVER:");
    console.log("   Email: driver@globalex.com");
    console.log("   Role:  driver\n");
    console.log("4. CUSTOMER:");
    console.log("   Email: customer@globalex.com");
    console.log("   Role:  customer\n");
    console.log("==========================================\n");

    process.exit(0);
  } catch (error) {
    console.error("Failed to seed test accounts:", error);
    process.exit(1);
  }
};

seedTestAccounts();
