import React from "react";

export default function ShipmentReport() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Shipment Reports</h1>
              <p className="text-sm text-slate-500 mt-1">Generate shipment performance and tracking reports.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: "Monthly Shipments", value: "312", description: "Shipments created this month" },
              { title: "Delivered Rate", value: "94%", description: "Percentage delivered on time" },
              { title: "Late Shipments", value: "18", description: "Shipments delayed this month" },
            ].map((card) => (
              <div key={card.title} className="rounded-3xl bg-slate-50 border border-slate-200 p-5">
                <p className="text-sm text-slate-500">{card.title}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{card.value}</p>
                <p className="mt-2 text-sm text-slate-500">{card.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg font-semibold text-slate-900">Shipment Analytics</h2>
            <p className="mt-2 text-sm text-slate-500">Download report summaries, export AWB performance, and track delivery efficiency.</p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <button className="rounded-2xl bg-[#F7941D] px-4 py-3 text-sm font-semibold text-white hover:bg-[#dd7e0f] transition-colors">Download Summary</button>
              <button className="rounded-2xl bg-white border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-colors">Export AWB Report</button>
              <button className="rounded-2xl bg-white border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-colors">View Delivery Trends</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
