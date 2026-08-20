import React from "react";

export default function Fuel() {
  return (
    <div className="min-h-screen bg-orange-50/40 p-4 lg:p-8">
      <div className="mx-auto max-w-[1400px] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Fuel Management</h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              Log and track fuel consumption.
            </p>
          </div>
          <button className="self-start sm:self-auto inline-flex items-center gap-2 rounded-xl bg-[#ef8b1c] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#f66402] hover:text-white transition">
            + Add Fuel Log
          </button>
        </div>

        <div className="rounded-2xl bg-white border border-neutral-200 shadow-sm overflow-hidden p-20 flex justify-center items-center">
          <div className="text-center text-neutral-400 text-sm">
            No fuel logs found.
          </div>
        </div>
      </div>
    </div>
  );
}
