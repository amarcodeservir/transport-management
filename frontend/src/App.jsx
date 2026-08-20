import './App.css';
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import LoginPage from './components/auth/login';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './components/dashboard';
import Customers from './components/customer';
import CustomerShipments from './components/customerShipments';
import CustomerShipmentBooking from './components/CustomerShipmentBooking';
import AllShipments from './components/AllShipments';
import ShipmentTracking from './components/ShipmentTracking';
import CustomerProfile from './components/customerProfile';
import CustomerPassword from './components/customerPassword';
import FleetHome from './components/fleet/FleetHome';
import Vehicles from './components/fleet/Vehicles';
import Drivers from './components/fleet/Drivers';
import Trips from './components/fleet/Trips';
import FuelLogs from './components/fleet/FuelLogs';
import Maintenance from './components/fleet/Maintenance';
import Documents from './components/fleet/Documents';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import Organizations from './components/superAdmin/Organizations';
import OrganizationAdmins from './components/superAdmin/OrganizationAdmins';
import OrgAdminShipments from './components/superAdmin/OrgAdminShipments';
import Assignments from './components/Assignments';
import ActiveTrips from './components/ActiveTrips';
import LiveTracking from './components/LiveTracking';
import PodDeliveries from './components/PodDeliveries';
import Invoices from './components/Invoices';
import Payments from './components/Payments';
import Reports from './components/Reports';
import Notifications from './components/Notifications';
import Settings from './components/Settings';
import GlobalOperations from './components/GlobalOperations';
import GlobalFleet from './components/GlobalFleet';
import SubscriptionManagement from './components/superAdmin/SubscriptionManagement';
import ActivityLogs from './components/superAdmin/ActivityLogs';
import NearMe from './components/nearby/NearMe';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Shared dashboard route for all roles */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin', 'organization_admin', 'customer', 'driver']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route
            path="customers"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin', 'organization_admin']}>
                <Customers />
              </ProtectedRoute>
            }
          />
          <Route path="shipments/add" element={<ProtectedRoute allowedRoles={['customer']}><CustomerShipmentBooking /></ProtectedRoute>} />
          <Route path="transport-near-me" element={<ProtectedRoute allowedRoles={['customer']}><NearMe /></ProtectedRoute>} />
          <Route path="shipments/*" element={<ProtectedRoute allowedRoles={['customer']}><Navigate replace to="/dashboard/tracking" /></ProtectedRoute>} />
          <Route
            path="admin-shipments"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin', 'organization_admin']}>
                <AllShipments />
              </ProtectedRoute>
            }
          />
          {/* Org Admin Shipment Routes — filter by status via prop */}
          <Route path="organization/shipments/all" element={<ProtectedRoute allowedRoles={['organization_admin']}><OrgAdminShipments filterStatus="ALL" /></ProtectedRoute>} />
          <Route path="organization/shipments/pending" element={<ProtectedRoute allowedRoles={['organization_admin']}><OrgAdminShipments filterStatus="PENDING" /></ProtectedRoute>} />
          <Route path="organization/shipments/unassigned" element={<ProtectedRoute allowedRoles={['organization_admin']}><OrgAdminShipments filterStatus="UNASSIGNED" /></ProtectedRoute>} />
          <Route path="organization/shipments/assigned" element={<ProtectedRoute allowedRoles={['organization_admin']}><OrgAdminShipments filterStatus="ASSIGNED" /></ProtectedRoute>} />
          <Route path="organization/shipments/in-transit" element={<ProtectedRoute allowedRoles={['organization_admin']}><OrgAdminShipments filterStatus="IN_TRANSIT" /></ProtectedRoute>} />
          <Route path="organization/shipments/out-for-delivery" element={<ProtectedRoute allowedRoles={['organization_admin']}><OrgAdminShipments filterStatus="OUT_FOR_DELIVERY" /></ProtectedRoute>} />
          <Route path="organization/shipments/delivered" element={<ProtectedRoute allowedRoles={['organization_admin']}><OrgAdminShipments filterStatus="DELIVERED" /></ProtectedRoute>} />
          <Route path="organization/shipments/completed" element={<ProtectedRoute allowedRoles={['organization_admin']}><OrgAdminShipments filterStatus="COMPLETED" /></ProtectedRoute>} />

          <Route
            path="create-shipment"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin', 'organization_admin']}>
                <CustomerShipments />
              </ProtectedRoute>
            }
          />
          <Route
            path="tracking"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <ShipmentTracking />
              </ProtectedRoute>
            }
          />
          <Route
            path="fleet"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin', 'organization_admin']}>
                <FleetHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="fleet/vehicles"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin', 'organization_admin']}>
                <Vehicles />
              </ProtectedRoute>
            }
          />
          <Route
            path="fleet/drivers"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin', 'organization_admin']}>
                <Drivers />
              </ProtectedRoute>
            }
          />
          <Route
            path="fleet/trips"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin', 'organization_admin']}>
                <Trips />
              </ProtectedRoute>
            }
          />
          <Route
            path="fleet/fuel"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin', 'organization_admin']}>
                <FuelLogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="fleet/maintenance"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin', 'organization_admin']}>
                <Maintenance />
              </ProtectedRoute>
            }
          />
          <Route
            path="fleet/documents"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin', 'organization_admin']}>
                <Documents />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="password"
            element={
              <ProtectedRoute allowedRoles={['customer', 'driver']}>
                <CustomerPassword />
              </ProtectedRoute>
            }
          />

          {/* Super Admin Routes */}
          <Route path="organizations" element={<ProtectedRoute allowedRoles={['super_admin']}><Organizations /></ProtectedRoute>} />
          <Route path="organization-admins" element={<ProtectedRoute allowedRoles={['super_admin']}><OrganizationAdmins /></ProtectedRoute>} />
          <Route path="global-operations" element={<ProtectedRoute allowedRoles={['super_admin']}><GlobalOperations /></ProtectedRoute>} />
          <Route path="global-fleet" element={<ProtectedRoute allowedRoles={['super_admin']}><GlobalFleet /></ProtectedRoute>} />
          
          {/* Shared Admin/Super Admin/Org Admin Routes */}
          <Route path="billing" element={<ProtectedRoute allowedRoles={['super_admin']}><SubscriptionManagement /></ProtectedRoute>} />
          <Route path="reports" element={<ProtectedRoute allowedRoles={['organization_admin', 'super_admin']}><Reports /></ProtectedRoute>} />
          <Route path="activity-logs" element={<ProtectedRoute allowedRoles={['super_admin']}><ActivityLogs /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute allowedRoles={['organization_admin']}><Settings /></ProtectedRoute>} />

          {/* Org Admin Specific Routes */}
          <Route path="pod" element={<ProtectedRoute allowedRoles={['organization_admin', 'super_admin', 'driver']}><PodDeliveries /></ProtectedRoute>} />
          <Route path="notifications" element={<ProtectedRoute allowedRoles={['organization_admin', 'super_admin', 'customer', 'driver']}><Notifications /></ProtectedRoute>} />
          <Route path="operations/assignments" element={<ProtectedRoute allowedRoles={['organization_admin', 'driver']}><Assignments /></ProtectedRoute>} />
          <Route path="operations/active-trips" element={<ProtectedRoute allowedRoles={['organization_admin']}><ActiveTrips /></ProtectedRoute>} />
          <Route path="operations/live-tracking" element={<ProtectedRoute allowedRoles={['organization_admin', 'super_admin', 'driver']}><LiveTracking /></ProtectedRoute>} />
          <Route path="billing/invoices" element={<ProtectedRoute allowedRoles={['organization_admin', 'super_admin']}><Invoices /></ProtectedRoute>} />
          <Route path="billing/payments" element={<ProtectedRoute allowedRoles={['organization_admin', 'super_admin']}><Payments /></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
