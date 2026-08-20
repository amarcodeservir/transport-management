/* eslint-disable react/prop-types */
import { useEffect, useRef } from "react";
import { Crosshair, MapPin } from "lucide-react";
import { loadGoogleMaps } from "../../utils/googleMaps.js";

const truckIcon = (selected, hovered) => ({
  path: "M3 6h11v8h-1.1a3 3 0 0 1-5.8 0H6a3 3 0 0 1-5.8 0H0V8a2 2 0 0 1 2-2h1Zm12 2h3l4 4v2h-1.1a3 3 0 0 1-5.8 0H15V8Zm-9 7a1.25 1.25 0 1 0 0 2.5A1.25 1.25 0 0 0 6 15Zm12 0a1.25 1.25 0 1 0 0 2.5A1.25 1.25 0 0 0 18 15Z",
  fillColor: selected ? "#f7941d" : hovered ? "#1b2a5b" : "#111827",
  fillOpacity: 1,
  strokeColor: "#ffffff",
  strokeWeight: 1.5,
  scale: selected ? 1.55 : hovered ? 1.4 : 1.2,
  anchor: window.google ? new window.google.maps.Point(11, 12) : undefined,
});

export default function TransportMap({
  userLocation, transporters, selectedId, hoveredId, onSelect, onMapReady,
  route, onRouteMetrics, recenterSignal, mapError, setMapError,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const rendererRef = useRef(null);
  const zoomListenerRef = useRef(null);

  useEffect(() => {
    let active = true;
    loadGoogleMaps().then((google) => {
      if (!active || mapRef.current) return;
      mapRef.current = new google.maps.Map(containerRef.current, {
        center: userLocation || { lat: 26.8467, lng: 80.9462 }, zoom: userLocation ? 12 : 5,
        mapTypeControl: false, fullscreenControl: false, streetViewControl: false,
        styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }],
      });
      rendererRef.current = new google.maps.DirectionsRenderer({
        map: mapRef.current, suppressMarkers: true, preserveViewport: false,
        polylineOptions: { strokeColor: "#6d28d9", strokeWeight: 5, strokeOpacity: 0.85 },
      });
      onMapReady?.(mapRef.current, google);
    }).catch((error) => setMapError?.(error.message));
    return () => { active = false; };
  }, [onMapReady, setMapError, userLocation]);

  useEffect(() => {
    const google = window.google;
    if (!mapRef.current || !google || !userLocation) return;
    if (!userMarkerRef.current) {
      userMarkerRef.current = new google.maps.Marker({
        map: mapRef.current, position: userLocation, title: "Your location", zIndex: 1000,
        icon: { path: google.maps.SymbolPath.CIRCLE, fillColor: "#6d28d9", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 4, scale: 10 },
      });
    } else userMarkerRef.current.setPosition(userLocation);
    mapRef.current.panTo(userLocation);
  }, [userLocation]);

  useEffect(() => {
    const google = window.google;
    if (!mapRef.current || !google) return;
    const drawMarkers = () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      const zoom = mapRef.current.getZoom() || 12;
      const clusterSize = zoom < 9 ? 0.35 : zoom < 11 ? 0.1 : zoom < 13 ? 0.025 : 0;
      const groups = [];
      transporters.forEach((provider) => {
        const group = clusterSize && groups.find((item) => Math.abs(item.lat - provider.latitude) < clusterSize && Math.abs(item.lng - provider.longitude) < clusterSize);
        if (group) { group.providers.push(provider); group.lat = group.providers.reduce((sum, item) => sum + item.latitude, 0) / group.providers.length; group.lng = group.providers.reduce((sum, item) => sum + item.longitude, 0) / group.providers.length; }
        else groups.push({ lat: provider.latitude, lng: provider.longitude, providers: [provider] });
      });
      markersRef.current = groups.map((group) => {
        if (group.providers.length > 1) {
          const marker = new google.maps.Marker({ map: mapRef.current, position: { lat: group.lat, lng: group.lng }, label: { text: String(group.providers.length), color: "#fff", fontWeight: "800" }, icon: { path: google.maps.SymbolPath.CIRCLE, fillColor: "#1b2a5b", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 3, scale: 20 }, zIndex: 300 });
          marker.addListener("click", () => { mapRef.current.panTo({ lat: group.lat, lng: group.lng }); mapRef.current.setZoom(zoom + 2); });
          return marker;
        }
        const provider = group.providers[0];
        const marker = new google.maps.Marker({ map: mapRef.current, position: { lat: provider.latitude, lng: provider.longitude }, title: provider.companyName, icon: truckIcon(provider._id === selectedId, provider._id === hoveredId), zIndex: provider._id === selectedId ? 500 : provider._id === hoveredId ? 400 : 100 });
        marker.addListener("click", () => onSelect(provider._id));
        return marker;
      });
    };
    drawMarkers();
    if (zoomListenerRef.current) google.maps.event.removeListener(zoomListenerRef.current);
    zoomListenerRef.current = mapRef.current.addListener("zoom_changed", drawMarkers);
    return () => { if (zoomListenerRef.current) google.maps.event.removeListener(zoomListenerRef.current); };
  }, [transporters, selectedId, hoveredId, onSelect]);

  useEffect(() => {
    const google = window.google;
    if (!mapRef.current || !google || !selectedId) return;
    const provider = transporters.find((item) => item._id === selectedId);
    if (provider) {
      mapRef.current.panTo({ lat: provider.latitude, lng: provider.longitude });
      mapRef.current.setZoom(Math.max(mapRef.current.getZoom(), 13));
    }
  }, [selectedId, transporters]);

  useEffect(() => {
    const google = window.google;
    if (!rendererRef.current || !google) return;
    if (!route?.origin || !route?.destination) { rendererRef.current.setDirections({ routes: [] }); return; }
    const service = new google.maps.DirectionsService();
    service.route({ origin: route.origin, destination: route.destination, travelMode: google.maps.TravelMode.DRIVING }, (result, status) => {
      if (status !== "OK") return onRouteMetrics?.(route.id, { error: "Driving route is unavailable" });
      rendererRef.current.setDirections(result);
      const leg = result.routes?.[0]?.legs?.[0];
      onRouteMetrics?.(route.id, { distanceText: leg?.distance?.text, durationText: leg?.duration?.text });
    });
  }, [route, onRouteMetrics]);

  useEffect(() => {
    if (mapRef.current && userLocation) { mapRef.current.panTo(userLocation); mapRef.current.setZoom(13); }
  }, [recenterSignal, userLocation]);

  return (
    <div className="near-map-wrap">
      <div ref={containerRef} className="h-full w-full" aria-label="Map of nearby transport providers" />
      {mapError && (
        <div className="absolute inset-0 grid place-items-center bg-slate-100 p-8 text-center">
          <div><MapPin className="mx-auto mb-3 text-slate-400" size={34} /><p className="font-semibold text-slate-700">Map unavailable</p><p className="mt-1 text-sm text-slate-500">{mapError}</p></div>
        </div>
      )}
      <button type="button" onClick={() => userLocation && mapRef.current?.panTo(userLocation)} className="near-recenter" title="Recenter map"><Crosshair size={19} /><span>Recenter</span></button>
    </div>
  );
}
