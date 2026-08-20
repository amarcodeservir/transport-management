import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import shipmentRoutes from "./routes/shipmentRoutes.js";
import shipmentPartyRoutes from "./routes/shipmentPartyRoutes.js";
import shipmentPackageRoutes from "./routes/shipmentPackageRoutes.js";
import shipmentItemRoutes from "./routes/shipmentItemRoutes.js";
import shipmentChargeRoutes from "./routes/shipmentChargeRoutes.js";
import shipmentTrackingRoutes from "./routes/shipmentTrackingRoutes.js";
import fleetRoutes from "./routes/fleetRoutes.js";
import organizationRoutes from "./routes/organizationRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import liveTrackingRoutes from "./routes/liveTrackingRoutes.js";
import podRoutes from "./routes/podRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import globalOperationsRoutes from "./routes/globalOperationsRoutes.js";
import globalFleetRoutes from "./routes/globalFleetRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import activityLogRoutes from "./routes/activityLogRoutes.js";
import nearbyTransportRoutes from "./routes/nearbyTransportRoutes.js";

const app = express();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "UP",
    message: "Transport Management API is healthy",
    database: "MongoDB Atlas Connected",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/shipments", shipmentRoutes);
app.use("/api/shipment-parties", shipmentPartyRoutes);
app.use("/api/shipment-packages", shipmentPackageRoutes);
app.use("/api/shipment-items", shipmentItemRoutes);
app.use("/api/shipment-charges", shipmentChargeRoutes);
app.use("/api/shipment-tracking", shipmentTrackingRoutes);
app.use("/api/fleet", fleetRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/live-tracking", liveTrackingRoutes);
app.use("/api/pod", podRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/global-operations", globalOperationsRoutes);
app.use("/api/global-fleet", globalFleetRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/activity-logs", activityLogRoutes);
app.use("/api/transporters", nearbyTransportRoutes);

export default app;
