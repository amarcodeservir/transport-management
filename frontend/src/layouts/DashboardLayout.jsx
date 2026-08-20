import React, { useEffect, useLayoutEffect, useState } from 'react';
import Sidebar from './sidebar';
import DashboardHeader from './dashboardHeader';
import { Outlet, useNavigate } from 'react-router-dom';
import { logoutUser } from '../services/api.js/authService.js';
import { getOrganizationBranding } from '../services/api.js/settingsService.js';
import {
  applyDocumentBranding,
  BRANDING_UPDATED_EVENT,
  DEFAULT_BRANDING,
  normalizeBranding,
  getThemeStyle,
  cacheBranding,
  readCachedBranding,
} from '../utils/branding.js';
import '../styles/dashboardTheme.css';

export default function DashboardLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  // Read user info from localStorage
  const user = React.useMemo(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  }, []);
  const organizationId = user?.organization_id || null;
  const initialBranding = React.useMemo(() => readCachedBranding(organizationId), [organizationId]);
  const [branding, setBranding] = useState(() => initialBranding || DEFAULT_BRANDING);
  const [brandingReady, setBrandingReady] = useState(() => Boolean(initialBranding) || !organizationId);

  useEffect(() => {
    let active = true;
    getOrganizationBranding()
      .then((response) => {
        if (active) {
          const freshBranding = organizationId
            ? cacheBranding(organizationId, response.data)
            : normalizeBranding(response.data);
          setBranding(freshBranding);
          setBrandingReady(true);
        }
      })
      .catch(() => {
        if (active) {
          if (!initialBranding) setBranding(DEFAULT_BRANDING);
          setBrandingReady(true);
        }
      });
    return () => { active = false; };
  }, [initialBranding, organizationId]);

  useEffect(() => {
    const handleBrandingUpdate = (event) => {
      const nextBranding = organizationId
        ? cacheBranding(organizationId, event.detail)
        : normalizeBranding(event.detail);
      setBranding(nextBranding);
      setBrandingReady(true);
    };
    window.addEventListener(BRANDING_UPDATED_EVENT, handleBrandingUpdate);
    return () => window.removeEventListener(BRANDING_UPDATED_EVENT, handleBrandingUpdate);
  }, [organizationId]);

  useLayoutEffect(() => {
    if (brandingReady) applyDocumentBranding(branding);
  }, [branding, brandingReady]);

  useEffect(() => () => applyDocumentBranding(DEFAULT_BRANDING), []);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // Local session is cleared even if the server is temporarily unavailable.
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  if (!brandingReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50" aria-label="Loading organization theme">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-slate-500" />
      </div>
    );
  }

  return (
    <div className="dashboard-layout flex h-screen overflow-hidden bg-[#F8FAFC] text-slate-800" style={getThemeStyle(branding)}>
      {/* Sidebar handles its own width and responsiveness */}
      <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} branding={branding} />
      
      {/* Main Content Area */}
      <div className="dashboard-shell flex-1 flex flex-col overflow-hidden w-full relative">
        <DashboardHeader 
          isSidebarCollapsed={isSidebarCollapsed} 
          onMenuToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
          user={user}
          onLogout={handleLogout}
          onNavigate={navigate}
        />
        
        {/* Scrollable Main Content */}
        <main className="dashboard-main flex-1 overflow-y-auto w-full relative z-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
