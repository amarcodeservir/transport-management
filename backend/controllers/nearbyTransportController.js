import mongoose from "mongoose";
import Organization from "../model/Organization.js";
import Vehicle from "../model/Vehicle.js";
import TransportBooking from "../model/TransportBooking.js";

const allowedRadii = [5, 10, 25, 50, 100];
const activeStatus = /^active$/i;

const parseNearbyQuery = (query) => {
  const lat = Number(query.lat);
  const lng = Number(query.lng);
  const radius = Number(query.radius ?? 25);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) return { error: "Latitude must be between -90 and 90" };
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) return { error: "Longitude must be between -180 and 180" };
  if (!allowedRadii.includes(radius)) return { error: "Radius must be one of 5, 10, 25, 50 or 100 kilometres" };
  return { lat, lng, radius };
};

export const getNearbyTransporters = async (req, res) => {
  try {
    const parsed = parseNearbyQuery(req.query);
    if (parsed.error) return res.status(400).json({ success: false, message: parsed.error });
    const { lat, lng, radius } = parsed;

    const organizations = await Organization.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [lng, lat] },
          key: "location",
          distanceField: "distanceMeters",
          maxDistance: radius * 1000,
          spherical: true,
          query: { status: activeStatus, transport_profile_approved: true },
        },
      },
      { $sort: { distanceMeters: 1 } },
      { $limit: 200 },
      {
        $project: {
          name: 1, owner_name: 1, phone: 1, whatsapp: 1, address: 1, city: 1, state: 1,
          country: 1, pincode: 1, logo: 1, rating: 1, service_areas: 1, service_types: 1,
          opening_hours: 1, location: 1, distanceMeters: 1,
        },
      },
    ]);

    const organizationIds = organizations.map((organization) => organization._id);
    const fleets = await Vehicle.aggregate([
      { $match: { organization_id: { $in: organizationIds }, status: { $not: /inactive|retired/i } } },
      { $group: {
        _id: "$organization_id",
        vehicleTypes: { $addToSet: "$vehicle_type" },
        capacities: { $addToSet: "$capacity" },
        vehicleCount: { $sum: 1 },
        availableVehicles: { $sum: { $cond: [{ $eq: [{ $toUpper: "$status" }, "AVAILABLE"] }, 1, 0] } },
      } },
    ]);
    const fleetByOrganization = new Map(fleets.map((fleet) => [String(fleet._id), fleet]));

    const transporters = organizations.map((organization) => {
      const fleet = fleetByOrganization.get(String(organization._id)) || {};
      const [longitude, latitude] = organization.location.coordinates;
      return {
        _id: organization._id,
        companyName: organization.name,
        ownerName: organization.owner_name,
        latitude,
        longitude,
        distanceKm: Math.round((organization.distanceMeters / 1000) * 100) / 100,
        address: [organization.address, organization.city, organization.state, organization.pincode, organization.country].filter(Boolean).join(", "),
        phone: organization.phone,
        whatsapp: organization.whatsapp || organization.phone,
        logo: organization.logo,
        rating: organization.rating,
        vehicleTypes: (fleet.vehicleTypes || []).filter(Boolean),
        capacities: (fleet.capacities || []).filter(Boolean),
        vehicleCount: fleet.vehicleCount || 0,
        availableVehicles: fleet.availableVehicles || 0,
        available: (fleet.availableVehicles || 0) > 0,
        serviceAreas: organization.service_areas || [],
        serviceTypes: organization.service_types || [],
        openingHours: organization.opening_hours,
      };
    });
    return res.json({ success: true, count: transporters.length, radius, transporters });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to find nearby transport providers", error: error.message });
  }
};

export const createTransportBooking = async (req, res) => {
  try {
    const {
      transporter_id, pickup_location, drop_location, vehicle_type, goods_type,
      approximate_weight, pickup_date, pickup_time, customer_name, phone,
    } = req.body || {};
    if (!mongoose.isValidObjectId(transporter_id)) return res.status(400).json({ success: false, message: "A valid transporter is required" });
    const required = { pickup_location, drop_location, vehicle_type, goods_type, approximate_weight, pickup_date, pickup_time, customer_name, phone };
    const missing = Object.entries(required).find(([, value]) => value === undefined || value === null || String(value).trim() === "");
    if (missing) return res.status(400).json({ success: false, message: `${missing[0]} is required` });
    const weight = Number(approximate_weight);
    if (!Number.isFinite(weight) || weight <= 0) return res.status(400).json({ success: false, message: "Approximate weight must be greater than zero" });

    const provider = await Organization.findOne({ _id: transporter_id, status: activeStatus, transport_profile_approved: true });
    if (!provider) return res.status(404).json({ success: false, message: "Active approved transporter not found" });
    const booking = await TransportBooking.create({
      customer_id: req.user.id, transporter_id, pickup_location, drop_location, vehicle_type,
      goods_type, approximate_weight: weight, pickup_date, pickup_time, customer_name, phone,
    });
    return res.status(201).json({ success: true, message: "Transport request submitted successfully", data: booking });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to submit transport request", error: error.message });
  }
};
