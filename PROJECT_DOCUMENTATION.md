# Transport Management System

## 1. Project overview

The Transport Management System is a web application for managing transport companies, customers, shipments, vehicles, drivers, delivery operations, billing, and nearby transport discovery.

It supports the complete transport lifecycle:

```text
Transport organization registration
        ↓
Customer and fleet management
        ↓
Shipment or nearby transport booking
        ↓
Shipment approval
        ↓
Vehicle and driver assignment
        ↓
Pickup and transportation
        ↓
Live tracking and status updates
        ↓
Proof of Delivery
        ↓
Invoice, payment and completion
```

The system is intended for logistics companies, truck operators, local transport providers, packers and movers, fleet owners, drivers, and customers who need to book or track transport services.

---

## 2. Main user roles

### Super Admin

The Super Admin controls the entire platform.

Main responsibilities:

- Create and manage transport organizations
- Create organization administrators
- Activate or deactivate organizations
- Approve organizations for public nearby transport search
- Manage subscriptions and usage limits
- View organizations, fleets and shipments across the platform
- View global reports and activity logs

### Organization Admin

An Organization Admin manages one transport company. Organization data is separated using `organization_id`.

Main responsibilities:

- Update company information and branding
- Configure transport location and service details
- Manage customers
- Register vehicles and drivers
- Manage vehicle documents, fuel and maintenance
- Review and approve shipments
- Assign vehicles and drivers
- Monitor active trips
- Manage Proof of Delivery
- Create invoices and record payments
- View organization reports and notifications

### Customer

Customers can:

- Create shipment requests
- Find approved transport providers nearby
- Filter providers by distance, vehicle, service and availability
- View actual driving routes to selected providers
- Call or WhatsApp providers
- Submit transport booking requests
- Track their shipments
- View notifications
- Manage their profile and password

### Driver

Drivers can:

- View assigned shipments
- View live deliveries
- Update delivery progress
- Share delivery location
- Upload Proof of Delivery
- Complete assigned deliveries
- View notifications

---

## 3. Major modules

### Authentication and authorization

The application uses JSON Web Tokens for authentication. Tokens can be received through the authorization header or authentication cookie.

The backend verifies:

- The token is valid
- The user exists and is active
- The organization is active
- The organization subscription is active, where applicable
- The user has permission for the requested operation

Protected frontend pages use `ProtectedRoute`. Backend routes use `verifyToken` and `authorizeRoles`.

### Organization management

An organization represents a transport business. Its record contains:

- Company name and code
- GST, PAN and contact details
- Full address
- Branding and theme colors
- Billing settings
- Public transport profile
- Geographic coordinates
- Service areas and service types
- Opening hours
- Rating and approval status

An organization appears in Transport Near Me only when:

1. Its status is active.
2. `transport_profile_approved` is `true`.
3. It has valid GeoJSON coordinates.

### Fleet management

The fleet module manages:

- Vehicles
- Drivers
- Trips
- Fuel logs
- Maintenance records
- Vehicle documents

Vehicle availability is used by Transport Near Me. A provider is shown as available when at least one registered vehicle has `AVAILABLE` status.

### Shipment management

A shipment contains:

- Shipment and tracking numbers
- Customer and organization
- Origin and destination
- Booking and pickup dates
- Weight and service type
- Sender and receiver information
- Packages and items
- Charges
- Assigned vehicle and driver
- Current status
- Proof of Delivery

Customers create shipment requests, but they cannot assign vehicles, assign drivers, or add financial charges.

### Assignments and trips

After approval, an organization administrator assigns a vehicle and driver. The assignment connects the shipment to operational fleet resources.

The system then tracks the trip and prevents unauthorized users from managing another organization's resources.

### Tracking and Proof of Delivery

Tracking records store shipment progress. A typical lifecycle is:

```text
PENDING
   ↓
APPROVED
   ↓
ASSIGNED
   ↓
IN_TRANSIT
   ↓
OUT_FOR_DELIVERY
   ↓
DELIVERED
   ↓
COMPLETED
```

The driver or authorized administrator can upload Proof of Delivery. This provides evidence that the delivery was completed.

### Billing and payments

The billing workflow supports:

- Shipment charges
- Invoices
- Payment records
- Organization billing configuration
- Subscription limits

Financial fields are protected so customers cannot add or modify shipment charges.

---

## 4. Transport Near Me workflow

Transport Near Me allows a customer to discover real registered transport businesses on an interactive map.

### Step 1: Obtain customer location

When the page opens, the browser Geolocation API requests permission.

If permission is granted:

- Latitude and longitude are detected
- Coordinates are cached for the browser session
- The map centers on the customer
- A blue/purple customer marker is displayed

If permission is denied or unavailable:

- The page continues working
- A friendly error message appears
- The customer can search for a city, locality or address
- Google Places autocomplete supplies suggestions

### Step 2: Search for providers

The frontend calls:

```http
GET /api/transporters/nearby?lat=26.8467&lng=80.9462&radius=25
```

Supported radius values are:

```text
5 km, 10 km, 25 km, 50 km and 100 km
```

The default is 25 km.

### Step 3: MongoDB geographic search

Provider coordinates use the GeoJSON format:

```json
{
  "type": "Point",
  "coordinates": [80.9462, 26.8467]
}
```

Important: coordinates are stored as `[longitude, latitude]`.

The `Organization` model has a `2dsphere` index. MongoDB `$geoNear` finds active, approved providers within the requested radius and sorts them nearest first.

No random or fake provider locations are generated.

### Step 4: Combine provider and fleet data

The nearby API loads genuine vehicles belonging to each returned organization and calculates:

- Vehicle types
- Vehicle capacities
- Total vehicle count
- Available vehicle count
- Current availability

### Step 5: Search and filters

Customers can search for terms such as:

- Transport near me
- Truck near me
- Mini truck
- Tempo
- Container transport
- Packers and movers
- 14 FT, 17 FT or 22 FT truck

Filters include:

- Distance
- Vehicle type
- Availability
- Service type
- Nearest, highest rated or most vehicles sorting

Search input is debounced to avoid unnecessary processing.

### Step 6: Select a provider

Selecting a card or map marker updates the shared `selectedTransporter` state.

The page then:

- Highlights the provider card
- Highlights its map marker
- Centers and zooms the map
- Opens its compact information card
- Requests a route only for that provider

Nearby markers are clustered when they overlap. Clicking a cluster zooms in.

### Step 7: Driving route

Google Directions calculates the selected route:

```text
Customer location → Selected transport provider
```

It returns actual road distance and estimated driving time. Only one route is displayed, preventing map clutter and unnecessary API requests.

### Step 8: Provider actions

Customers can:

- Open the details drawer
- Call the provider
- Open WhatsApp
- Open Google Maps directions
- Submit a transport booking

### Step 9: Transport booking

The booking form collects:

- Pickup location
- Drop location
- Vehicle type
- Goods type
- Approximate weight
- Pickup date
- Pickup time
- Customer name
- Phone number

The selected provider ID is attached automatically.

The request is submitted to:

```http
POST /api/transporters/bookings
```

Only authenticated customers can submit this request.

---

## 5. Shipment workflow

### Customer creates a shipment

1. Customer signs in.
2. Customer opens Create Shipment.
3. Customer enters origin, destination, weight and dates.
4. Customer enters consignor and consignee information.
5. Backend validates required information.
6. Shipment, parties, packages, items, charges and initial tracking records are created.
7. Shipment begins with `PENDING` status.

### Administrator processes the shipment

1. Organization Admin reviews the request.
2. Shipment is approved.
3. An available vehicle is selected.
4. A driver is selected.
5. An assignment and trip are created.
6. Shipment tracking is updated.

### Driver completes delivery

1. Driver views the assignment.
2. Driver starts the trip.
3. Status changes during transportation.
4. Driver uploads Proof of Delivery.
5. Delivery is marked delivered or completed.

### Billing closes the workflow

1. Authorized users add shipment charges.
2. An invoice is generated.
3. Payment is recorded.
4. Reports and activity logs reflect the completed operation.

---

## 6. Technical architecture

```text
React + Vite frontend
        ↓
Axios API services
        ↓
Express API routes
        ↓
JWT authentication and role middleware
        ↓
Controllers and business rules
        ↓
Mongoose models
        ↓
MongoDB
```

### Frontend

- React 18
- Vite
- React Router
- Tailwind CSS
- Lucide React icons
- Axios
- React Hot Toast
- Google Maps JavaScript, Places and Directions APIs

### Backend

- Node.js
- Express
- Mongoose
- MongoDB
- JWT authentication
- Multer and Cloudinary for uploads

### Deployment

The project is configured for Vercel deployment. API requests use `VITE_API_URL`, with `/api` as the default frontend base URL.

---

## 7. Important database models

| Model | Purpose |
|---|---|
| `User` | Customers, organization administrators, super admins and drivers |
| `Organization` | Transport company, branding, address and nearby-search profile |
| `OrganizationSubscription` | Plan status and usage limits |
| `Vehicle` | Fleet vehicles, capacity and availability |
| `Driver` | Driver profile and availability |
| `Shipment` | Main shipment record |
| `ShipmentParty` | Sender and receiver |
| `ShipmentPackage` | Package dimensions and quantity |
| `ShipmentItem` | Goods or shipment items |
| `ShipmentCharge` | Freight and additional charges |
| `ShipmentTracking` | Shipment status history |
| `ShipmentAssignment` | Vehicle and driver assignment |
| `Trip` | Active fleet trip |
| `TransportBooking` | Customer request sent to a nearby provider |
| `Invoice` | Shipment invoice |
| `Payment` | Payment record |
| `Notification` | User notifications |
| `ActivityLog` | Administrative audit trail |

---

## 8. Important API groups

| API prefix | Purpose |
|---|---|
| `/api/auth` | Login, logout and authentication |
| `/api/customers` | Customer management |
| `/api/organizations` | Organizations, settings and branding |
| `/api/transporters` | Nearby search and transport bookings |
| `/api/shipments` | Shipment creation and management |
| `/api/shipment-parties` | Sender and receiver information |
| `/api/shipment-packages` | Shipment packages |
| `/api/shipment-items` | Shipment goods/items |
| `/api/shipment-charges` | Shipment charges |
| `/api/shipment-tracking` | Tracking history |
| `/api/fleet` | Vehicles, drivers and fleet records |
| `/api/assignments` | Vehicle and driver assignments |
| `/api/live-tracking` | Live transport tracking |
| `/api/pod` | Proof of Delivery |
| `/api/invoices` | Invoice management |
| `/api/payments` | Payment management |
| `/api/reports` | Operational reports |
| `/api/notifications` | User notifications |
| `/api/subscriptions` | Subscription management |
| `/api/activity-logs` | Audit logs |

---

## 9. Environment configuration

### Backend

Create `backend/.env` and configure values required by the existing deployment, including:

```env
MONGO_URI=mongodb_connection_string
JWT_SECRET=strong_private_secret
```

Cloudinary variables are required only when Cloudinary uploads are enabled.

### Frontend

Create `frontend/.env`:

```env
VITE_API_URL=http://127.0.0.1:5000/api
VITE_GOOGLE_MAPS_API_KEY=restricted_google_maps_browser_key
```

The Google browser key should enable:

- Maps JavaScript API
- Places API
- Directions API

Restrict it to the permitted production domains and localhost development addresses.

Never place unrestricted private keys directly inside application source files.

---

## 10. Running the project locally

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

Start the backend using the script defined in `backend/package.json`.

Start the frontend:

```bash
cd frontend
npm run dev
```

Open the local Vite URL displayed in the terminal.

---

## 11. Testing Transport Near Me

### Provider preparation

Create or update a real organization with:

```json
{
  "status": "Active",
  "transport_profile_approved": true,
  "location": {
    "type": "Point",
    "coordinates": [80.9462, 26.8467]
  },
  "owner_name": "Provider owner",
  "service_areas": ["Lucknow"],
  "service_types": ["Local", "Intercity"],
  "opening_hours": "09:00 AM - 08:00 PM"
}
```

Register one or more vehicles for the organization. Set at least one vehicle status to `AVAILABLE`.

### Customer test

1. Sign in as a customer.
2. Open **Transport Near Me** from the sidebar.
3. Allow browser location permission.
4. Confirm the customer marker appears.
5. Confirm approved providers appear as cards and truck markers.
6. Test every radius option.
7. Test search and filters.
8. Select a card and confirm its marker is highlighted.
9. Select a marker and confirm its card is highlighted.
10. Confirm one route, road distance and driving time appear.
11. Open provider details.
12. Test Call, WhatsApp and Directions links.
13. Submit a booking request.
14. Confirm the booking contains the correct customer and transporter IDs.
15. Deny location access and test manual address autocomplete.
16. Test desktop and mobile layouts.

---

## 12. Common use cases

### Local truck booking

A customer finds an available Tata Ace, pickup or mini truck for a local delivery.

### Intercity transportation

A customer filters providers by Intercity service and selects a suitable 14 FT, 17 FT or 22 FT truck.

### Full Truck Load

A business finds providers that support Full Truck Load and compares fleet availability.

### Packers and movers

A customer searches registered providers offering moving or local transport services.

### Fleet operation management

A transport company manages vehicles, drivers, fuel, maintenance, assignments and trips from one dashboard.

### Shipment visibility

Customers and administrators monitor shipment progress from booking through final delivery.

### Delivery proof and billing

Drivers upload Proof of Delivery, after which administrators complete invoicing and payment tracking.

---

## 13. Security rules

- Never trust a role supplied by the frontend.
- Always use backend role middleware.
- Customers must not assign vehicles or drivers.
- Customers must not add shipment charges.
- Organization users must access only their own organization data.
- Only active and approved providers may appear publicly.
- Nearby coordinates and radius must be validated.
- Private API keys must stay in environment variables.
- Browser map keys must be domain- and API-restricted.
- Passwords must remain hashed.
- File uploads must use the existing validation and storage workflow.

---

## 14. Summary

This project combines customer transport discovery with internal transport-company operations.

Customers can find and book genuine nearby providers. Transport companies can manage their fleet and shipments. Drivers can execute assigned deliveries. Administrators can monitor operations, Proof of Delivery, billing, payments, subscriptions, and reports.

The result is a single platform covering the complete workflow from transport discovery and booking to delivery completion and payment tracking.
