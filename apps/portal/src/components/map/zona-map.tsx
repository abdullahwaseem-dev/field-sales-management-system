import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';
import { usePreferences } from '@/lib/preferences';
import { SOLID } from '../ui/map-marker';
import type { AttendanceStatus } from '../ui/status-chip';

// leaflet.markercluster is a UMD plugin that extends the global `L`.
(window as unknown as { L: typeof L }).L = L;
const clusterReady = import('leaflet.markercluster');

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  initials: string;
  status: AttendanceStatus;
  ariaLabel: string;
}
export interface MapGeofence {
  id: string;
  geometry: { type: 'Point'; coordinates: [number, number] } | { type: 'Polygon'; coordinates: [number, number][][] };
  radiusM?: number | null;
  label: string;
  muted?: boolean;
}

interface Props {
  markers?: MapMarker[];
  geofences?: MapGeofence[];
  trail?: { lat: number; lng: number }[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
  draft?: { lat: number; lng: number; radiusM: number } | null;
  formatCount?: (n: number) => string;
  fit?: 'markers' | 'geofences' | 'trail';
  className?: string;
  label: string;
}

// Matching light/dark basemaps (Stadia "Alidade Smooth"), served through our API's tile proxy so the
// Stadia key never reaches the browser and no domain registration is needed.
const TILES = {
  light: '/api/v1/tiles/alidade_smooth/{z}/{x}/{y}{r}.png',
  dark: '/api/v1/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
};
const ATTRIBUTION = '&copy; Stadia Maps &copy; OpenMapTiles &copy; OpenStreetMap contributors';
const RIYADH: L.LatLngTuple = [24.7136, 46.6753];

const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(`--zona-color-${name}`).trim();

function markerHtml(m: MapMarker, selected: boolean) {
  return `<span role="img" aria-label="${m.ariaLabel.replace(/"/g, '&quot;')}" class="relative flex flex-col items-center">
    <span class="inline-flex items-center justify-center rounded-full font-semibold text-on-solid ring-2 ring-surface shadow-md ${selected ? 'size-12 text-label outline-2 outline-offset-2 outline-focus' : 'size-10 text-label-sm'} ${SOLID[m.status]}">${m.initials}</span>
    <span class="-mt-1 size-2.5 rotate-45 rounded-[2px] ring-2 ring-surface ${SOLID[m.status]}"></span></span>`;
}

/** Leaflet map in the brand style. Maps never mirror in RTL, so the container is always LTR. */
export function ZonaMap({ markers = [], geofences = [], trail, selectedId, onSelect, onMapClick, draft, formatCount = String, fit = 'markers', className, label }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const tiles = useRef<L.TileLayer | null>(null);
  const layers = useRef<{ cluster?: L.MarkerClusterGroup; shapes: L.LayerGroup; trail: L.LayerGroup; draft: L.LayerGroup } | null>(null);
  const fitted = useRef(false);
  const { theme } = usePreferences();
  const clickRef = useRef(onMapClick);
  clickRef.current = onMapClick;

  useEffect(() => {
    let disposed = false; // per mount: StrictMode mounts twice; the async plugin must not touch a removed map
    const m = L.map(el.current!, { zoomControl: true, attributionControl: true, center: RIYADH, zoom: 6, maxZoom: 19, minZoom: 4 });
    map.current = m;
    layers.current = { shapes: L.layerGroup().addTo(m), trail: L.layerGroup().addTo(m), draft: L.layerGroup().addTo(m) };
    m.on('click', (e: L.LeafletMouseEvent) => clickRef.current?.(e.latlng.lat, e.latlng.lng));
    void clusterReady.then(() => {
      if (disposed) return;
      layers.current!.cluster = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 48,
        iconCreateFunction: (c) => L.divIcon({
          className: '',
          iconSize: [56, 56],
          html: `<span class="inline-flex size-14 items-center justify-center rounded-full bg-brand/20"><span class="inline-flex size-11 items-center justify-center rounded-full bg-brand text-label text-on-brand ring-2 ring-surface shadow-md">${formatCount(c.getChildCount())}</span></span>`,
        }),
      }).addTo(m);
      m.fire('zona:ready');
    });
    return () => {
      disposed = true;
      // Stop any running pan/zoom first: removing a map mid-animation throws inside Leaflet.
      m.stop();
      m.off();
      m.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = map.current!;
    tiles.current?.remove();
    tiles.current = L.tileLayer(theme === 'dark' ? TILES.dark : TILES.light, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(m);
  }, [theme]);

  // Markers (re-rendered on change; clustering keeps hundreds cheap).
  useEffect(() => {
    const draw = () => {
      const cluster = layers.current?.cluster;
      if (!cluster || !map.current) return;
      cluster.clearLayers();
      for (const mk of markers) {
        const selected = mk.id === selectedId;
        const marker = L.marker([mk.lat, mk.lng], {
          icon: L.divIcon({ className: '', html: markerHtml(mk, selected), iconSize: selected ? [48, 56] : [40, 48], iconAnchor: selected ? [24, 56] : [20, 48] }),
          title: mk.ariaLabel,
          keyboard: true,
          zIndexOffset: selected ? 1000 : 0,
        });
        marker.on('click', () => onSelect?.(mk.id));
        cluster.addLayer(marker);
      }
      if (!fitted.current && fit === 'markers' && markers.length) {
        map.current!.fitBounds(L.latLngBounds(markers.map((x) => [x.lat, x.lng])), { padding: [48, 48], maxZoom: 15, animate: false });
        fitted.current = true;
      }
    };
    draw();
    map.current?.on('zona:ready', draw);
    return () => void map.current?.off('zona:ready', draw);
  }, [markers, selectedId, onSelect, fit]);

  // Geofences.
  useEffect(() => {
    const g = layers.current!.shapes;
    g.clearLayers();
    const bounds: L.LatLngBounds[] = [];
    for (const f of geofences) {
      const style = { color: css('brand-fg'), weight: 2, fillColor: css('brand'), fillOpacity: f.muted ? 0.05 : 0.12, opacity: f.muted ? 0.4 : 0.9 };
      const shape = f.geometry.type === 'Point'
        ? L.circle([f.geometry.coordinates[1], f.geometry.coordinates[0]], { radius: f.radiusM ?? 100, ...style })
        : L.polygon(f.geometry.coordinates[0]!.map(([x, y]) => [y, x] as L.LatLngTuple), style);
      shape.bindTooltip(f.label);
      shape.addTo(g);
      bounds.push(shape.getBounds());
    }
    if (fit === 'geofences' && bounds.length && !fitted.current) {
      map.current!.fitBounds(bounds.reduce((a, b) => a.extend(b)), { padding: [32, 32], animate: false });
      fitted.current = true;
    }
  }, [geofences, fit, theme]);

  // Trail (FR-ATM-03).
  useEffect(() => {
    const t = layers.current!.trail;
    t.clearLayers();
    if (!trail?.length) return;
    const pts = trail.map((p) => [p.lat, p.lng] as L.LatLngTuple);
    L.polyline(pts, { color: css('accent'), weight: 4, opacity: 0.9 }).addTo(t);
    L.circleMarker(pts[0]!, { radius: 6, color: css('surface'), weight: 2, fillColor: css('status-present-solid'), fillOpacity: 1 }).addTo(t);
    L.circleMarker(pts.at(-1)!, { radius: 7, color: css('surface'), weight: 2, fillColor: css('accent-strong'), fillOpacity: 1 }).addTo(t);
    if (fit === 'trail') map.current!.fitBounds(L.latLngBounds(pts), { padding: [48, 48], maxZoom: 16, animate: false });
  }, [trail, fit, theme]);

  // Draft geofence circle (create mode).
  useEffect(() => {
    const d = layers.current!.draft;
    d.clearLayers();
    if (draft) L.circle([draft.lat, draft.lng], { radius: draft.radiusM, color: css('accent-strong'), weight: 2, dashArray: '6 6', fillOpacity: 0.1 }).addTo(d);
  }, [draft, theme]);

  return <div ref={el} dir="ltr" role="region" aria-label={label} className={cn('z-0 overflow-hidden rounded-lg border border-line bg-sunken', onMapClick && 'cursor-crosshair', className)} />;
}
