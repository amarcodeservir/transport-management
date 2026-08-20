import { useEffect, useRef } from "react";
import React from "react";
import { Truck } from "lucide-react"

export default function ScrollTruck() {
    const trackRef = useRef(null);
    const badgeRef = useRef(null);
    const frameRef = useRef(null);

    useEffect(() => {
        const updateTruck = () => {
            if (!trackRef.current || !badgeRef.current) return;
            
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const pct = docHeight > 0 ? scrollTop / docHeight : 0;
            const trackWidth = trackRef.current.clientWidth;
            const clampedPct = Math.min(Math.max(pct, 0.02), 0.98);
            
            // Use transform instead of left to avoid triggering layout recalculations
            badgeRef.current.style.transform = `translate(calc(${clampedPct * trackWidth}px - 50%), -50%)`;
        };

        const onScroll = () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
            frameRef.current = requestAnimationFrame(updateTruck);
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll, { passive: true });
        updateTruck();

        return () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
        };
    }, []);

    return (
        <div className="truck-bottom-bar">
            <div ref={trackRef} className="truck-track">
                <div className="truck-line" />
                <div ref={badgeRef} className="truck-badge" style={{ left: 0 }}>
                    <Truck size={16} />
                </div>
            </div>
        </div>
    );
}