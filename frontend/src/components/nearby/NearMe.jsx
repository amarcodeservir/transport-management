/* eslint-disable react/prop-types */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle, Clock3, Filter, LocateFixed, MapPin, MessageCircle,
  Navigation, Phone, Search, SlidersHorizontal, Star, Truck, X,
} from "lucide-react";
import toast from "react-hot-toast";
import TransportMap from "./TransportMap.jsx";
import BookingModal from "./BookingModal.jsx";
import { getNearbyTransporters } from "../../services/api.js/nearbyTransportService.js";
import "./nearMe.css";

const radii = [5, 10, 25, 50, 100];
const vehicleOptions = ["Mini Truck", "Pickup", "Tata Ace", "Tempo", "14 FT Truck", "17 FT Truck", "19 FT Truck", "22 FT Truck", "Container", "Trailer"];
const serviceOptions = ["Local", "Intercity", "Interstate", "Full Truck Load"];
const locationCacheKey = "difmo.near-me.location";

const normalize = (value) => String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
const providerSearchText = (provider) => normalize([
  provider.companyName, provider.ownerName, provider.address, ...(provider.vehicleTypes || []),
  ...(provider.serviceTypes || []), ...(provider.serviceAreas || []), "transport truck packers movers",
].join(" "));

const formatPhoneLink = (phone) => String(phone || "").replace(/[^\d+]/g, "");

function ProviderCard({ provider, selected, routeMetrics, onSelect, onHover, onDetails, onBook }) {
  return <article id={`provider-${provider._id}`} onMouseEnter={() => onHover(provider._id)} onMouseLeave={() => onHover(null)} onClick={() => onSelect(provider._id)} className={`near-provider-card ${selected ? "is-selected" : ""}`}>
    <div className="flex gap-3">
      <div className="near-logo">{provider.logo ? <img src={provider.logo} alt="" /> : <Truck size={21} />}</div>
      <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h3 className="truncate font-bold text-slate-900">{provider.companyName}</h3>{provider.rating != null && <span className="near-rating"><Star size={12} fill="currentColor" />{provider.rating.toFixed(1)}</span>}</div><p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500"><MapPin size={13} />{provider.address || "Address not provided"}</p></div>
    </div>
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm"><span className="font-semibold text-slate-800">{routeMetrics?.distanceText || `${provider.distanceKm} km away`}</span>{routeMetrics?.durationText && <span className="flex items-center gap-1 text-slate-600"><Clock3 size={14} />{routeMetrics.durationText} drive</span>}<span className={provider.available ? "near-available" : "near-unavailable"}><i />{provider.available ? "Available Now" : "Currently Unavailable"}</span></div>
    <div className="mt-3 flex flex-wrap gap-1.5">{provider.vehicleTypes.slice(0, 4).map((type) => <span key={type} className="near-chip">{type}</span>)}{!provider.vehicleTypes.length && <span className="text-xs text-slate-400">Fleet details unavailable</span>}</div>
    <div className="mt-4 flex gap-2"><button type="button" onClick={(event) => { event.stopPropagation(); onDetails(provider); }} className="near-btn-secondary flex-1">View Details</button><button type="button" disabled={!provider.available} onClick={(event) => { event.stopPropagation(); onBook(provider); }} className="near-btn-primary flex-1">Book Now</button></div>
  </article>;
}

function DetailsDrawer({ provider, metrics, onClose, onBook, userLocation }) {
  const directions = userLocation ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${provider.latitude},${provider.longitude}&travelmode=driving` : "#";
  return <div className="near-drawer-backdrop" onClick={onClose}><aside className="near-drawer" onClick={(event) => event.stopPropagation()}>
    <div className="flex items-start justify-between border-b border-slate-100 p-5"><div><p className="text-xs font-bold uppercase tracking-widest text-orange-500">Transport details</p><h2 className="mt-1 text-2xl font-bold text-slate-900">{provider.companyName}</h2><p className="mt-1 text-sm text-slate-500">{provider.ownerName ? `Owner: ${provider.ownerName}` : "Registered transport provider"}</p></div><button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100"><X /></button></div>
    <div className="space-y-5 overflow-y-auto p-5">
      <div className="near-detail-grid"><div><span>Rating</span><strong>{provider.rating ?? "Not rated"}</strong></div><div><span>Distance</span><strong>{metrics?.distanceText || `${provider.distanceKm} km nearby`}</strong></div><div><span>Travel time</span><strong>{metrics?.durationText || "Select route"}</strong></div><div><span>Available fleet</span><strong>{provider.availableVehicles} of {provider.vehicleCount}</strong></div></div>
      {[['Complete address', provider.address], ['Vehicle fleet', provider.vehicleTypes.join(', ')], ['Vehicle capacity', provider.capacities.join(', ')], ['Service locations', provider.serviceAreas.join(', ')], ['Services', provider.serviceTypes.join(', ')], ['Opening hours', provider.openingHours], ['Phone', provider.phone]].map(([label,value]) => value && <div key={label}><p className="near-label">{label}</p><p className="mt-1 text-sm font-medium text-slate-800">{value}</p></div>)}
      <div className="grid grid-cols-2 gap-2"><a href={`tel:${formatPhoneLink(provider.phone)}`} className="near-btn-secondary text-center"><Phone size={16} />Call</a><a href={`https://wa.me/${formatPhoneLink(provider.whatsapp)}`} target="_blank" rel="noreferrer" className="near-btn-secondary text-center"><MessageCircle size={16} />WhatsApp</a><a href={directions} target="_blank" rel="noreferrer" className="near-btn-secondary col-span-2 text-center"><Navigation size={16} />Get Directions</a></div>
    </div>
    <div className="border-t border-slate-100 p-5"><button disabled={!provider.available} onClick={() => onBook(provider)} className="near-btn-primary w-full py-3">Book This Transport</button></div>
  </aside></div>;
}

export default function NearMe() {
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("finding");
  const [locationMessage, setLocationMessage] = useState("Allow location access to find transport services near you.");
  const [manualSearch, setManualSearch] = useState("");
  const autocompleteRef = useRef(null);
  const mapsContextRef = useRef(null);
  const autocompleteInstanceRef = useRef(null);
  const [radius, setRadius] = useState(25);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [service, setService] = useState("");
  const [availability, setAvailability] = useState("available");
  const [sort, setSort] = useState("nearest");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [routeMetrics, setRouteMetrics] = useState({});
  const [detailsProvider, setDetailsProvider] = useState(null);
  const [bookingProvider, setBookingProvider] = useState(null);
  const [mapError, setMapError] = useState("");
  const [recenterSignal, setRecenterSignal] = useState(0);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) { setLocationStatus("manual"); setLocationMessage("Location access is unavailable. Search your location manually."); return; }
    setLocationStatus("finding"); setLocationMessage("Finding your location...");
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const next = { lat: coords.latitude, lng: coords.longitude };
      sessionStorage.setItem(locationCacheKey, JSON.stringify(next)); setLocation(next); setLocationStatus("ready"); setLocationMessage("");
    }, () => { setLocationStatus("manual"); setLocationMessage("We couldn't access your current location. Search your location manually."); }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 });
  }, []);

  useEffect(() => {
    try { const cached = JSON.parse(sessionStorage.getItem(locationCacheKey)); if (Number.isFinite(cached?.lat) && Number.isFinite(cached?.lng)) { setLocation(cached); setLocationStatus("ready"); return; } } catch { /* request fresh coordinates */ }
    requestLocation();
  }, [requestLocation]);

  useEffect(() => { const timer = window.setTimeout(() => setDebouncedQuery(query), 300); return () => window.clearTimeout(timer); }, [query]);

  useEffect(() => {
    if (!location) return;
    const controller = new AbortController(); setLoading(true); setError("");
    getNearbyTransporters({ ...location, radius }).then((data) => { setProviders(data.transporters || []); setSelectedId(null); }).catch((requestError) => { if (requestError.name !== "CanceledError") setError(requestError.response?.data?.message || "Could not load nearby transport providers"); }).finally(() => setLoading(false));
    return () => controller.abort();
  }, [location, radius]);

  const filtered = useMemo(() => {
    const terms = normalize(debouncedQuery).split(" ").filter((term) => !["near", "me", "nearby"].includes(term));
    const rows = providers.filter((provider) => (!terms.length || terms.every((term) => providerSearchText(provider).includes(term))) && (!vehicle || provider.vehicleTypes.some((type) => normalize(type).includes(normalize(vehicle)))) && (!service || provider.serviceTypes.some((type) => normalize(type) === normalize(service))) && (availability !== "available" || provider.available));
    return [...rows].sort((a,b) => sort === "rating" ? (b.rating || 0) - (a.rating || 0) : sort === "vehicles" ? b.vehicleCount - a.vehicleCount : a.distanceKm - b.distanceKm);
  }, [providers, debouncedQuery, vehicle, service, availability, sort]);
  const selected = filtered.find((item) => item._id === selectedId) || providers.find((item) => item._id === selectedId);
  const route = selected && location ? { id: selected._id, origin: location, destination: { lat: selected.latitude, lng: selected.longitude } } : null;
  const handleRouteMetrics = useCallback((id, metrics) => setRouteMetrics((current) => ({ ...current, [id]: metrics })), []);
  const selectProvider = useCallback((id) => { setSelectedId(id); window.setTimeout(() => document.getElementById(`provider-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50); }, []);

  const initializeAutocomplete = useCallback(() => {
    const { map, google } = mapsContextRef.current || {};
    if (!autocompleteRef.current || !google?.maps?.places || autocompleteInstanceRef.current) return;
    const autocomplete = new google.maps.places.Autocomplete(autocompleteRef.current, { fields: ["geometry", "formatted_address", "name"], types: ["geocode"] });
    autocompleteInstanceRef.current = autocomplete;
    autocomplete.bindTo("bounds", map);
    autocomplete.addListener("place_changed", () => { const place = autocomplete.getPlace(); const point = place.geometry?.location; if (!point) return toast.error("Please choose a location from the suggestions"); setLocation({ lat: point.lat(), lng: point.lng() }); setManualSearch(place.formatted_address || place.name || ""); setLocationStatus("ready"); });
  }, []);
  const setupPlaces = useCallback((map, google) => { mapsContextRef.current = { map, google }; initializeAutocomplete(); }, [initializeAutocomplete]);
  useEffect(() => { if (locationStatus === "manual") initializeAutocomplete(); }, [locationStatus, initializeAutocomplete]);
  const nearest = filtered[0];

  return <div className="near-page">
    <header className="near-header"><div><p className="near-eyebrow">Customer marketplace</p><h1>Transport Near You</h1><p>{location ? `${filtered.length} transport provider${filtered.length === 1 ? "" : "s"} found within ${radius} km` : "Allow location access to discover approved transport providers."}{nearest && <span className="near-nearest">Nearest Transport: {nearest.distanceKm} km away</span>}</p></div><button type="button" onClick={requestLocation} className="near-location-button"><LocateFixed size={18} />Use My Current Location</button></header>
    {locationStatus !== "ready" && <div className={`near-location-alert ${locationStatus === "manual" ? "is-warning" : ""}`}>{locationStatus === "finding" ? <LocateFixed className="animate-pulse" /> : <AlertCircle />}<div className="min-w-0 flex-1"><p className="font-semibold">{locationMessage}</p>{locationStatus === "manual" && <div className="relative mt-3"><MapPin className="absolute left-3 top-3 text-slate-400" size={17} /><input ref={autocompleteRef} value={manualSearch} onChange={(event) => setManualSearch(event.target.value)} placeholder="Search city, locality or address" className="near-input pl-10" /></div>}</div></div>}
    <section className="near-toolbar"><div className="near-search"><Search size={20} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search transport near your location" /></div><button onClick={() => setFiltersOpen((open) => !open)} className={`near-filter-toggle ${filtersOpen ? "is-active" : ""}`}><SlidersHorizontal size={18} />Filters</button></section>
    {filtersOpen && <section className="near-filters"><label><span>Distance</span><div className="near-radius-row">{radii.map((item) => <button key={item} onClick={() => setRadius(item)} className={radius === item ? "is-active" : ""}>{item} km</button>)}</div></label><label><span>Vehicle Type</span><select value={vehicle} onChange={(event) => setVehicle(event.target.value)} className="near-input"><option value="">All vehicles</option>{vehicleOptions.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>Availability</span><select value={availability} onChange={(event) => setAvailability(event.target.value)} className="near-input"><option value="available">Available Now</option><option value="all">All</option></select></label><label><span>Service</span><select value={service} onChange={(event) => setService(event.target.value)} className="near-input"><option value="">All services</option>{serviceOptions.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>Sort by</span><select value={sort} onChange={(event) => setSort(event.target.value)} className="near-input"><option value="nearest">Nearest</option><option value="rating">Highest Rated</option><option value="vehicles">Most Vehicles</option></select></label></section>}
    <div className="near-content"><section className="near-results"><div className="near-results-title"><div><h2>Nearby Transport</h2><p>{filtered.length} verified result{filtered.length === 1 ? "" : "s"}</p></div><Filter size={18} /></div><div className="near-card-list">{loading ? Array.from({length:3}).map((_,index) => <div key={index} className="near-skeleton" />) : error ? <div className="near-empty"><AlertCircle /><h3>Unable to load providers</h3><p>{error}</p></div> : !location ? <div className="near-empty"><MapPin /><h3>Choose your location</h3><p>Use GPS or search manually to find registered providers.</p></div> : !filtered.length ? <div className="near-empty"><Truck /><h3>No transport providers found within {radius} km.</h3><p>Try clearing filters or searching a wider area.</p>{radius < 100 && <button onClick={() => setRadius(radii[radii.indexOf(radius)+1])} className="near-btn-primary">Increase Search Radius</button>}</div> : filtered.map((provider) => <ProviderCard key={provider._id} provider={provider} selected={provider._id === selectedId} routeMetrics={routeMetrics[provider._id]} onSelect={selectProvider} onHover={setHoveredId} onDetails={(item) => { selectProvider(item._id); setDetailsProvider(item); }} onBook={(item) => { selectProvider(item._id); setBookingProvider(item); }} />)}</div></section>
      <section className="near-map-panel"><TransportMap userLocation={location} transporters={filtered} selectedId={selectedId} hoveredId={hoveredId} onSelect={selectProvider} onMapReady={setupPlaces} route={route} onRouteMetrics={handleRouteMetrics} recenterSignal={recenterSignal} mapError={mapError} setMapError={setMapError} />{selected && <div className="near-map-card"><button className="absolute right-3 top-3 rounded-full p-1 hover:bg-slate-100" onClick={() => setSelectedId(null)}><X size={16} /></button><p className="font-bold text-slate-900">{selected.companyName}</p><p className="mt-1 text-xs text-slate-500">{selected.address}</p><div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold"><span>{routeMetrics[selected._id]?.distanceText || `${selected.distanceKm} km nearby`}</span>{routeMetrics[selected._id]?.durationText && <span>{routeMetrics[selected._id].durationText} drive</span>}<span className={selected.available ? "text-emerald-600" : "text-rose-600"}>{selected.available ? "Available Now" : "Unavailable"}</span></div><div className="mt-3 flex gap-2"><button onClick={() => setDetailsProvider(selected)} className="near-btn-secondary">View Details</button><button disabled={!selected.available} onClick={() => setBookingProvider(selected)} className="near-btn-primary">Book Transport</button></div></div>}<button type="button" onClick={() => setRecenterSignal((value) => value + 1)} className="near-mobile-recenter"><LocateFixed size={17} /></button></section>
    </div>
    {detailsProvider && <DetailsDrawer provider={detailsProvider} metrics={routeMetrics[detailsProvider._id]} userLocation={location} onClose={() => setDetailsProvider(null)} onBook={(item) => { setDetailsProvider(null); setBookingProvider(item); }} />}
    {bookingProvider && <BookingModal provider={bookingProvider} pickupLocation={manualSearch} onClose={() => setBookingProvider(null)} />}
  </div>;
}
