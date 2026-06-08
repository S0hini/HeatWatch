import { useState, useEffect } from 'react';
import {
  User, Building2, AlertTriangle, Droplets, Umbrella,
  TreePine, Waves, Wind, Home, MapPin, Clock, Phone,
  Thermometer, Sun, Eye, Flame, CloudRain, Shirt,
  HeartPulse, Baby, Loader2, RefreshCw,
} from 'lucide-react';
import { coolingCenters, riskConfig } from '../lib/mockData';

// ── Types ─────────────────────────────────────────────────────────────────────
type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Extreme';

interface Weather {
  name:        string;
  lat:         number;
  lon:         number;
  temperature: number;
  feelsLike:   number;
  humidity:    number;
  windSpeed:   number;
  uvIndex:     number;
  description: string;
  risk:        RiskLevel;
}

type State =
  | { status: 'locating' }
  | { status: 'fetching'; name: string }
  | { status: 'done';    weather: Weather }
  | { status: 'denied' }
  | { status: 'error';   message: string };

// ── Helpers ───────────────────────────────────────────────────────────────────
const KEY = import.meta.env.VITE_OWM_API_KEY ?? '';

function getRisk(t: number): RiskLevel {
  if (t >= 42) return 'Extreme';
  if (t >= 38) return 'High';
  if (t >= 33) return 'Moderate';
  return 'Low';
}

async function getLocationName(lat: number, lon: number): Promise<string> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=14&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (!r.ok) throw new Error();
    const d = await r.json();
    const a = d?.address ?? {};
    return a.village ?? a.town ?? a.suburb ?? a.city_district ?? a.city ?? 'Your Location';
  } catch {
    return 'Your Location';
  }
}

async function getWeather(lat: number, lon: number, name: string): Promise<Weather> {
  const r = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${KEY}&units=metric`
  );
  if (!r.ok) throw new Error(`Weather API error ${r.status}`);
  const d           = await r.json();
  const temperature = Math.round(d.main.temp);
  const feelsLike   = Math.round(d.main.feels_like);
  const humidity    = d.main.humidity;
  const windSpeed   = Math.round((d.wind?.speed ?? 0) * 3.6);
  const description = d.weather?.[0]?.description ?? '';
  const clouds      = d.clouds?.all ?? 0;
  const uvIndex     = Math.round(Math.max(0, (10 - clouds / 12) * (temperature > 30 ? 1.1 : 0.85)));
  return { name, lat, lon, temperature, feelsLike, humidity, windSpeed, uvIndex, description, risk: getRisk(temperature) };
}

// ── UI primitives ─────────────────────────────────────────────────────────────
interface RecCard { icon: React.ElementType; title: string; body: string; urgency?: 'normal' | 'warning' | 'critical'; }

function Card({ icon: Icon, title, body, urgency = 'normal' }: RecCard) {
  const border = { normal: 'border-surface-700/60 hover:border-heat-600/40', warning: 'border-amber-600/30 bg-amber-500/5 hover:border-amber-500/50', critical: 'border-ember-600/40 bg-ember-600/8 hover:border-ember-500/60' }[urgency];
  const icon   = { normal: 'bg-surface-800 text-heat-400', warning: 'bg-amber-500/15 text-amber-400', critical: 'bg-ember-600/20 text-ember-400' }[urgency];
  return (
    <div className={`glass-card p-5 transition-all duration-200 hover:shadow-heat-sm ${border}`}>
      <div className="flex items-start gap-4">
        <div className={`p-2.5 rounded-xl shrink-0 ${icon}`}><Icon className="w-5 h-5" /></div>
        <div>
          <h4 className="font-semibold text-heat-100 text-sm mb-1.5 leading-tight">{title}</h4>
          <p className="text-xs text-surface-400 leading-relaxed">{body}</p>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, badge, badgeColor }: { icon: React.ElementType; title: string; badge: string; badgeColor: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`p-2.5 rounded-xl ${badgeColor}`}><Icon className="w-5 h-5" /></div>
      <div>
        <h2 className="section-title">{title}</h2>
        <span className="text-xs text-surface-500">{badge}</span>
      </div>
    </div>
  );
}

function StatPill({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-2 bg-surface-800/60 border border-surface-700/50 rounded-xl px-3 py-2">
      <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
      <div>
        <div className="text-[10px] text-surface-500">{label}</div>
        <div className="text-sm font-bold text-heat-100">{value}</div>
      </div>
    </div>
  );
}

// ── Recommendation builders ────────────────────────────────────────────────────
function personalRecs(w: Weather): RecCard[] {
  const { temperature: t, feelsLike: fl, humidity: h, uvIndex: uv, windSpeed: ws, risk } = w;
  const isHigh    = risk === 'High' || risk === 'Extreme';
  const isExtreme = risk === 'Extreme';
  const recs: RecCard[] = [];

  // Hydration
  if (t >= 38 || h >= 75) {
    recs.push({ icon: Droplets, title: 'Aggressive Hydration Needed', body: `At ${t}°C with ${h}% humidity your body loses fluids rapidly. Drink 300–400 ml every 20 minutes and add electrolytes (ORS or coconut water).`, urgency: isExtreme ? 'critical' : 'warning' });
  } else {
    recs.push({ icon: Droplets, title: 'Stay Hydrated', body: `At ${t}°C and ${h}% RH, aim for 250 ml of water every 30 minutes. Avoid alcohol and caffeine.`, urgency: 'normal' });
  }

  // UV
  if (uv >= 8) {
    recs.push({ icon: Sun, title: `Extreme UV (${uv}/11) — Avoid Direct Sun`, body: `UV of ${uv} causes sunburn in under 15 min. Stay indoors 10 AM–4 PM. Use SPF 50+, UV sunglasses, and a wide-brim hat.`, urgency: 'critical' });
  } else if (uv >= 5) {
    recs.push({ icon: Umbrella, title: `High UV (${uv}/11) — Protection Required`, body: `Apply SPF 30+, wear light long-sleeve clothing, and limit exposure 11 AM–3 PM.`, urgency: 'warning' });
  } else {
    recs.push({ icon: Umbrella, title: 'Moderate Sun Exposure OK', body: `UV ${uv} is low risk. SPF 15–30 is fine for brief outdoor activity. Prefer shaded routes for walks.`, urgency: 'normal' });
  }

  // Feels like
  if (fl >= 45) {
    recs.push({ icon: Flame, title: `Feels Like ${fl}°C — Extreme Heat Stress`, body: `Heat index of ${fl}°C is dangerous. Limit outdoor activity to under 10 minutes. Wet your neck and wrists every 15 minutes.`, urgency: 'critical' });
  } else if (fl >= 39) {
    recs.push({ icon: Thermometer, title: `Feels Like ${fl}°C — Dress for the Heat`, body: `Wear loose, light-coloured moisture-wicking fabric. A damp cloth around your neck lowers perceived temperature by 2–3°C.`, urgency: 'warning' });
  } else {
    recs.push({ icon: Shirt, title: 'Comfortable Conditions', body: `Feels like ${fl}°C — manageable with light clothing. Check back as temperatures often peak in the afternoon.`, urgency: 'normal' });
  }

  // Humidity
  if (h >= 80) {
    recs.push({ icon: CloudRain, title: `Very High Humidity (${h}%) — Sweat Won't Cool You`, body: `At ${h}% RH, sweat evaporates poorly. Even light activity can cause rapid overheating. Use AC or a dehumidifier indoors.`, urgency: isHigh ? 'critical' : 'warning' });
  } else if (h >= 65) {
    recs.push({ icon: Droplets, title: `High Humidity (${h}%) — Limit Exertion`, body: `Humidity of ${h}% reduces sweat efficiency. Take 10-minute shade breaks every 30 minutes of outdoor activity.`, urgency: 'warning' });
  }

  // Wind
  if (ws < 5) {
    recs.push({ icon: Wind, title: 'Low Wind — Use Fans Indoors', body: `Wind of ${ws} km/h gives minimal cooling. Cross-ventilate: open windows on opposite walls and place a wet towel in front of a fan.`, urgency: 'normal' });
  } else if (ws >= 20) {
    recs.push({ icon: Wind, title: `Strong Wind (${ws} km/h) — Use It`, body: `Wind of ${ws} km/h meaningfully reduces felt temperature. Position yourself to catch the breeze — but drink extra water as hot wind accelerates dehydration.`, urgency: 'normal' });
  }

  // Heat emergency signs
  recs.push({ icon: HeartPulse, title: 'Recognise Heat Emergency Signs', body: `Watch for: confusion, stopping sweating, rapid/weak pulse, or fainting — heatstroke warning signs. Move to a cool area, apply wet cloths to neck and armpits, and call 108 immediately.`, urgency: isHigh ? 'critical' : 'normal' });

  // Vulnerable people
  if (isHigh) {
    recs.push({ icon: Baby, title: 'Protect Vulnerable Household Members', body: `Children under 5, elderly (65+), and people with heart or kidney conditions are at highest risk at ${t}°C. Never leave children or pets in parked vehicles.`, urgency: 'critical' });
  }

  return recs;
}

function urbanRecs(w: Weather): RecCard[] {
  const { temperature: t, humidity: h, uvIndex: uv, windSpeed: ws, risk } = w;
  const isHigh = risk === 'High' || risk === 'Extreme';
  return [
    { icon: TreePine,   title: 'Prioritise Street-Level Tree Canopy',    body: `At ${t}°C, mature trees with 30%+ shade cover can reduce pavement temperature by 10–15°C. Prioritise native species (neem, peepal, krishnachura) along high-footfall corridors.`, urgency: isHigh ? 'critical' : 'warning' },
    { icon: Waves,      title: 'Deploy Misting Stations at Bus Stops',   body: `Evaporative misting can lower ambient temperature by 3–5°C at ${h}% humidity. Priority: railway stations, markets, and bus termini with high dwell time.`, urgency: 'warning' },
    { icon: Building2,  title: 'Mandate Cool Roofs for New Construction', body: `Reflective roofs reduce building heat gain by 40–70%, cutting indoor temperatures by up to 5°C. Building codes should require a minimum Solar Reflectance Index (SRI) of 78.`, urgency: 'normal' },
    { icon: Droplets,   title: 'Activate Urban Water Features',           body: `Fountains and roadside sprinklers lower surrounding air temperature through latent cooling. At ${t}°C these interventions are immediately impactful within a 30–50 m radius.`, urgency: 'normal' },
    { icon: Wind,       title: 'Design Wind Corridors in Street Grids',  body: `Aligning streets with prevailing south-westerly monsoon winds improves natural ventilation. Current wind of ${ws} km/h can be amplified 2–3× through intentional gaps between building clusters.`, urgency: 'normal' },
    { icon: Eye,        title: `UV (${uv}/11) Demands Shaded Infrastructure`, body: `UV of ${uv} requires shaded walkways, bus shelters, and market aisles covering at least 70% of pedestrian surface area. Cool permeable pavements reduce stored heat further.`, urgency: uv >= 8 ? 'critical' : uv >= 5 ? 'warning' : 'normal' },
  ];
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Recommendations() {
  const [state, setState] = useState<State>({ status: 'locating' });

  const load = () => {
    setState({ status: 'locating' });
    if (!navigator.geolocation) {
      setState({ status: 'error', message: 'Geolocation is not supported by your browser.' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lon } }) => {
        try {
          const name    = await getLocationName(lat, lon);
          setState({ status: 'fetching', name });
          const weather = await getWeather(lat, lon, name);
          setState({ status: 'done', weather });
        } catch (e: any) {
          setState({ status: 'error', message: e.message ?? 'Failed to fetch weather.' });
        }
      },
      (err) => setState(err.code === 1 ? { status: 'denied' } : { status: 'error', message: 'Could not get your location.' }),
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  useEffect(() => { load(); }, []);

  // ── Loading / error UI ─────────────────────────────────────────────────────
  if (state.status !== 'done') {
    return (
      <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-[#070608] flex items-center justify-center">
        <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat bg-fixed" style={{ backgroundImage: "url('/bg.png')" }} />
        <div className="absolute inset-0 z-[1] bg-[#070608]/35" />
        <div className="relative z-[2] text-center space-y-4 px-6 max-w-sm mx-auto">
          {state.status === 'denied' ? (
            <>
              <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/20 rounded-full flex items-center justify-center mx-auto">
                <MapPin className="w-6 h-6 text-orange-400/60" />
              </div>
              <p className="text-heat-100 font-medium">Location Access Denied</p>
              <p className="text-surface-400 text-sm">Enable location access in your browser settings so we can fetch weather for your area.</p>
              <button onClick={load} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-orange-500/30 bg-orange-500/10 text-orange-300 text-sm font-mono hover:bg-orange-500/20 transition-all">
                <RefreshCw className="w-3.5 h-3.5" /> Try Again
              </button>
            </>
          ) : state.status === 'error' ? (
            <>
              <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6 text-red-400/60" />
              </div>
              <p className="text-heat-100 font-medium">Something went wrong</p>
              <p className="text-surface-400 text-sm">{state.message}</p>
              <button onClick={load} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-orange-500/30 bg-orange-500/10 text-orange-300 text-sm font-mono hover:bg-orange-500/20 transition-all">
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </>
          ) : (
            <>
              <Loader2 className="w-10 h-10 text-orange-400/50 animate-spin mx-auto" />
              <p className="text-surface-400 text-sm">
                {state.status === 'locating' ? 'Getting your location…' : `Fetching weather for ${state.name}…`}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  const w        = state.weather;
  const cfg      = riskConfig[w.risk];
  const isHigh   = w.risk === 'High' || w.risk === 'Extreme';
  const pRecs    = personalRecs(w);
  const uRecs    = urbanRecs(w);
  const centers  = coolingCenters.filter(c =>
    c.zone.toLowerCase().includes(w.name.toLowerCase()) ||
    w.name.toLowerCase().includes(c.zone.toLowerCase())
  );
  const centersToShow = centers.length > 0 ? centers : coolingCenters.slice(0, 4);

  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-[#070608]">
      <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat bg-fixed" style={{ backgroundImage: "url('/bg.png')" }} />
      <div className="absolute inset-0 z-[1] bg-[#070608]/35" />
      <div className="relative z-[2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-10">

          {/* ── Banner ── */}
          <div className={`rounded-2xl border p-5 ${cfg.bg} ${cfg.border}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${cfg.bg} border ${cfg.border}`}>
                  <AlertTriangle className={`w-6 h-6 ${cfg.text}`} />
                </div>
                <div>
                  <p className="text-xs text-surface-500 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" /> {w.name}
                  </p>
                  <h1 className={`font-display font-bold text-2xl ${cfg.text}`}>
                    {w.risk} Heat Risk — {w.temperature}°C
                  </h1>
                  <p className="text-xs text-surface-400 mt-0.5 capitalize">{w.description}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3 shrink-0">
                <button onClick={load} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-orange-500/25 bg-orange-500/10 text-orange-300/70 text-xs font-mono hover:bg-orange-500/20 hover:text-orange-200 transition-all">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <StatPill icon={Flame}    label="Feels Like"  value={`${w.feelsLike}°C`}   color="#ef4444" />
                  <StatPill icon={Droplets} label="Humidity"    value={`${w.humidity}%`}      color="#38bdf8" />
                  <StatPill icon={Sun}      label="UV Index"    value={`${w.uvIndex}/11`}     color="#facc15" />
                  <StatPill icon={Wind}     label="Wind"        value={`${w.windSpeed} km/h`} color="#a3e635" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Personal Safety ── */}
          <div>
            <SectionHeader icon={User} title="Personal Safety" badge={`Tailored for ${w.temperature}°C · ${w.humidity}% RH · UV ${w.uvIndex} in ${w.name}`} badgeColor="bg-ember-600/20 text-ember-400" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {pRecs.map((rec, i) => <Card key={i} {...rec} />)}
            </div>
          </div>

          {/* ── Urban Actions ── */}
          <div>
            <SectionHeader icon={Building2} title="Urban & Infrastructure Actions" badge={`Zone-level interventions for ${w.temperature}°C surface conditions`} badgeColor="bg-blue-500/15 text-blue-400" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {uRecs.map((rec, i) => <Card key={i} {...rec} />)}
            </div>
          </div>

          {/* ── Emergency Alerts ── */}
          <div>
            <SectionHeader icon={AlertTriangle} title="Emergency Alerts" badge={isHigh ? `Extreme conditions in ${w.name} — cooling centers active` : `No emergency alert — ${w.risk} risk`} badgeColor="bg-ember-600/20 text-ember-400" />
            {isHigh ? (
              <>
                <div className="bg-ember-600/10 border border-ember-600/30 rounded-2xl p-5 mb-5">
                  <p className="text-sm text-ember-300 font-medium mb-1">Heat Emergency in Effect — {w.name}</p>
                  <p className="text-xs text-surface-400">
                    Temperatures of {w.temperature}°C with {w.humidity}% humidity create {w.risk === 'Extreme' ? 'Extreme Danger' : 'Danger'} conditions. Visit your nearest cooling center immediately if you feel unwell, dizzy, or stop sweating.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {centersToShow.map(center => (
                    <div key={center.name} className="glass-card-hover p-5">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-ember-600/15 rounded-xl text-ember-400 shrink-0"><MapPin className="w-4 h-4" /></div>
                        <div>
                          <h4 className="font-semibold text-heat-100 text-sm mb-1">{center.name}</h4>
                          <p className="text-xs text-surface-400 mb-2">{center.address} · {center.zone}</p>
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1.5 text-xs text-emerald-400"><Clock className="w-3 h-3" />{center.open}</span>
                            <span className="flex items-center gap-1.5 text-xs text-amber-400"><Phone className="w-3 h-3" />Call 108</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="glass-card p-8 text-center">
                <div className="w-12 h-12 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-heat-200 font-medium mb-1">No Active Alerts for {w.name}</p>
                <p className="text-surface-500 text-sm">{w.name} is at {w.risk} risk with {w.temperature}°C. Continue monitoring conditions throughout the day.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}