import User from "./User.js";
import Organization from "./Organization.js";
import OrganizationSubscription from "./OrganizationSubscription.js";
import Vehicle from "./Vehicle.js";
import Driver from "./Driver.js";
import Shipment from "./Shipment.js";
import ShipmentParty from "./ShipmentParty.js";
import ShipmentPackage from "./ShipmentPackage.js";
import ShipmentItem from "./ShipmentItem.js";
import ShipmentCharge from "./ShipmentCharge.js";
import ShipmentTracking from "./ShipmentTracking.js";
import ShipmentAssignment from "./ShipmentAssignment.js";
import Trip from "./Trip.js";
import FuelLog from "./FuelLog.js";
import Maintenance from "./Maintenance.js";
import VehicleDocument from "./VehicleDocument.js";
import Invoice from "./Invoice.js";
import Payment from "./Payment.js";
import Notification from "./Notification.js";
import ActivityLog from "./ActivityLog.js";
import TransportBooking from "./TransportBooking.js";

export {
  User,
  Organization,
  OrganizationSubscription,
  Vehicle,
  Driver,
  Shipment,
  ShipmentParty,
  ShipmentPackage,
  ShipmentItem,
  ShipmentCharge,
  ShipmentTracking,
  ShipmentAssignment,
  Trip,
  FuelLog,
  Maintenance,
  VehicleDocument,
  Invoice,
  Payment,
  Notification,
  ActivityLog,
  TransportBooking,
};

export const syncDatabase = async () => {
  try {
    // Ensure all existing organizations have an active starter subscription record
    const organizations = await Organization.find();
    for (const org of organizations) {
      const existingSub = await OrganizationSubscription.findOne({ organization_id: org._id });
      if (!existingSub) {
        await OrganizationSubscription.create({
          organization_id: org._id,
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
      }
    }
    console.log("--- Mongoose Models & Default Subscriptions Initialized ---");
  } catch (error) {
    console.error("--- Mongoose Sync Error ---", error.message);
  }
};
