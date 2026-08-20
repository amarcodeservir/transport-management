import { Link } from "react-router-dom";

const cards = [
  { title: "Vehicles", description: "Manage truck and van registration, capacity, and expiry details.", href: "/dashboard/fleet/vehicles" },
  { title: "Drivers", description: "Track driver licences, contact details, and status.", href: "/dashboard/fleet/drivers" },
  { title: "Trips", description: "Plan trip routes and attach vehicles and drivers.", href: "/dashboard/fleet/trips" },
  { title: "Fuel Logs", description: "Log fuel fills and odometer readings.", href: "/dashboard/fleet/fuel" },
  { title: "Maintenance", description: "Track service history and upcoming maintenance.", href: "/dashboard/fleet/maintenance" },
  { title: "Documents", description: "Manage insurance, fitness, permits and expiry reminders.", href: "/dashboard/fleet/documents" },
];

export default function FleetHome() {
  return (
    <div className="min-h-screen bg-orange-50/30 p-4 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-orange-100">
          <h1 className="text-3xl font-bold text-slate-900">Fleet Management</h1>
          <p className="mt-2 text-sm text-slate-500">
            Vehicles, drivers, trips, fuel logs, maintenance and documents all in one place.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.title}
              to={card.href}
              className="rounded-3xl border border-orange-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="text-sm font-semibold uppercase tracking-[0.3em] text-[#EF8B1C]">{card.title}</div>
              <p className="mt-4 text-sm text-slate-600 leading-6">{card.description}</p>
              <div className="mt-6 text-sm font-semibold text-[#1B2A5B]">Open {card.title} →</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
