import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import {
  BarChart2, TrendingUp, ThermometerSun, Info, Search, MapPin, X,
  Wind, Droplets, Eye, Thermometer, Sun, Flame, Plus,
} from 'lucide-react';
import {
  historicalData,
  heatIndexTable,
} from '../lib/mockData';

// ─── OWM ─────────────────────────────────────────────────────────────────────
const OWM_KEY = import.meta.env.VITE_OWM_API_KEY ?? '';

// ─── Types ────────────────────────────────────────────────────────────────────
interface CityWeather {
  uid: string;        // lat,lon key — stable identity
  name: string;
  country: string;
  lat: number;
  lon: number;
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  visibility: number;
  color: string;
}

interface GeoResult {
  uid: string;
  name: string;
  localName?: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}

// ─── Metrics ─────────────────────────────────────────────────────────────────
type MetricKey = 'temp' | 'feelsLike' | 'humidity' | 'windSpeed' | 'uvIndex' | 'visibility';

const METRICS = [
  { key: 'temp'       as MetricKey, label: 'Temperature', unit: '°C',   icon: Thermometer, color: '#f97316', domain: [20, 45] as [number,number] },
  { key: 'feelsLike'  as MetricKey, label: 'Feels Like',  unit: '°C',   icon: Flame,        color: '#ef4444', domain: [20, 48] as [number,number] },
  { key: 'humidity'   as MetricKey, label: 'Humidity',    unit: '%',    icon: Droplets,     color: '#38bdf8', domain: [0,  100] as [number,number] },
  { key: 'windSpeed'  as MetricKey, label: 'Wind Speed',  unit: ' m/s', icon: Wind,         color: '#a3e635', domain: [0,  20]  as [number,number] },
  { key: 'uvIndex'    as MetricKey, label: 'UV Index',    unit: '',     icon: Sun,          color: '#facc15', domain: [0,  12]  as [number,number] },
  { key: 'visibility' as MetricKey, label: 'Visibility',  unit: ' km',  icon: Eye,          color: '#c084fc', domain: [0,  20]  as [number,number] },
];

const CITY_COLORS = ['#f97316','#38bdf8','#a3e635','#f472b6','#facc15','#c084fc'];

// ─── OWM API helpers ──────────────────────────────────────────────────────────
async function geocodeSearch(query: string): Promise<GeoResult[]> {
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query.trim())}&limit=8&appid=${OWM_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geo ${res.status}`);
  const data: any[] = await res.json();
  // Deduplicate by rounding lat/lon to 2dp
  const seen = new Set<string>();
  return data.reduce<GeoResult[]>((acc, d) => {
    const key = `${d.lat.toFixed(2)},${d.lon.toFixed(2)}`;
    if (seen.has(key)) return acc;
    seen.add(key);
    acc.push({
      uid:       `${d.lat.toFixed(4)},${d.lon.toFixed(4)}`,
      name:      d.name,
      localName: d.local_names?.en ?? d.local_names?.hi ?? undefined,
      country:   d.country,
      state:     d.state,
      lat:       d.lat,
      lon:       d.lon,
    });
    return acc;
  }, []);
}

async function fetchWeather(geo: GeoResult, color: string): Promise<CityWeather> {
  const [wRes, uvRes] = await Promise.all([
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${geo.lat}&lon=${geo.lon}&appid=${OWM_KEY}&units=metric`),
    fetch(`https://api.openweathermap.org/data/2.5/uvi?lat=${geo.lat}&lon=${geo.lon}&appid=${OWM_KEY}`),
  ]);
  if (!wRes.ok) throw new Error(`Weather ${wRes.status}`);
  const w  = await wRes.json();
  const uv = uvRes.ok ? await uvRes.json() : { value: 0 };

  return {
    uid:        geo.uid,
    name:       geo.name,
    country:    geo.country,
    lat:        geo.lat,
    lon:        geo.lon,
    temp:       Math.round(w.main.temp),
    feelsLike:  Math.round(w.main.feels_like),
    humidity:   w.main.humidity,
    windSpeed:  Math.round(w.wind.speed * 10) / 10,
    uvIndex:    Math.round((uv.value ?? 0) * 10) / 10,
    visibility: Math.round((w.visibility ?? 10000) / 100) / 10,
    color,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function CityPill({ city, onRemove }: { city: CityWeather; onRemove: () => void }) {
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium whitespace-nowrap select-none"
      style={{ borderColor: city.color + '55', backgroundColor: city.color + '14' }}
    >
      <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: city.color }} />
      <span className="font-bold tracking-wide text-xs" style={{ color: city.color }}>
        {city.name.toUpperCase()}
      </span>
      <span className="font-semibold text-xs" style={{ color: city.color + 'cc' }}>
        {city.temp}°C
      </span>
      <button
        onPointerDown={e => { e.stopPropagation(); onRemove(); }}
        className="ml-0.5 p-0.5 rounded-full hover:bg-white/10 transition-colors"
      >
        <X className="w-3 h-3" style={{ color: city.color + 'aa' }} />
      </button>
    </div>
  );
}

function BarTooltip({ active, payload, label, metricKey }: any) {
  if (!active || !payload?.length) return null;
  const m = METRICS.find(m => m.key === metricKey)!;
  return (
    <div className="bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-sm shadow-xl">
      <p className="font-semibold text-heat-100 mb-1">{label}</p>
      <p style={{ color: m.color }}>{payload[0].value}{m.unit} — {m.label}</p>
    </div>
  );
}

function HistTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-sm shadow-xl">
      <p className="text-surface-400 text-xs mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-heat-200">
          <span className="font-semibold">{p.value}</span>
          {p.name === 'avgTemp' ? '°C avg' : '°C UHI intensity'}
        </p>
      ))}
    </div>
  );
}

function HeatIndexBadge({ level }: { level: string }) {
  const cls: Record<string, string> = {
    Caution:           'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    'Extreme Caution': 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    Danger:            'text-red-400 bg-red-600/10 border-red-600/30',
    'Extreme Danger':  'text-red-300 bg-red-700/20 border-red-700/40 font-bold',
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-lg border ${cls[level] ?? 'text-surface-400'}`}>
      {level}
    </span>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Analysis() {
  const [cities,       setCities]      = useState<CityWeather[]>([]);
  const [loadingUid,   setLoadingUid]  = useState<string | null>(null);
  const [metric,       setMetric]      = useState<MetricKey>('temp');
  const [error,        setError]       = useState<string | null>(null);

  // Search
  const [query,        setQuery]       = useState('');
  const [results,      setResults]     = useState<GeoResult[]>([]);
  const [searching,    setSearching]   = useState(false);
  const [dropOpen,     setDropOpen]    = useState(false);
  const [activeIdx,    setActiveIdx]   = useState(-1); // keyboard nav

  const inputRef   = useRef<HTMLInputElement>(null);
  const dropRef    = useRef<HTMLDivElement>(null);
  const debRef     = useRef<ReturnType<typeof setTimeout>>();
  // track mousedown inside dropdown so blur doesn't close it first
  const mouseInDrop = useRef(false);

  // ── Debounced geocode ──
  useEffect(() => {
    clearTimeout(debRef.current);
    setError(null);
    if (query.trim().length < 2) {
      setResults([]);
      setDropOpen(false);
      setActiveIdx(-1);
      return;
    }
    debRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await geocodeSearch(query);
        setResults(r);
        setDropOpen(r.length > 0);
        setActiveIdx(-1);
        if (r.length === 0) setError('No cities found — try a different spelling');
      } catch {
        setError('Search failed — check your API key');
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [query]);

  // ── Add city ──
  // Use a ref snapshot of cities so we never capture stale closure
  const citiesRef = useRef(cities);
  useEffect(() => { citiesRef.current = cities; }, [cities]);

  async function addCity(geo: GeoResult) {
    const cur = citiesRef.current;
    if (cur.length >= 6) return;
    if (cur.some(c => c.uid === geo.uid)) return;

    setDropOpen(false);
    setQuery('');
    setResults([]);
    setActiveIdx(-1);
    setError(null);

    const color = CITY_COLORS[cur.length % CITY_COLORS.length];
    setLoadingUid(geo.uid);
    try {
      const city = await fetchWeather(geo, color);
      setCities(prev => [...prev, city]);
    } catch (e: any) {
      setError(`Failed to fetch weather for ${geo.name}`);
    } finally {
      setLoadingUid(null);
    }
  }

  function removeCity(uid: string) {
    setCities(prev => {
      const next = prev.filter(c => c.uid !== uid);
      return next.map((c, i) => ({ ...c, color: CITY_COLORS[i] }));
    });
  }

  // ── Keyboard navigation ──
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!dropOpen || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      addCity(results[activeIdx]);
    } else if (e.key === 'Escape') {
      setDropOpen(false);
    }
  }

  // ── Chart data ──
  const activeMetric = METRICS.find(m => m.key === metric)!;

  const barData = useMemo(() => cities.map(c => ({
    name:  c.name,
    value: c[metric],
    color: c.color,
  })), [cities, metric]);

  const radarData = useMemo(() => {
    if (cities.length < 2) return [];
    return METRICS.map(m => {
      const [lo, hi] = m.domain;
      const entry: Record<string, any> = { axis: m.label };
      cities.forEach(c => {
        entry[c.name] = Math.max(0, Math.min(100, Math.round(((c[m.key] - lo) / (hi - lo)) * 100)));
      });
      return entry;
    });
  }, [cities]);

  const Icon = activeMetric.icon;

  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-[#070608]">
      <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat bg-fixed" style={{ backgroundImage: "url('/bg.png')" }} />
      <div className="absolute inset-0 z-[1] bg-[#070608]/35" />

      <div className="relative z-[2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

          {/* Header */}
          <div>
            <h1 className="font-display font-bold text-3xl text-heat-50 mb-1 flex items-center gap-3">
              <BarChart2 className="w-7 h-7 text-heat-500" />
              Heat Analysis
            </h1>
            <p className="text-surface-400 text-sm">
              Search and compare up to 6 cities · live weather data
            </p>
          </div>

          {/* ── Search card ── */}
          <div className="glass-card p-5 space-y-4">

            {/* Input row */}
            <div className="relative">
              <div className={`flex items-center gap-2 border rounded-xl px-3 py-2.5 transition-colors ${
                dropOpen ? 'border-orange-500/60 bg-surface-800' : 'border-surface-700 bg-surface-800/70'
              }`}>
                <Search className="w-4 h-4 text-surface-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  disabled={cities.length >= 6}
                  placeholder={cities.length >= 6 ? 'Max 6 cities — remove one to add another' : 'Search for a city…'}
                  onChange={e => setQuery(e.target.value)}
                  onFocus={() => results.length > 0 && setDropOpen(true)}
                  onBlur={() => {
                    // only close if mouse is NOT inside dropdown
                    if (!mouseInDrop.current) setDropOpen(false);
                  }}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent text-sm text-heat-100 placeholder-surface-500 outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                />
                {searching && (
                  <span className="w-3.5 h-3.5 border-2 border-orange-400/40 border-t-orange-400 rounded-full animate-spin flex-shrink-0" />
                )}
                {loadingUid && !searching && (
                  <span className="w-3.5 h-3.5 border-2 border-sky-400/40 border-t-sky-400 rounded-full animate-spin flex-shrink-0" />
                )}
                {query && (
                  <button
                    onPointerDown={e => { e.preventDefault(); setQuery(''); setDropOpen(false); inputRef.current?.focus(); }}
                    className="p-0.5 rounded hover:bg-white/10"
                  >
                    <X className="w-3.5 h-3.5 text-surface-500" />
                  </button>
                )}
              </div>

              {/* ── Dropdown ── */}
              {dropOpen && results.length > 0 && (
                <div
                  ref={dropRef}
                  onMouseEnter={() => { mouseInDrop.current = true; }}
                  onMouseLeave={() => { mouseInDrop.current = false; }}
                  className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl border border-surface-700 bg-[#12100e] shadow-2xl overflow-hidden"
                >
                  {results.map((r, i) => {
                    const already = cities.some(c => c.uid === r.uid);
                    const isActive = i === activeIdx;
                    return (
                      <button
                        key={r.uid}
                        // use onPointerDown so it fires before onBlur on input
                        onPointerDown={e => {
                          e.preventDefault(); // prevent input blur
                          if (!already) addCity(r);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                          isActive ? 'bg-orange-500/10' : 'hover:bg-surface-800'
                        } ${already ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <MapPin className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-heat-100">{r.name}</span>
                          {r.localName && r.localName !== r.name && (
                            <span className="text-xs text-surface-400 ml-1.5">({r.localName})</span>
                          )}
                          {r.state && (
                            <span className="text-xs text-surface-500 ml-1.5">{r.state}</span>
                          )}
                        </div>
                        <span className="text-xs text-surface-400 font-medium flex-shrink-0">{r.country}</span>
                        {already ? (
                          <span className="text-[10px] text-orange-400 font-medium">Added</span>
                        ) : (
                          <Plus className="w-3.5 h-3.5 text-surface-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Error */}
            {error && !dropOpen && (
              <p className="text-xs text-red-400/80">{error}</p>
            )}

            {/* City pills */}
            {cities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {cities.map(city => (
                  <CityPill key={city.uid} city={city} onRemove={() => removeCity(city.uid)} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-surface-600 italic">
                {loadingUid ? 'Fetching weather data…' : 'No cities yet — search above to add up to 6.'}
              </p>
            )}
          </div>

          {/* ── Metric tabs ── */}
          <div className="flex flex-wrap gap-2">
            {METRICS.map(m => {
              const MIcon = m.icon;
              const active = metric === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setMetric(m.key)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all"
                  style={active
                    ? { backgroundColor: m.color + '1e', borderColor: m.color + '66', color: m.color }
                    : { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.07)', color: '#6b7280' }
                  }
                >
                  <MIcon className="w-3.5 h-3.5" />
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* ── Bar chart ── */}
          {cities.length > 0 && (
            <div className="glass-card p-6">
              <div className="mb-5">
                <h2 className="section-title mb-1 flex items-center gap-2">
                  <Icon className="w-4 h-4" style={{ color: activeMetric.color }} />
                  {activeMetric.label} Comparison
                </h2>
                <p className="text-xs text-surface-500">Current {activeMetric.label.toLowerCase()} across selected cities</p>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d1600" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false}
                    domain={activeMetric.domain}
                    unit={activeMetric.unit.trim() || undefined}
                  />
                  <Tooltip content={(p: any) => <BarTooltip {...p} metricKey={metric} />} cursor={{ fill: 'rgba(249,115,22,0.05)' }} />
                  <Bar dataKey="value" radius={[6,6,0,0]}>
                    {barData.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.85} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── Radar ── */}
          {cities.length >= 2 && (
            <div className="glass-card p-6">
              <div className="mb-5">
                <h2 className="section-title mb-1">Multi-Metric Radar</h2>
                <p className="text-xs text-surface-500">All 6 metrics normalised — larger area = more intense conditions overall</p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="#2d1600" />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0,100]} tick={{ fill: '#6b7280', fontSize: 9 }} />
                  {cities.map(c => (
                    <Radar key={c.uid} name={c.name} dataKey={c.name}
                      stroke={c.color} fill={c.color} fillOpacity={0.12} strokeWidth={2} />
                  ))}
                  <Legend formatter={v => <span className="text-xs text-surface-300">{v}</span>} />
                  <Tooltip contentStyle={{ background:'#1a1410', border:'1px solid #3d2000', borderRadius:'12px', fontSize:12 }} labelStyle={{ color:'#f97316' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── City detail cards ── */}
          {cities.length > 0 && (
            <div>
              <h2 className="section-title mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-amber-400" />
                City Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {cities.map((city, idx) => (
                  <div key={city.uid} className="glass-card-hover p-5 relative">
                    <button
                      onPointerDown={() => removeCity(city.uid)}
                      className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10 transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-surface-500" />
                    </button>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: city.color }} />
                      <span className="font-display font-semibold text-heat-100">{city.name}</span>
                      <span className="text-xs text-surface-500">{city.country}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {METRICS.map(m => {
                        const isActive = metric === m.key;
                        const MIcon = m.icon;
                        return (
                          <button
                            key={m.key}
                            onClick={() => setMetric(m.key)}
                            className="text-center rounded-lg p-2 transition-all"
                            style={{
                              backgroundColor: isActive ? city.color + '18' : 'rgba(255,255,255,0.04)',
                              borderWidth: 1, borderStyle: 'solid',
                              borderColor: isActive ? city.color + '55' : 'transparent',
                            }}
                          >
                            <div className="font-bold text-sm" style={{ color: isActive ? city.color : '#d1b899' }}>
                              {city[m.key]}{m.unit}
                            </div>
                            <div className="text-[9px] text-surface-500 mt-0.5">{m.label}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {cities.length === 0 && !loadingUid && (
            <div className="glass-card p-12 flex flex-col items-center gap-3 text-center">
              <Search className="w-10 h-10 text-surface-700" />
              <p className="text-surface-400 text-sm">Search for cities above to start comparing</p>
              <p className="text-surface-600 text-xs">Up to 6 cities · Live data via OpenWeatherMap</p>
            </div>
          )}
          {cities.length === 0 && loadingUid && (
            <div className="glass-card p-12 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-orange-400/30 border-t-orange-400 rounded-full animate-spin" />
              <p className="text-surface-400 text-sm">Fetching weather…</p>
            </div>
          )}

          {/* ── Historical trend ── */}
          <div className="glass-card p-6">
            <div className="mb-6">
              <h2 className="section-title flex items-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-heat-500" />
                Historical Temperature Trend
              </h2>
              <p className="text-xs text-surface-500">Kolkata average temperatures and UHI intensity 2000–2026</p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={historicalData} margin={{ top:5, right:10, left:-10, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d1600" vertical={false} />
                <XAxis dataKey="year" tick={{ fill:'#9ca3af', fontSize:11 }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="temp" tick={{ fill:'#6b7280', fontSize:11 }} tickLine={false} axisLine={false} domain={[28,37]} unit="°C" />
                <YAxis yAxisId="uhi" orientation="right" tick={{ fill:'#6b7280', fontSize:11 }} tickLine={false} axisLine={false} domain={[0,8]} unit="°C" />
                <Tooltip content={<HistTooltip />} />
                <Legend formatter={v => <span className="text-xs text-surface-400">{v === 'avgTemp' ? 'Avg Temperature' : 'UHI Intensity'}</span>} />
                <Line yAxisId="temp" type="monotone" dataKey="avgTemp" stroke="#f97316" strokeWidth={2.5} dot={{ r:3, fill:'#f97316' }} />
                <Line yAxisId="uhi"  type="monotone" dataKey="uhiIntensity" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 3" dot={{ r:3, fill:'#ef4444' }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 p-4 bg-ember-600/8 border border-ember-600/20 rounded-xl">
              <p className="text-xs text-ember-300 leading-relaxed">
                <span className="font-semibold">Trend alert:</span> Kolkata's average temperature has risen by ~6.2°C over 26 years, with UHI intensity growing from 1.8°C to 6.4°C — driven by rapid urbanisation, reduced green cover, and increased impervious surfaces.
              </p>
            </div>
          </div>

          {/* ── Heat Index Table ── */}
          <div className="glass-card p-6">
            <div className="mb-5">
              <h2 className="section-title flex items-center gap-2 mb-1">
                <ThermometerSun className="w-5 h-5 text-amber-400" />
                Heat Index Reference Table
              </h2>
              <p className="text-xs text-surface-500">Combined effect of temperature and humidity on perceived danger</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-700">
                    <th className="text-left text-xs text-surface-400 font-medium pb-3 pr-4">Temp</th>
                    {['30% RH','50% RH','70% RH','90% RH'].map(h => (
                      <th key={h} className="text-center text-xs text-surface-400 font-medium pb-3 px-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatIndexTable.map((row, i) => (
                    <tr key={i} className="border-b border-surface-800/50">
                      <td className="py-3 pr-4 font-display font-bold text-heat-300">{row.temp}°C</td>
                      <td className="py-3 px-2 text-center"><HeatIndexBadge level={row.humidity30} /></td>
                      <td className="py-3 px-2 text-center"><HeatIndexBadge level={row.humidity50} /></td>
                      <td className="py-3 px-2 text-center"><HeatIndexBadge level={row.humidity70} /></td>
                      <td className="py-3 px-2 text-center"><HeatIndexBadge level={row.humidity90} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {cities.length > 0 && (() => {
              const hot = [...cities].sort((a,b) => b.temp - a.temp)[0];
              const lvl = hot.temp >= 54 ? 'Extreme Danger' : hot.temp >= 41 ? 'Danger' : hot.temp >= 32 ? 'Extreme Caution' : 'Caution';
              return (
                <p className="text-xs text-surface-500 mt-3">
                  Hottest city: <span className="text-heat-300 font-medium">{hot.name}</span> — {hot.temp}°C at {hot.humidity}% RH —{' '}
                  <span className="text-red-400 font-medium">{lvl} level</span>
                </p>
              );
            })()}
          </div>

        </div>
      </div>
    </div>
  );
}