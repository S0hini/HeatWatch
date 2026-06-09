import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Activity,
  TrendingUp,
  Clock,
  MapPin,
  Loader2,
  AlertTriangle,
  Search,
  X,
  Info,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

// ── Types ─────────────────────────────────────────────────────────────────────
export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Extreme';

interface CityWeather {
  name: string;
  lat: number;
  lon: number;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;   // km/h
  uvIndex: number;
  description: string;
  risk: RiskLevel;
  riskReason: string;
  color: string;
}

interface HourlyPoint {
  hour: string;
  temp: number;
  feelsLike: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const OWM_KEY = import.meta.env.VITE_OWM_API_KEY ?? '';
const ROTATE_MS = 5000;

export const riskConfig: Record<RiskLevel, { bg: string; border: string; text: string; dot: string; hex: string }> = {
  Low:      { bg: 'bg-emerald-950/60', border: 'border-emerald-700/60', text: 'text-emerald-400', dot: 'bg-emerald-400', hex: '#10b981' },
  Moderate: { bg: 'bg-amber-950/60',   border: 'border-amber-700/60',   text: 'text-amber-400',   dot: 'bg-amber-400',   hex: '#f59e0b' },
  High:     { bg: 'bg-orange-950/60',  border: 'border-orange-700/60',  text: 'text-orange-400',  dot: 'bg-orange-400',  hex: '#f97316' },
  Extreme:  { bg: 'bg-red-950/60',     border: 'border-red-700/60',     text: 'text-red-400',     dot: 'bg-red-400',     hex: '#dc2626' },
};

// ── XAI: Risk classification with transparent reasoning ───────────────────────
function getRisk(
  temp: number,
  feelsLike?: number,
  humidity?: number
): { level: RiskLevel; reason: string; color: string } {
  const hi  = feelsLike ?? temp;
  const hum = humidity ?? 0;

  let level: RiskLevel;
  if (temp >= 42)      level = 'Extreme';
  else if (temp >= 38) level = 'High';
  else if (temp >= 33) level = 'Moderate';
  else                 level = 'Low';

  const factors: string[] = [];

  // Primary factor: temperature threshold
  if (temp >= 42)
    factors.push(`Temp ${temp}°C ≥ 42°C (Extreme threshold)`);
  else if (temp >= 38)
    factors.push(`Temp ${temp}°C ≥ 38°C (High threshold)`);
  else if (temp >= 33)
    factors.push(`Temp ${temp}°C ≥ 33°C (Moderate threshold)`);
  else
    factors.push(`Temp ${temp}°C < 33°C (Safe range)`);

  // Secondary factor: humidity
  if (hum >= 70)
    factors.push(`Humidity ${hum}% — high, amplifies heat stress significantly`);
  else if (hum >= 50)
    factors.push(`Humidity ${hum}% — moderate, some added discomfort`);
  else if (hum > 0)
    factors.push(`Humidity ${hum}% — low, minimal added stress`);

  // Tertiary factor: feels-like delta
  const delta = hi - temp;
  if (delta >= 6)
    factors.push(`Feels like ${hi}°C (+${delta}°C above actual — humidity effect)`);
  else if (delta >= 3)
    factors.push(`Feels like ${hi}°C (+${delta}°C above actual)`);
  else if (hi !== temp)
    factors.push(`Feels like ${hi}°C (close to actual temp)`);

  return {
    level,
    reason: factors.join(' · '),
    color: riskConfig[level].hex,
  };
}

// ── Hardcoded WB city seed ────────────────────────────────────────────────────
const WB_CITY_SEED: Array<{ name: string; lat: number; lon: number }> = [
  { name: 'Kolkata',         lat: 22.5726, lon: 88.3639 },
  { name: 'Howrah',          lat: 22.5958, lon: 88.2636 },
  { name: 'Durgapur',        lat: 23.5204, lon: 87.3119 },
  { name: 'Asansol',         lat: 23.6739, lon: 86.9524 },
  { name: 'Siliguri',        lat: 26.7271, lon: 88.3953 },
  { name: 'Bardhaman',       lat: 23.2324, lon: 87.8615 },
  { name: 'Malda',           lat: 25.0108, lon: 88.1415 },
  { name: 'Baharampur',      lat: 24.1040, lon: 88.2510 },
  { name: 'Habra',           lat: 22.8430, lon: 88.6550 },
  { name: 'Kharagpur',       lat: 22.3460, lon: 87.2320 },
  { name: 'Shantipur',       lat: 23.2488, lon: 88.4340 },
  { name: 'Darjeeling',      lat: 27.0360, lon: 88.2627 },
  { name: 'Jalpaiguri',      lat: 26.5445, lon: 88.7179 },
  { name: 'Cooch Behar',     lat: 26.3452, lon: 89.4439 },
  { name: 'Krishnanagar',    lat: 23.4010, lon: 88.5030 },
  { name: 'Barasat',         lat: 22.7220, lon: 88.4820 },
  { name: 'Raiganj',         lat: 25.6200, lon: 88.1200 },
  { name: 'Balurghat',       lat: 25.2290, lon: 88.7740 },
  { name: 'Medinipur',       lat: 22.4239, lon: 87.3219 },
  { name: 'Haldia',          lat: 22.0667, lon: 88.0698 },
  { name: 'Tamluk',          lat: 22.2993, lon: 87.9204 },
  { name: 'Bankura',         lat: 23.2300, lon: 87.0700 },
  { name: 'Purulia',         lat: 23.3320, lon: 86.3640 },
  { name: 'Bolpur',          lat: 23.6694, lon: 87.7170 },
  { name: 'Kalimpong',       lat: 27.0587, lon: 88.4733 },
  { name: 'Alipurduar',      lat: 26.4900, lon: 89.5200 },
  { name: 'Jhargram',        lat: 22.4500, lon: 86.9900 },
  { name: 'Diamond Harbour', lat: 22.1919, lon: 88.1922 },
  { name: 'Basirhat',        lat: 22.6570, lon: 88.8870 },
  { name: 'Bishnupur',       lat: 23.0741, lon: 87.3161 },
];

// ── Overpass: fetch WB cities in background ───────────────────────────────────
async function fetchWBCitiesFromOverpass(): Promise<Array<{ name: string; lat: number; lon: number }>> {
  const query = `[out:json][timeout:25];area["name"="West Bengal"]["admin_level"="4"]->.wb;(node["place"~"city|town"]["name"](area.wb););out body;`;
  const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: query });
  if (!res.ok) throw new Error('Overpass fetch failed');
  const data = await res.json();
  return (data.elements as any[])
    .filter((el: any) => el.tags?.name)
    .map((el: any) => ({ name: el.tags.name, lat: el.lat, lon: el.lon }))
    .filter((city, idx, arr) => arr.findIndex((c: any) => c.name === city.name) === idx);
}

// ── OWM: current weather for a city ──────────────────────────────────────────
async function fetchCityWeather(city: { name: string; lat: number; lon: number }): Promise<CityWeather> {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&appid=${OWM_KEY}&units=metric`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OWM error ${res.status} for ${city.name}`);
  const d = await res.json();

  const temperature = Math.round(d.main.temp);
  const feelsLike   = Math.round(d.main.feels_like);
  const humidity    = d.main.humidity;
  const windSpeed   = Math.round((d.wind?.speed ?? 0) * 3.6);
  const description = d.weather?.[0]?.description ?? '';
  const clouds      = d.clouds?.all ?? 0;
  const uvIndex     = Math.round(Math.max(0, (10 - clouds / 12) * (temperature > 30 ? 1.1 : 0.85)));

  const { level: risk, reason: riskReason, color } = getRisk(temperature, feelsLike, humidity);

  return { name: city.name, lat: city.lat, lon: city.lon, temperature, feelsLike, humidity, windSpeed, uvIndex, description, risk, riskReason, color };
}

// ── OWM: hourly forecast ──────────────────────────────────────────────────────
async function fetchHourlyForecast(lat: number, lon: number): Promise<HourlyPoint[]> {
  try {
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&units=metric&exclude=current,minutely,daily,alerts`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OWM One Call ${res.status}`);
    const d = await res.json();
    const slots: any[] = (d.hourly ?? []).slice(0, 24);
    if (!slots.length) throw new Error('No hourly slots');
    return slots.map((item: any) => {
      const dt   = new Date(item.dt * 1000);
      const hour = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      return { hour, temp: Math.round(item.temp), feelsLike: Math.round(item.feels_like) };
    });
  } catch {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&units=metric&cnt=8`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Forecast fetch failed');
    const d = await res.json();
    return (d.list as any[]).map((item: any) => {
      const dt   = new Date(item.dt * 1000);
      const hour = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      return { hour, temp: Math.round(item.main.temp), feelsLike: Math.round(item.main.feels_like) };
    });
  }
}

// ── Geolocation helper ────────────────────────────────────────────────────────
function getUserLocation(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      err => reject(err),
      { timeout: 10000, enableHighAccuracy: true }
    );
  });
}

// ── Reverse geocode ───────────────────────────────────────────────────────────
async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${OWM_KEY}`
    );
    if (!res.ok) throw new Error('OWM reverse geocode failed');
    const data = await res.json();
    if (!data?.length) throw new Error('No result');
    const r = data[0];
    return r.local_names?.en ?? r.name ?? 'Your Location';
  } catch {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=14&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const d    = await res.json();
      const addr = d?.address ?? {};
      return addr.village ?? addr.town ?? addr.suburb ?? addr.city_district ?? addr.city ?? addr.county ?? 'Your Location';
    } catch {
      return 'Your Location';
    }
  }
}

// ── Search city by name ───────────────────────────────────────────────────────
async function searchCityByName(query: string): Promise<CityWeather> {
  const biasedQuery = query.includes(',') ? query : `${query},IN`;
  const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(biasedQuery)}&limit=5&appid=${OWM_KEY}`;
  const geoRes = await fetch(geoUrl);
  if (!geoRes.ok) throw new Error(`Geocoding error ${geoRes.status}`);
  const geoData = await geoRes.json();
  const indiaResult = geoData.find((r: any) => r.country === 'IN') ?? geoData[0];
  if (!indiaResult) throw new Error(`No results found for "${query}"`);
  const { lat, lon } = indiaResult;
  const name = indiaResult.local_names?.en ?? indiaResult.name;
  return fetchCityWeather({ name, lat, lon });
}

// ── Autocomplete ──────────────────────────────────────────────────────────────
interface GeoSuggestion { name: string; state?: string; country: string; lat: number; lon: number; displayName: string; }

async function fetchSuggestions(query: string): Promise<GeoSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const params = new URLSearchParams({
      q, format: 'json', addressdetails: '1', limit: '8',
      countrycodes: 'in', featuretype: 'city', 'accept-language': 'en', dedupe: '1',
    });
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { 'Accept-Language': 'en' },
    });
    if (!res.ok) throw new Error('Nominatim failed');
    const data: any[] = await res.json();
    const seen = new Set<string>();
    const results: GeoSuggestion[] = [];
    for (const r of data) {
      const addr  = r.address ?? {};
      const name  = addr.village ?? addr.town ?? addr.city_district ?? addr.city ?? r.name;
      const state = addr.state ?? addr.county;
      const key   = `${name}|${state}`;
      if (!name || seen.has(key)) continue;
      seen.add(key);
      results.push({ name, state, country: 'IN', lat: parseFloat(r.lat), lon: parseFloat(r.lon), displayName: [name, state].filter(Boolean).join(', ') });
    }
    return results.slice(0, 6);
  } catch {
    try {
      const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q + ',IN')}&limit=5&appid=${OWM_KEY}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data: any[] = await res.json();
      return data.filter(r => r.country === 'IN').map(r => ({
        name: r.local_names?.en ?? r.name, state: r.state, country: 'IN',
        lat: r.lat, lon: r.lon,
        displayName: [r.local_names?.en ?? r.name, r.state].filter(Boolean).join(', '),
      }));
    } catch { return []; }
  }
}

async function fetchUserLocationWeather(lat: number, lon: number, name: string): Promise<CityWeather> {
  return fetchCityWeather({ name, lat, lon });
}

// ── UI Components ─────────────────────────────────────────────────────────────
function PremiumBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-[#070608]">
      <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat bg-fixed" style={{ backgroundImage: "url('/bg.png')" }} />
      <div className="absolute inset-0 z-[1] bg-[#070608]/35" />
      <div className="relative z-[2]">{children}</div>
    </div>
  );
}

function PremiumCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`group relative rounded-2xl border border-orange-500/20 bg-transparent backdrop-blur-md transition-all duration-300 hover:-translate-y-[2px] ${className}`}>
      <div className="pointer-events-none absolute -inset-[3px] rounded-2xl blur-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-orange-500/20 -z-10" />
      {children}
    </div>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  accent?: string;
  loading?: boolean;
}

function StatCard({ icon: Icon, label, value, unit, sub, accent = '#f97316', loading }: StatCardProps) {
  return (
    <PremiumCard className="p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-orange-300/70 uppercase tracking-wider">{label}</span>
        <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/10" style={{ color: accent }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
        </div>
      </div>
      <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }} className="text-4xl font-medium text-heat-50 leading-none transition-all duration-500">
        {loading ? <span className="text-2xl text-orange-300/30">—</span> : <>{value}{unit && <span className="text-xl text-orange-400/70 ml-1">{unit}</span>}</>}
      </div>
      {sub && <div className="text-xs text-orange-300/55 mt-2">{sub}</div>}
    </PremiumCard>
  );
}

// ── HeatBadge with XAI reasoning panel ───────────────────────────────────────
function HeatBadge({ risk, reason }: { risk: RiskLevel; reason?: string }) {
  const cfg     = riskConfig[risk];
  const pulsing = risk === 'Extreme' || risk === 'High';
  const factors = reason ? reason.split(' · ') : [];

  return (
    <div className="group relative rounded-2xl transition-all duration-300 ease-out hover:-translate-y-[2px]">
      <div className="pointer-events-none absolute -inset-[3px] rounded-2xl opacity-0 blur-2xl transition-opacity duration-300 bg-orange-500/0 group-hover:opacity-100 group-hover:bg-orange-500/25" />
      <div className="relative flex flex-col items-center justify-center p-6 rounded-2xl overflow-hidden border border-orange-500/25 bg-orange-950/38 backdrop-blur-md h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/18 via-orange-900/10 to-transparent" />
        {pulsing && <div className={`absolute inset-0 ${cfg.bg} animate-pulse-slow rounded-2xl`} />}

        <div className="relative z-10 flex flex-col items-center gap-3 w-full">
          <Thermometer className={`w-10 h-10 ${cfg.text}`} />
          <div>
            <div className="text-center text-xs text-orange-300/60 uppercase tracking-wider mb-1">Heat Risk Level</div>
            <div className={`font-display font-bold text-4xl text-center ${cfg.text}`}>{risk}</div>
          </div>
          <div className={`flex items-center gap-2 text-xs ${cfg.text}/70`}>
            <span className={`w-2 h-2 rounded-full ${cfg.dot} ${pulsing ? 'animate-pulse' : ''}`} />
            {risk === 'Extreme' && 'Seek shelter immediately'}
            {risk === 'High'    && 'Limit outdoor exposure'}
            {risk === 'Moderate'&& 'Take precautions'}
            {risk === 'Low'     && 'Conditions safe'}
          </div>

          {/* ── XAI: Transparent reasoning panel ── */}
          {factors.length > 0 && (
            <div className="mt-3 w-full rounded-xl bg-black/25 border border-orange-500/15 px-3 py-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Info className="w-3 h-3 text-orange-400/50" />
                <span className="text-[9px] text-orange-300/50 uppercase tracking-widest font-mono">Why this rating</span>
              </div>
              <div className="space-y-1.5">
                {factors.map((factor, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot} opacity-70`} />
                    <span className="text-[10px] text-orange-200/65 font-mono leading-relaxed">{factor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1d1212]/95 border border-orange-500/20 rounded-xl px-4 py-3 shadow-card backdrop-blur-xl">
      <p className="text-xs text-orange-300/60 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-heat-100">{p.value}°C</span>
          <span className="text-orange-300/55 text-xs">{p.name}</span>
        </div>
      ))}
    </div>
  );
}

// ── City Ticker ───────────────────────────────────────────────────────────────
function CityTicker({
  cities, pinnedCity, onCityClick, onAll,
}: {
  cities: CityWeather[];
  pinnedCity: CityWeather | null;
  onCityClick: (city: CityWeather) => void;
  onAll: () => void;
}) {
  if (!cities.length) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none items-center">
      {cities.map((city) => {
        const cfg      = riskConfig[city.risk];
        const isActive = pinnedCity?.name === city.name;
        return (
          <button
            key={city.name}
            onClick={() => onCityClick(city)}
            className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95 ${
              isActive
                ? `${cfg.bg} ${cfg.border} ${cfg.text} ring-1 ring-offset-0`
                : 'border-orange-500/15 text-orange-300/40 bg-transparent hover:border-orange-500/35 hover:text-orange-300/70'
            }`}
            style={isActive ? { ringColor: cfg.hex } : undefined}
            title={`Show ${city.name} weather`}
          >
            <MapPin className="w-3 h-3" />
            <span className="text-[10px] font-mono uppercase tracking-wider">{city.name}</span>
            <span className="text-[10px] font-mono font-bold">{city.temperature}°C</span>
          </button>
        );
      })}
      {pinnedCity && (
        <button
          onClick={onAll}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-orange-500/40 bg-orange-500/15 text-orange-300 text-[10px] font-mono uppercase tracking-wider transition-all duration-300 hover:bg-orange-500/25 hover:text-orange-200 active:scale-95"
        >
          <X className="w-2.5 h-2.5" />
          All
        </button>
      )}
    </div>
  );
}

// ── Zone Overview ─────────────────────────────────────────────────────────────
function ZoneOverview({ cities, lastUpdated }: { cities: CityWeather[]; lastUpdated: Date | null }) {
  if (!cities.length) return (
    <div className="flex items-center gap-2 py-4 text-orange-300/40">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className="text-xs">Loading city data…</span>
    </div>
  );

  const top5 = [...cities].sort((a, b) => b.temperature - a.temperature).slice(0, 5);

  return (
    <div>
      {lastUpdated && (
        <p className="text-[10px] text-orange-300/30 font-mono mb-4">
          Last updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · refreshes every 2h
        </p>
      )}
      <div className="space-y-4">
        {top5.map((city, i) => {
          const cfg = riskConfig[city.risk];
          const pct = Math.max(0, Math.min(100, ((city.temperature - 20) / (45 - 20)) * 100));
          return (
            <div key={city.name}>
              {i > 0 && <div className="h-px bg-orange-500/10 mb-4" />}
              <div className="flex items-center gap-4 rounded-lg px-2 py-1 -mx-2">
                <div className="flex items-center gap-2 w-8 shrink-0">
                  <span className="text-[11px] font-mono text-orange-300/30">#{i + 1}</span>
                </div>
                <div className="w-28 shrink-0">
                  <div className="text-[13px] font-medium text-heat-100 truncate">{city.name}</div>
                  <div className={`text-[10px] font-mono uppercase tracking-wider mt-0.5 ${cfg.text}`}>{city.risk}</div>
                </div>
                <div className="flex-1 bg-black/30 rounded-full h-1.5 overflow-hidden border border-orange-500/10">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: city.color }} />
                </div>
                <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }} className="text-2xl font-medium shrink-0 w-16 text-right">
                  <span style={{ color: city.color }}>{city.temperature}°</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [time,           setTime]           = useState(new Date());
  const [cities,         setCities]         = useState<CityWeather[]>([]);
  const [cityPool,       setCityPool]       = useState<Array<{ name: string; lat: number; lon: number }>>([]);
  const [activeIdx,      setActiveIdx]      = useState(0);
  const [activeCity,     setActiveCity]     = useState<CityWeather | null>(null);
  const [hourlyData,     setHourlyData]     = useState<HourlyPoint[]>([]);
  const [userLocation,   setUserLocation]   = useState<{ lat: number; lon: number; name: string } | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [loadingHourly,  setLoadingHourly]  = useState(false);
  const [loadingCities,  setLoadingCities]  = useState(true);
  const [locationDenied, setLocationDenied] = useState(false);
  const [geoRetryCount,  setGeoRetryCount]  = useState(0);
  const [error,          setError]          = useState<string | null>(null);
  const [overviewLastUpdated, setOverviewLastUpdated] = useState<Date | null>(null);

  const [searchQuery,         setSearchQuery]         = useState('');
  const [searchLoading,       setSearchLoading]       = useState(false);
  const [searchError,         setSearchError]         = useState<string | null>(null);
  const [searchedCity,        setSearchedCity]        = useState<CityWeather | null>(null);
  const [searchedHourly,      setSearchedHourly]      = useState<HourlyPoint[]>([]);
  const [searchLoadingHourly, setSearchLoadingHourly] = useState(false);
  const [suggestions,         setSuggestions]         = useState<GeoSuggestion[]>([]);
  const [suggestionsLoading,  setSuggestionsLoading]  = useState(false);
  const [showSuggestions,     setShowSuggestions]     = useState(false);
  const searchInputRef    = useRef<HTMLInputElement>(null);
  const suggestDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [userLocWeather,      setUserLocWeather]      = useState<CityWeather | null>(null);
  const [recentCities,        setRecentCities]        = useState<CityWeather[]>([]);
  const [pinnedCity,          setPinnedCity]          = useState<CityWeather | null>(null);
  const [pinnedHourly,        setPinnedHourly]        = useState<HourlyPoint[]>([]);
  const [pinnedHourlyLoading, setPinnedHourlyLoading] = useState(false);

  const fetchedCitiesRef = useRef<Map<string, CityWeather>>(new Map());
  const rotateTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const cityPoolRef      = useRef<Array<{ name: string; lat: number; lon: number }>>([]);

  // ── Clock ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // ── Load cities ────────────────────────────────────────────────────────────
  useEffect(() => {
    const shuffled = [...WB_CITY_SEED].sort(() => Math.random() - 0.5);
    setCityPool(shuffled);
    cityPoolRef.current = shuffled;
    setLoadingCities(false);

    fetchWBCitiesFromOverpass().then(overpassCities => {
      const seedNames = new Set(WB_CITY_SEED.map(c => c.name));
      const extra     = overpassCities.filter(c => !seedNames.has(c.name));
      const merged    = [...shuffled, ...extra].sort(() => Math.random() - 0.5);
      setCityPool(merged);
      cityPoolRef.current = merged;
    }).catch(() => {});
  }, []);

  // ── Fetch weather for a city by index ─────────────────────────────────────
  const fetchCityAtIndex = useCallback(async (idx: number) => {
    const pool = cityPoolRef.current;
    if (!pool.length) return;
    const city   = pool[idx % pool.length];
    const cached = fetchedCitiesRef.current.get(city.name);
    if (cached) {
      setActiveCity(cached);
      setCities(prev => {
        const exists = prev.find(c => c.name === cached.name);
        return exists ? prev.map(c => c.name === cached.name ? cached : c) : [...prev, cached];
      });
      setRecentCities(prev => {
        const filtered = prev.filter(c => c.name !== cached.name);
        return [cached, ...filtered].slice(0, 5);
      });
      return;
    }
    setLoadingWeather(true);
    try {
      const weather = await fetchCityWeather(city);
      fetchedCitiesRef.current.set(city.name, weather);
      setActiveCity(weather);
      setCities(prev => {
        const exists = prev.find(c => c.name === weather.name);
        return exists ? prev.map(c => c.name === weather.name ? weather : c) : [...prev, weather];
      });
      setRecentCities(prev => {
        const filtered = prev.filter(c => c.name !== weather.name);
        return [weather, ...filtered].slice(0, 5);
      });
    } catch { /* silently skip */ } finally {
      setLoadingWeather(false);
    }
  }, []);

  // ── 5-second rotation ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!cityPool.length) return;
    fetchCityAtIndex(0);
    rotateTimerRef.current = setInterval(() => {
      setActiveIdx(prev => {
        const next = (prev + 1) % cityPool.length;
        fetchCityAtIndex(next);
        return next;
      });
    }, ROTATE_MS);
    return () => { if (rotateTimerRef.current) clearInterval(rotateTimerRef.current); };
  }, [cityPool, fetchCityAtIndex]);

  // ── User location + hourly forecast ───────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoadingHourly(true);
      setLocationDenied(false);
      try {
        const loc = await getUserLocation();
        const [locName, weather, hourly] = await Promise.allSettled([
          reverseGeocode(loc.lat, loc.lon),
          fetchUserLocationWeather(loc.lat, loc.lon, 'Your Location'),
          fetchHourlyForecast(loc.lat, loc.lon),
        ]);
        const name = locName.status === 'fulfilled' ? locName.value : 'Your Location';
        setUserLocation({ lat: loc.lat, lon: loc.lon, name });
        if (weather.status === 'fulfilled') setUserLocWeather({ ...weather.value, name });
        if (hourly.status === 'fulfilled')  setHourlyData(hourly.value);
      } catch (err: any) {
        const isDenied = err?.code === 1;
        setLocationDenied(isDenied);
        setUserLocation({ lat: 0, lon: 0, name: isDenied ? 'Location denied' : 'Location unavailable' });
        setHourlyData([]);
      } finally {
        setLoadingHourly(false);
      }
    })();
  }, [geoRetryCount]);

  // ── Refresh user location weather every 15 min ────────────────────────────
  useEffect(() => {
    const id = setInterval(async () => {
      if (!userLocation || userLocation.lat === 0) return;
      try {
        const w = await fetchUserLocationWeather(userLocation.lat, userLocation.lon, userLocation.name);
        setUserLocWeather({ ...w, name: userLocation.name });
      } catch { /* silent */ }
    }, 15 * 60 * 1000);
    return () => clearInterval(id);
  }, [userLocation]);

  // ── Refresh hourly every 2h ───────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(async () => {
      if (!userLocation || userLocation.lat === 0) return;
      try {
        const hourly = await fetchHourlyForecast(userLocation.lat, userLocation.lon);
        setHourlyData(hourly);
      } catch { /* silent */ }
    }, 2 * 60 * 60 * 1000);
    return () => clearInterval(id);
  }, [userLocation]);

  // ── Refresh overview every 2h ─────────────────────────────────────────────
  useEffect(() => {
    if (cities.length > 0) setOverviewLastUpdated(new Date());
  }, [cities]);

  useEffect(() => {
    const id = setInterval(async () => {
      const pool = cityPoolRef.current.slice(0, 30);
      const refreshed: CityWeather[] = [];
      for (const city of pool) {
        try {
          const w = await fetchCityWeather(city);
          fetchedCitiesRef.current.set(city.name, w);
          refreshed.push(w);
        } catch { /* skip */ }
        await new Promise(r => setTimeout(r, 500));
      }
      if (refreshed.length) {
        setCities(prev => {
          const map = new Map(prev.map(c => [c.name, c]));
          refreshed.forEach(w => map.set(w.name, w));
          return Array.from(map.values());
        });
        setOverviewLastUpdated(new Date());
      }
    }, 2 * 60 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // ── Search handler ────────────────────────────────────────────────────────
  const handleSearch = useCallback(async (q: string) => {
    const query = q.trim();
    if (!query) return;
    setSearchLoading(true);
    setSearchError(null);
    setSearchedCity(null);
    setSearchedHourly([]);
    setSuggestions([]);
    setShowSuggestions(false);
    try {
      const weather = await searchCityByName(query);
      setSearchedCity(weather);
      setSearchLoadingHourly(true);
      try {
        const hourly = await fetchHourlyForecast(weather.lat, weather.lon);
        setSearchedHourly(hourly);
      } catch { /* silent */ } finally {
        setSearchLoadingHourly(false);
      }
    } catch (e: any) {
      setSearchError(e.message ?? 'City not found');
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleExitSearch = useCallback(() => {
    setSearchedCity(null);
    setSearchedHourly([]);
    setSearchQuery('');
    setSearchError(null);
    setSuggestions([]);
    setShowSuggestions(false);
  }, []);

  const handleSearchInput = useCallback((value: string) => {
    setSearchQuery(value);
    setSearchError(null);
    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    if (value.trim().length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    setSuggestionsLoading(true);
    setShowSuggestions(true);
    suggestDebounceRef.current = setTimeout(async () => {
      try {
        const results = await fetchSuggestions(value);
        setSuggestions(results);
      } catch { setSuggestions([]); } finally { setSuggestionsLoading(false); }
    }, 320);
  }, []);

  const handleSuggestionClick = useCallback(async (suggestion: GeoSuggestion) => {
    setSearchQuery(suggestion.name);
    setSuggestions([]);
    setShowSuggestions(false);
    setSearchLoading(true);
    setSearchError(null);
    setSearchedCity(null);
    setSearchedHourly([]);
    try {
      const weather = await fetchCityWeather({ name: suggestion.name, lat: suggestion.lat, lon: suggestion.lon });
      setSearchedCity(weather);
      setSearchLoadingHourly(true);
      try {
        const hourly = await fetchHourlyForecast(suggestion.lat, suggestion.lon);
        setSearchedHourly(hourly);
      } catch { /* silent */ } finally { setSearchLoadingHourly(false); }
    } catch (e: any) {
      setSearchError(e.message ?? 'Failed to fetch weather');
    } finally { setSearchLoading(false); }
  }, []);

  const handleTickerCityClick = useCallback(async (city: CityWeather) => {
    setPinnedCity(city);
    setPinnedHourly([]);
    setPinnedHourlyLoading(true);
    try {
      const hourly = await fetchHourlyForecast(city.lat, city.lon);
      setPinnedHourly(hourly);
    } catch { /* silent */ } finally { setPinnedHourlyLoading(false); }
  }, []);

  const handleUnpin = useCallback(() => { setPinnedCity(null); setPinnedHourly([]); }, []);

  // ── Derived values ────────────────────────────────────────────────────────
  const isSearchMode  = searchedCity !== null;
  const isPinnedMode  = pinnedCity !== null && !isSearchMode;
  const displayCity   = isSearchMode ? searchedCity : isPinnedMode ? pinnedCity : activeCity;
  const displayHourly = isSearchMode ? searchedHourly : isPinnedMode ? pinnedHourly : hourlyData;
  const displayHourlyLoading = isSearchMode ? searchLoadingHourly : isPinnedMode ? pinnedHourlyLoading : loadingHourly;

  // XAI: compute live risk with full reasoning from display city's live data
  const liveRiskResult = displayCity
    ? getRisk(displayCity.temperature, displayCity.feelsLike, displayCity.humidity)
    : null;
  const liveRisk: RiskLevel   = liveRiskResult?.level   ?? 'Low';
  const liveRiskReason: string = liveRiskResult?.reason ?? '';

  const headerTemp = userLocWeather?.temperature ?? null;
  const timeStr    = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr    = time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <PremiumBackground>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-6 border-b border-orange-500/15">
          <div className="flex-1">
            <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }} className="font-light text-5xl tracking-tight text-heat-50 leading-none mb-2 flex items-end gap-3">
              <span>{displayCity?.name ?? (isSearchMode ? '…' : 'West Bengal')}</span>
              <em className="italic text-orange-400/70 text-4xl">UHI Monitor</em>
            </h1>

            {!isSearchMode && (
              <div className="mt-3">
                {loadingCities && recentCities.length === 0 ? (
                  <div className="flex items-center gap-2 text-orange-300/40">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="text-xs font-mono">Fetching WB cities from OpenStreetMap…</span>
                  </div>
                ) : (
                  <CityTicker
                    cities={recentCities}
                    pinnedCity={isPinnedMode ? pinnedCity : null}
                    onCityClick={handleTickerCityClick}
                    onAll={handleUnpin}
                  />
                )}
              </div>
            )}

            {isSearchMode && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-300 text-xs font-mono">
                  <Search className="w-3 h-3" />
                  Showing search result for "{searchQuery}"
                  <button onClick={handleExitSearch} className="ml-1 flex items-center gap-1 hover:text-orange-100 transition-colors" title="Back to default dashboard">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            <p className="mono-label mt-3 text-orange-400/70">{dateStr.toUpperCase()}</p>
          </div>

          <div className="flex flex-col items-end gap-2">
            {/* Search bar */}
            <div className="relative">
              <form onSubmit={e => { e.preventDefault(); handleSearch(searchQuery); }} className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-[#1d1212]/65 border border-orange-500/20 rounded-xl px-3.5 py-2 backdrop-blur-xl focus-within:border-orange-500/50 transition-colors">
                  <Search className="w-3.5 h-3.5 text-orange-400/50 shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={e => handleSearchInput(e.target.value)}
                    onFocus={() => { if (suggestions.length) setShowSuggestions(true); }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    placeholder="Search city or town…"
                    className="bg-transparent text-heat-100 text-[13px] font-mono placeholder-orange-300/25 outline-none w-44"
                    autoComplete="off"
                  />
                  {(searchLoading || suggestionsLoading) && <Loader2 className="w-3.5 h-3.5 text-orange-400 animate-spin shrink-0" />}
                  {isSearchMode && !searchLoading && (
                    <button type="button" onClick={handleExitSearch} className="text-orange-400/50 hover:text-orange-400 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={searchLoading || !searchQuery.trim()}
                  className="flex items-center gap-1.5 bg-orange-500/20 hover:bg-orange-500/30 disabled:opacity-40 border border-orange-500/30 rounded-xl px-3.5 py-2 text-orange-200 text-[13px] font-mono transition-all"
                >
                  Go
                </button>
              </form>

              {/* Autocomplete dropdown */}
              {showSuggestions && (
                <div className="absolute top-full mt-1.5 right-0 z-50 w-full min-w-[260px] bg-[#130c0c]/95 border border-orange-500/25 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden">
                  {suggestionsLoading && !suggestions.length ? (
                    <div className="flex items-center gap-2 px-4 py-3 text-orange-300/40">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span className="text-xs font-mono">Searching…</span>
                    </div>
                  ) : suggestions.length > 0 ? (
                    <ul>
                      {suggestions.map((s, i) => (
                        <li key={`${s.lat}-${s.lon}`}>
                          {i > 0 && <div className="h-px bg-orange-500/10 mx-3" />}
                          <button
                            type="button"
                            onMouseDown={() => handleSuggestionClick(s)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-orange-500/10 transition-colors group"
                          >
                            <MapPin className="w-3 h-3 text-orange-400/40 group-hover:text-orange-400/70 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] text-heat-100 font-mono truncate">{s.name}</div>
                              {s.state && <div className="text-[10px] text-orange-300/35 font-mono truncate">{s.state} · IN</div>}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-4 py-3 text-xs text-orange-300/30 font-mono">No results found</div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-[#1d1212]/65 border border-orange-500/20 rounded-xl px-3.5 py-2 backdrop-blur-xl">
                <Clock className="w-3.5 h-3.5 text-orange-400/70" />
                <span className="font-mono text-heat-100 text-[13px]">{timeStr}</span>
              </div>
              <div className="flex items-center gap-2 bg-[#1d1212]/65 border border-orange-500/20 rounded-xl px-3.5 py-2 backdrop-blur-xl">
                <MapPin className="w-3.5 h-3.5 text-orange-400/70" />
                <span className="font-mono text-heat-100 text-[11px] uppercase tracking-wider">
                  {userLocation && userLocation.lat !== 0 ? userLocation.name : 'Locating…'}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-orange-500/16 border border-orange-500/30 rounded-xl px-3.5 py-2 backdrop-blur-xl">
                {!userLocWeather && userLocation === null
                  ? <Loader2 className="w-3.5 h-3.5 text-orange-400 animate-spin" />
                  : <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                }
                <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }} className="font-medium text-orange-200 text-xl leading-none">
                  {headerTemp !== null ? `${headerTemp}°C` : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Error banner ── */}
        {(error || searchError) && (
          <div className="flex items-center gap-2 mb-6 px-4 py-3 rounded-xl border border-red-700/40 bg-red-950/30 text-red-300 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {searchError ?? error}
          </div>
        )}

        {/* ── 01 Current Conditions ── */}
        <div className="mono-label mb-4 text-orange-400/70">
          01 — Current Conditions · {displayCity?.name ?? '…'}
          {isPinnedMode && <span className="ml-2 text-orange-300/30">(pinned · click All to resume)</span>}
          {displayCity && <span className="ml-3 capitalize text-orange-300/40">{displayCity.description}</span>}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
          <StatCard icon={Thermometer} label="Temperature" value={String(displayCity?.temperature ?? '—')} unit="°C" sub={`${liveRisk} risk zone`}    accent="#f97316" loading={isSearchMode ? searchLoading : loadingWeather} />
          <StatCard icon={Activity}    label="Feels Like"  value={String(displayCity?.feelsLike    ?? '—')} unit="°C" sub="Heat index adjusted"        accent="#ef4444" loading={isSearchMode ? searchLoading : loadingWeather} />
          <StatCard icon={Droplets}    label="Humidity"    value={String(displayCity?.humidity      ?? '—')} unit="%"  sub="Relative humidity"           accent="#60a5fa" loading={isSearchMode ? searchLoading : loadingWeather} />
          <StatCard icon={Sun}         label="UV Index"    value={String(displayCity?.uvIndex       ?? '—')} unit="/11" sub="Cloud-adjusted estimate"    accent="#fbbf24" loading={isSearchMode ? searchLoading : loadingWeather} />
          <StatCard icon={Wind}        label="Wind Speed"  value={String(displayCity?.windSpeed     ?? '—')} unit="km/h" sub="Surface wind"             accent="#34d399" loading={isSearchMode ? searchLoading : loadingWeather} />
        </div>

        {/* ── 02 Hourly Forecast ── */}
        <div className="mono-label mb-4 text-orange-400/70">
          02 — Hourly Forecast ·{' '}
          {isSearchMode
            ? <span className="inline-flex items-center gap-1"><Search className="w-3 h-3 inline" /> {searchedCity?.name}</span>
            : isPinnedMode
            ? <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3 inline" /> {pinnedCity?.name}</span>
            : userLocation
            ? <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3 inline" /> {userLocation.name}</span>
            : loadingHourly ? 'Locating…' : 'Your Location'
          }
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <PremiumCard className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="section-title flex items-center gap-2 text-heat-50">
                  <TrendingUp className="w-4 h-4 text-orange-400" />
                  Hourly Temperature
                </h2>
                <p className="mono-label mt-1 text-orange-400/60">
                  Next 24h · {isSearchMode ? (searchedCity?.name ?? 'loading…') : (userLocation?.name ?? 'Acquiring location…')}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 mono-label text-orange-400/70">
                  <span className="w-3 h-px bg-orange-400 inline-block" /> Temp
                </span>
                <span className="flex items-center gap-1.5 mono-label text-orange-400/70">
                  <span className="w-3 h-px bg-red-400 inline-block opacity-60" /> Feels
                </span>
              </div>
            </div>

            {displayHourlyLoading ? (
              <div className="flex items-center justify-center h-[210px] gap-2 text-orange-300/40">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Fetching forecast…</span>
              </div>
            ) : displayHourly.length > 0 ? (
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={displayHourly} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(249,115,22,0.16)" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fill: 'rgba(251,146,60,0.55)', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: 'rgba(251,146,60,0.55)', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} unit="°" />
                  <Tooltip content={<CustomTooltip />} />
                  {displayHourly[0]?.hour && <ReferenceLine x={displayHourly[0].hour} stroke="#f97316" strokeDasharray="3 3" strokeOpacity={0.6} />}
                  <Line type="monotone" dataKey="temp"      name="Temperature" stroke="#f97316" strokeWidth={2.3} dot={false} activeDot={{ r: 4, fill: '#f97316', stroke: '#0d0500', strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="feelsLike" name="Feels Like"  stroke="#ef4444" strokeWidth={1.6} strokeDasharray="4 4" dot={false} activeDot={{ r: 3, fill: '#ef4444' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[210px] gap-3 text-orange-300/30 text-sm">
                {locationDenied && !isSearchMode && !isPinnedMode ? (
                  <>
                    <MapPin className="w-6 h-6 text-orange-400/30" />
                    <span className="text-xs text-center text-orange-300/40">Location access denied.<br/>Enable it in your browser to see your local forecast.</span>
                    <button
                      onClick={() => setGeoRetryCount(c => c + 1)}
                      className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 text-orange-300 text-xs font-mono hover:bg-orange-500/20 transition-all"
                    >
                      <MapPin className="w-3 h-3" /> Retry location
                    </button>
                  </>
                ) : (
                  <span>No forecast data available</span>
                )}
              </div>
            )}
          </PremiumCard>

          {/* HeatBadge now receives live risk reason for XAI display */}
          <HeatBadge risk={liveRisk} reason={liveRiskReason} />
        </div>

        {/* ── 03 City Temperature Overview ── */}
        <div className="mono-label mb-4 text-orange-400/70">
          03 — Top 5 Hottest Cities · West Bengal
          <span className="ml-2 text-orange-300/30">({cities.length} tracked · updates every 2h)</span>
        </div>

        <PremiumCard className="p-6">
          <ZoneOverview cities={cities} lastUpdated={overviewLastUpdated} />
        </PremiumCard>

      </div>
    </PremiumBackground>
  );
}