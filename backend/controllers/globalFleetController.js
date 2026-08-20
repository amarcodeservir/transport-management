import Vehicle from "../model/Vehicle.js";
import Driver from "../model/Driver.js";
import Trip from "../model/Trip.js";
import Organization from "../model/Organization.js";

export const getGlobalFleet = async (req, res) => {
  try {
    const { organization_id, status, search } = req.query;
    const filter = {};

    if (organization_id) filter.organization_id = organization_id;
    if (status) filter.status = status;

    const vehicleFilter = { ...filter };
    const driverFilter = { ...filter };
    const tripFilter = { ...filter };

    if (search) {
      const regex = new RegExp(search, "i");
      vehicleFilter.$or = [{ vehicle_number: regex }, { vehicle_type: regex }, { brand: regex }];
      driverFilter.$or = [{ name: regex }, { mobile: regex }, { license_number: regex }];
      tripFilter.$or = [{ trip_number: regex }];
    }

    const vehicleDocs = await Vehicle.find(vehicleFilter).populate("organization_id", "name").sort({ updated_at: -1 });
    const driverDocs = await Driver.find(driverFilter).populate("organization_id", "name").sort({ updated_at: -1 });
    const tripDocs = await Trip.find(tripFilter)
      .populate("organization_id", "name")
      .populate("vehicle_id", "vehicle_number")
      .populate("driver_id", "name")
      .sort({ updated_at: -1 })
      .limit(300);

    const vehicles = vehicleDocs.map((v) => ({
      ...v.toJSON(),
      organization_id: v.organization_id?._id?.toString() || null,
      organization_name: v.organization_id?.name || null,
    }));
    const drivers = driverDocs.map((d) => ({
      ...d.toJSON(),
      organization_id: d.organization_id?._id?.toString() || null,
      organization_name: d.organization_id?.name || null,
    }));
    const trips = tripDocs.map((t) => ({
      ...t.toJSON(),
      organization_id: t.organization_id?._id?.toString() || null,
      vehicle_id: t.vehicle_id?._id?.toString() || null,
      driver_id: t.driver_id?._id?.toString() || null,
      organization_name: t.organization_id?.name || null,
      vehicle_number: t.vehicle_id?.vehicle_number || null,
      driver_name: t.driver_id?.name || null,
    }));

    const summaryOrgFilter = organization_id ? { organization_id } : {};
    const totalVehicles = await Vehicle.countDocuments(summaryOrgFilter);
    const totalDrivers = await Driver.countDocuments(summaryOrgFilter);
    const activeTrips = await Trip.countDocuments({
      ...summaryOrgFilter,
      status: { $in: ["Booked", "Planned", "In Progress", "In Transit", "OUT_FOR_DELIVERY", "ACCEPTED"] },
    });
    const availableVehicles = await Vehicle.countDocuments({ ...summaryOrgFilter, status: "AVAILABLE" });
    const availableDrivers = await Driver.countDocuments({ ...summaryOrgFilter, status: "AVAILABLE" });

    const organizations = await Organization.find().select("name code").sort({ name: 1 });

    res.json({
      success: true,
      data: {
        vehicles,
        drivers,
        trips,
        summary: {
          vehicles: totalVehicles,
          drivers: totalDrivers,
          active_trips: activeTrips,
          available_vehicles: availableVehicles,
          available_drivers: availableDrivers,
        },
        organizations,
      },
    });
  } catch (error) {
    console.error("Global fleet error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch global fleet", error: error.message });
  }
};
