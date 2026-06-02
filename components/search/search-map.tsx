"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import type {
  LngLatBoundsLike,
  Map as MlMap,
  Marker as MlMarker,
  StyleSpecification,
} from "maplibre-gl";
import { Crosshair, Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { formatPrice, formatPriceShort } from "@/lib/format";
import type { ListingSummary } from "@/lib/types/listing";

/** Free OpenStreetMap raster tiles — no API key required. */
const OSM_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

// Geographic centre of India — sensible default when nothing is geocoded.
const INDIA_CENTER: [number, number] = [78.9629, 22.5937];

function haversineMeters(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const R = 6_371_000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function SearchMap({
  items,
  baseParams,
  center,
}: {
  items: ListingSummary[];
  /** Current filters (no cursor/view/geo) to preserve on re-search. */
  baseParams: Record<string, string>;
  /** Active geo-search centre, if any. */
  center?: { lat: number; lng: number } | null;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markersRef = useRef<MlMarker[]>([]);
  const [ready, setReady] = useState(false);
  const [locating, setLocating] = useState(false);

  const pins = items.filter(
    (i): i is ListingSummary & { lat: number; lng: number } =>
      i.lat != null && i.lng != null,
  );

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    let map: MlMap | null = null;
    void (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled || !containerRef.current) return;
      map = new maplibregl.Map({
        container: containerRef.current,
        style: OSM_STYLE,
        center: center ? [center.lng, center.lat] : INDIA_CENTER,
        zoom: center ? 12 : 4,
        attributionControl: { compact: true },
      });
      map.addControl(new maplibregl.NavigationControl(), "top-right");
      map.addControl(
        new maplibregl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
        }),
        "top-right",
      );
      mapRef.current = map;
      map.on("load", () => {
        if (!cancelled) setReady(true);
      });
    })();
    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map?.remove();
      mapRef.current = null;
    };
    // Center is only used for the initial view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // (Re)draw markers whenever the result set changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    let cancelled = false;

    void (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled) return;

      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      for (const item of pins) {
        const el = document.createElement("button");
        el.type = "button";
        el.className =
          "rounded-full border border-white bg-[var(--color-primary,#0f766e)] px-2.5 py-1 text-xs font-semibold text-white shadow-md transition-transform hover:scale-110";
        el.textContent = formatPriceShort(item.price);

        const popupHtml = `
          <a href="/listings/${item.id}" style="display:block;min-width:180px;text-decoration:none;color:inherit">
            <div style="font-weight:600;margin-bottom:2px">${escapeHtml(
              item.title ?? "Untitled listing",
            )}</div>
            <div style="color:#0f766e;font-weight:700">${escapeHtml(
              formatPrice(item.price),
            )}</div>
            <div style="font-size:12px;color:#666">${escapeHtml(
              [item.locality, item.city].filter(Boolean).join(", "),
            )}</div>
          </a>`;

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([item.lng, item.lat])
          .setPopup(new maplibregl.Popup({ offset: 18 }).setHTML(popupHtml))
          .addTo(map);
        markersRef.current.push(marker);
      }

      // Fit the viewport to the pins (unless a geo-search already centred us).
      if (!center && pins.length > 0) {
        const bounds = pins.reduce<[number, number, number, number]>(
          (acc, p) => [
            Math.min(acc[0], p.lng),
            Math.min(acc[1], p.lat),
            Math.max(acc[2], p.lng),
            Math.max(acc[3], p.lat),
          ],
          [pins[0].lng, pins[0].lat, pins[0].lng, pins[0].lat],
        );
        const box: LngLatBoundsLike = [
          [bounds[0], bounds[1]],
          [bounds[2], bounds[3]],
        ];
        map.fitBounds(box, { padding: 64, maxZoom: 15, duration: 600 });
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, items]);

  function searchThisArea() {
    const map = mapRef.current;
    if (!map) return;
    const c = map.getCenter();
    const b = map.getBounds();
    const ne = b.getNorthEast();
    const radius = Math.round(
      Math.min(50_000, Math.max(100, haversineMeters(c.lat, c.lng, ne.lat, ne.lng))),
    );
    pushGeo(c.lat, c.lng, radius);
  }

  function nearMe() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        pushGeo(pos.coords.latitude, pos.coords.longitude, 5000);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  function pushGeo(lat: number, lng: number, radius: number) {
    const sp = new URLSearchParams(baseParams);
    sp.set("view", "map");
    sp.set("lat", lat.toFixed(6));
    sp.set("lng", lng.toFixed(6));
    sp.set("radius_m", String(radius));
    router.push(`/search?${sp.toString()}`);
  }

  return (
    <div className="bg-muted relative h-full w-full overflow-hidden rounded-2xl border">
      <div ref={containerRef} className="h-full w-full" />

      {/* Action buttons */}
      <div className="absolute top-3 left-3 z-10 flex gap-2">
        <button
          type="button"
          onClick={searchThisArea}
          className="bg-background/90 shadow-soft inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium backdrop-blur hover:bg-background"
        >
          <Search className="size-4" /> Search this area
        </button>
        <button
          type="button"
          onClick={nearMe}
          disabled={locating}
          className="bg-background/90 shadow-soft inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium backdrop-blur hover:bg-background disabled:opacity-60"
        >
          {locating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Crosshair className="size-4" />
          )}
          Near me
        </button>
      </div>

      {pins.length === 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
          <span className="bg-background/90 text-muted-foreground rounded-full border px-3 py-1.5 text-xs shadow">
            No mapped homes here yet — try “Search this area”.
          </span>
        </div>
      )}
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
