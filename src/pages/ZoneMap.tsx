import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { MapPin, Thermometer, Layers, TreePine, Building2, Droplets, RefreshCw, AlertTriangle } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ── All 23 West Bengal Districts ──────────────────────────────────────────────
export interface District {
  id: string;
  name: string;
  lat: number;
  lng: number;
  // Filled after API fetch
  temperature?: number;
  humidity?: number;
  feelsLike?: number;
  description?: string;
  risk?: RiskLevel;
  color?: string;
}

export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Extreme';

export const WB_DISTRICTS: District[] = [
  { id: 'kolkata',        name: 'Kolkata',           lat: 22.5726,  lng: 88.3639 },
  { id: 'howrah',         name: 'Howrah',             lat: 22.5958,  lng: 88.2636 },
  { id: 'north24pgs',     name: 'North 24 Parganas',  lat: 22.8601,  lng: 88.5672 },
  { id: 'south24pgs',     name: 'South 24 Parganas',  lat: 22.1525,  lng: 88.7463 },
  { id: 'hooghly',        name: 'Hooghly',            lat: 22.9000,  lng: 88.3940 },
  { id: 'nadia',          name: 'Nadia',              lat: 23.4697,  lng: 88.5558 },
  { id: 'murshidabad',    name: 'Murshidabad',        lat: 24.1800,  lng: 88.2700 },
  { id: 'malda',          name: 'Malda',              lat: 25.0108,  lng: 88.1415 },
  { id: 'north_dinajpur', name: 'North Dinajpur',     lat: 25.6180,  lng: 88.1252 },
  { id: 'south_dinajpur', name: 'South Dinajpur',     lat: 25.6271,  lng: 88.6468 },
  { id: 'birbhum',        name: 'Birbhum',            lat: 23.8957,  lng: 87.5330 },
  { id: 'burdwan',        name: 'Paschim Bardhaman',  lat: 23.2324,  lng: 87.0862 },
  { id: 'purba_burdwan',  name: 'Purba Bardhaman',    lat: 23.2500,  lng: 88.0500 },
  { id: 'bankura',        name: 'Bankura',            lat: 23.2300,  lng: 87.0700 },
  { id: 'purulia',        name: 'Purulia',            lat: 23.3320,  lng: 86.3640 },
  { id: 'west_midnapore', name: 'Paschim Medinipur',  lat: 22.4239,  lng: 87.3219 },
  { id: 'east_midnapore', name: 'Purba Medinipur',    lat: 22.1600,  lng: 87.9600 },
  { id: 'jhargram',       name: 'Jhargram',           lat: 22.4500,  lng: 86.9900 },
  { id: 'darjeeling',     name: 'Darjeeling',         lat: 27.0360,  lng: 88.2627 },
  { id: 'kalimpong',      name: 'Kalimpong',          lat: 27.0587,  lng: 88.4733 },
  { id: 'jalpaiguri',     name: 'Jalpaiguri',         lat: 26.5445,  lng: 88.7179 },
  { id: 'cooch_behar',    name: 'Cooch Behar',        lat: 26.3452,  lng: 89.4439 },
  { id: 'alipurduar',     name: 'Alipurduar',         lat: 26.4900,  lng: 89.5200 },
];

// ── Risk thresholds (°C) ──────────────────────────────────────────────────────
function getRisk(temp: number): RiskLevel {
  if (temp >= 42) return 'Extreme';
  if (temp >= 38) return 'High';
  if (temp >= 33) return 'Moderate';
  return 'Low';
}

function getRiskColor(risk: RiskLevel): string {
  switch (risk) {
    case 'Extreme':  return '#dc2626';
    case 'High':     return '#f97316';
    case 'Moderate': return '#f59e0b';
    case 'Low':      return '#10b981';
  }
}

export const riskConfig: Record<RiskLevel, { bg: string; border: string; text: string; dot: string }> = {
  Low:      { bg: 'bg-emerald-950/60', border: 'border-emerald-700/60', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  Moderate: { bg: 'bg-amber-950/60',   border: 'border-amber-700/60',   text: 'text-amber-400',   dot: 'bg-amber-400'   },
  High:     { bg: 'bg-orange-950/60',  border: 'border-orange-700/60',  text: 'text-orange-400',  dot: 'bg-orange-400'  },
  Extreme:  { bg: 'bg-red-950/60',     border: 'border-red-700/60',     text: 'text-red-400',     dot: 'bg-red-400'     },
};

// ── OpenWeatherMap fetch ──────────────────────────────────────────────────────
// Replace with your OWM API key — free tier supports 60 calls/min
const OWM_API_KEY = import.meta.env.VITE_OWM_API_KEY ?? '';

async function fetchDistrictWeather(district: District): Promise<District> {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${district.lat}&lon=${district.lng}&appid=${OWM_API_KEY}&units=metric`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OWM error ${res.status} for ${district.name}`);
  const data = await res.json();

  const temperature: number = Math.round(data.main.temp);
  const feelsLike:   number = Math.round(data.main.feels_like);
  const humidity:    number = data.main.humidity;
  const description: string = data.weather?.[0]?.description ?? '';
  const risk    = getRisk(temperature);
  const color   = getRiskColor(risk);

  return { ...district, temperature, feelsLike, humidity, description, risk, color };
}

// ── Heat layer ────────────────────────────────────────────────────────────────
function HeatLayer({ districts }: { districts: District[] }) {
  const map = useMap();

  useEffect(() => {
    if (!districts.length) return;
    const loaded = districts.filter(d => d.temperature !== undefined);
    if (!loaded.length) return;

    import('leaflet.heat').then(() => {
      const temps  = loaded.map(d => d.temperature as number);
      const minT   = Math.min(...temps);
      const maxT   = Math.max(...temps);
      const span   = maxT - minT || 1;

      const heatPoints = loaded.map(d => {
        const intensity = (d.temperature! - minT) / span;
        return [d.lat, d.lng, intensity] as [number, number, number];
      });

      const heatLayer = (L as any).heatLayer(heatPoints, {
        radius:  70,
        blur:    55,
        maxZoom: 10,
        max:     1.0,
        gradient: {
          0.0:  '#10b981',
          0.25: '#f59e0b',
          0.55: '#f97316',
          0.80: '#ea580c',
          1.0:  '#dc2626',
        },
      });

      heatLayer.addTo(map);
      return () => { map.removeLayer(heatLayer); };
    });
  }, [map, districts]);

  return null;
}

// ── FlyTo ─────────────────────────────────────────────────────────────────────
function FlyToDistrict({ district }: { district: District | null }) {
  const map     = useMap();
  const prevRef = useRef<District | null>(null);

  useEffect(() => {
    if (district && district.id !== prevRef.current?.id) {
      map.flyTo([district.lat, district.lng], 10, { duration: 1.2 });
      prevRef.current = district;
    }
  }, [district, map]);

  return null;
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function DistrictSidebar({
  districts,
  selected,
  loading,
  onSelect,
}: {
  districts: District[];
  selected:  District | null;
  loading:   boolean;
  onSelect:  (d: District) => void;
}) {
  const sorted = [...districts].sort((a, b) =>
    (b.temperature ?? 0) - (a.temperature ?? 0)
  );

  return (
    <div className="w-full lg:w-80 shrink-0 flex flex-col glass-card overflow-hidden">
      <div className="p-5 border-b border-surface-700/50">
        <h2 className="section-title flex items-center gap-2">
          <Layers className="w-5 h-5 text-heat-500" />
          West Bengal Districts
        </h2>
        <p className="text-xs text-surface-500 mt-1">
          {loading ? 'Fetching live temperatures…' : `${districts.filter(d => d.temperature !== undefined).length} / ${districts.length} loaded · sorted by heat`}
        </p>
      </div>

      <div className="overflow-y-auto flex-1">
        {sorted.map((district) => {
          const risk       = district.risk ?? 'Low';
          const cfg        = riskConfig[risk];
          const isSelected = selected?.id === district.id;
          const ready      = district.temperature !== undefined;

          return (
            <button
              key={district.id}
              onClick={() => onSelect(district)}
              disabled={!ready}
              className={`w-full text-left px-5 py-4 border-b border-surface-800/50 transition-all duration-200 flex items-center gap-4 ${
                isSelected
                  ? 'bg-heat-600/15 border-l-2 border-l-heat-500'
                  : 'hover:bg-surface-800/50 border-l-2 border-l-transparent'
              } ${!ready ? 'opacity-40 cursor-wait' : ''}`}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={ready ? { backgroundColor: district.color + '20', border: `1px solid ${district.color}40` } : { backgroundColor: '#ffffff10', border: '1px solid #ffffff20' }}
              >
                {ready
                  ? <MapPin className="w-4 h-4" style={{ color: district.color }} />
                  : <div className="w-3 h-3 border border-surface-500 border-t-transparent rounded-full animate-spin" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-heat-100 text-sm truncate">{district.name}</span>
                  <span className="font-display font-bold text-sm shrink-0" style={ready ? { color: district.color } : { color: '#64748b' }}>
                    {ready ? `${district.temperature}°C` : '—'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {ready && (
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                      {risk}
                    </span>
                  )}
                  {ready && district.humidity !== undefined && (
                    <span className="text-xs text-surface-500">{district.humidity}% RH</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Popup content ─────────────────────────────────────────────────────────────
function DistrictPopup({ district }: { district: District }) {
  const risk = district.risk ?? 'Low';
  const cfg  = riskConfig[risk];

  return (
    <div className="min-w-[230px]">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-4 h-4" style={{ color: district.color }} />
        <span className="font-display font-semibold text-heat-100 text-sm">{district.name}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-surface-800/80 rounded-lg p-2 text-center">
          <div className="font-bold text-lg" style={{ color: district.color }}>{district.temperature}°C</div>
          <div className="text-xs text-surface-500">Temperature</div>
        </div>
        <div className="bg-surface-800/80 rounded-lg p-2 text-center">
          <div className={`font-bold text-sm ${cfg.text}`}>{risk}</div>
          <div className="text-xs text-surface-500">Risk Level</div>
        </div>
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-2 text-surface-400">
          <Thermometer className="w-3 h-3" />
          <span>Feels like: <span className="text-heat-200">{district.feelsLike}°C</span></span>
        </div>
        <div className="flex items-center gap-2 text-surface-400">
          <Droplets className="w-3 h-3" />
          <span>Humidity: <span className="text-blue-400">{district.humidity}%</span></span>
        </div>
        {district.description && (
          <div className="flex items-center gap-2 text-surface-400">
            <Building2 className="w-3 h-3" />
            <span className="capitalize text-heat-300">{district.description}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ZoneMap() {
  const [districts, setDistricts] = useState<District[]>(WB_DISTRICTS);
  const [selected,  setSelected]  = useState<District | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchAll = async () => {
    if (!OWM_API_KEY) {
      setError('No OpenWeatherMap API key found. Set VITE_OWM_API_KEY in your .env file.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Fetch in small batches to respect free-tier rate limits (60 req/min)
    const BATCH = 10;
    const updated = [...WB_DISTRICTS];

    for (let i = 0; i < updated.length; i += BATCH) {
      const batch = updated.slice(i, i + BATCH);
      const results = await Promise.allSettled(batch.map(fetchDistrictWeather));

      results.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          updated[i + idx] = result.value;
        }
      });

      // Update state after each batch so the UI fills in progressively
      setDistricts([...updated]);

      // Brief pause between batches
      if (i + BATCH < updated.length) {
        await new Promise(r => setTimeout(r, 1100));
      }
    }

    setLastFetch(new Date());
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // Also refresh selected district data when districts update
  useEffect(() => {
    if (selected) {
      const updated = districts.find(d => d.id === selected.id);
      if (updated && updated.temperature !== undefined) setSelected(updated);
    }
  }, [districts]);

  const loadedCount = districts.filter(d => d.temperature !== undefined).length;

  return (
    <div className="flex flex-col lg:flex-row gap-0 h-[calc(100vh-64px)] overflow-hidden animate-fade-in">
      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          // Centred on West Bengal
          center={[23.8, 87.8]}
          zoom={7}
          className="w-full h-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <HeatLayer districts={districts} />
          <FlyToDistrict district={selected} />

          {districts
            .filter(d => d.temperature !== undefined)
            .map((district) => (
              <CircleMarker
                key={district.id}
                center={[district.lat, district.lng]}
                radius={selected?.id === district.id ? 16 : 10}
                pathOptions={{
                  color:       district.color!,
                  fillColor:   district.color!,
                  fillOpacity: selected?.id === district.id ? 0.65 : 0.45,
                  weight:      selected?.id === district.id ? 3 : 1.5,
                }}
                eventHandlers={{ click: () => setSelected(district) }}
              >
                <Popup maxWidth={260}>
                  <DistrictPopup district={district} />
                </Popup>
              </CircleMarker>
            ))}
        </MapContainer>

        {/* Risk legend */}
        <div className="absolute bottom-4 left-4 z-[1000] glass-card px-4 py-3 text-xs space-y-1.5">
          <div className="text-surface-400 font-medium mb-2 uppercase tracking-wider text-[10px]">
            Risk Legend
          </div>
          {(['Low', 'Moderate', 'High', 'Extreme'] as const).map((level) => {
            const cfg = riskConfig[level];
            return (
              <div key={level} className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                <span className={cfg.text}>{level}</span>
              </div>
            );
          })}
        </div>

        {/* Header bar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] glass-card px-4 py-2 flex items-center gap-3">
          <Thermometer className="w-4 h-4 text-heat-400" />
          <span className="text-sm font-medium text-heat-200">West Bengal Heat Map</span>
          {lastFetch && (
            <span className="text-[10px] text-surface-500">
              · Updated {lastFetch.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchAll}
            disabled={loading}
            className="ml-1 p-1 rounded hover:bg-surface-700/60 transition-colors disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw className={`w-3 h-3 text-surface-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Loading progress bar */}
        {loading && (
          <div className="absolute top-0 left-0 right-0 z-[1001] h-0.5 bg-surface-800">
            <div
              className="h-full bg-heat-500 transition-all duration-500"
              style={{ width: `${(loadedCount / WB_DISTRICTS.length) * 100}%` }}
            />
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[1001] glass-card px-4 py-3 flex items-center gap-2 border border-red-700/50 max-w-sm">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-xs text-red-300">{error}</span>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <DistrictSidebar
        districts={districts}
        selected={selected}
        loading={loading}
        onSelect={setSelected}
      />
    </div>
  );
}