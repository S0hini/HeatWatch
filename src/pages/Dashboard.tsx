import { useState, useEffect } from 'react';
import {
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Activity,
  TrendingUp,
  Clock,
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

import { useZone } from '../contexts/ZoneContext';
import {
  generateHourlyData,
  zones,
  riskConfig,
  type RiskLevel,
} from '../lib/mockData';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  accent?: string;
}

function PremiumBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-[#070608]">
      {/* Background image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat bg-fixed"
        style={{
          backgroundImage: "url('/bg.png')",
        }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 z-[1] bg-[#070608]/35" />

      {/* Page content */}
      <div className="relative z-[2]">
        {children}
      </div>
    </div>
  );
}

function PremiumCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`
        group relative
        rounded-2xl
        border border-orange-500/20
        bg-transparent
        backdrop-blur-md

        transition-all duration-300
        hover:-translate-y-[2px]

        ${className}
      `}
    >
      <div
        className="
          pointer-events-none absolute -inset-[3px]
          rounded-2xl blur-xl
          opacity-0 transition-opacity duration-300
          group-hover:opacity-100
          bg-orange-500/20
          -z-10
        "
      />

      {children}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  sub,
  accent = '#f97316',
}: StatCardProps) {
  return (
    <PremiumCard className="p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-orange-300/70 uppercase tracking-wider">
          {label}
        </span>

        <div
          className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/10"
          style={{ color: accent }}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div
        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        className="text-4xl font-medium text-heat-50 leading-none"
      >
        {value}
        {unit && <span className="text-xl text-orange-400/70 ml-1">{unit}</span>}
      </div>

      {sub && <div className="text-xs text-orange-300/55 mt-2">{sub}</div>}
    </PremiumCard>
  );
}

function HeatBadge({ risk }: { risk: RiskLevel }) {
  const cfg = riskConfig[risk];
  const pulsing = risk === 'Extreme' || risk === 'High';

  return (
  <div
    className="
      group relative rounded-2xl
      transition-all duration-300 ease-out
      hover:-translate-y-[2px]
    "
  >
    {/* OUTSIDE hover glow */}
    <div
      className="
        pointer-events-none absolute -inset-[3px] rounded-2xl
        opacity-0 blur-2xl transition-opacity duration-300
        bg-orange-500/0
        group-hover:opacity-100 group-hover:bg-orange-500/25
      "
    />

    <div
      className="
        relative flex flex-col items-center justify-center p-8 rounded-2xl overflow-hidden
        border border-orange-500/25
        bg-orange-950/38
        backdrop-blur-md
      "
    >
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/18 via-orange-900/10 to-transparent" />

      {pulsing && (
        <div className={`absolute inset-0 ${cfg.bg} animate-pulse-slow rounded-2xl`} />
      )}

      <div className="relative z-10 flex flex-col items-center gap-3">
        <Thermometer className={`w-10 h-10 ${cfg.text}`} />

        <div>
          <div className="text-center text-xs text-orange-300/60 uppercase tracking-wider mb-1">
            Heat Risk Level
          </div>
          <div className={`font-display font-bold text-4xl text-center ${cfg.text}`}>
            {risk}
          </div>
        </div>

        <div className={`flex items-center gap-2 text-xs ${cfg.text}/70`}>
          <span
            className={`w-2 h-2 rounded-full ${cfg.dot} ${
              pulsing ? 'animate-pulse' : ''
            }`}
          />
          {risk === 'Extreme' && 'Seek shelter immediately'}
          {risk === 'High' && 'Limit outdoor exposure'}
          {risk === 'Moderate' && 'Take precautions'}
          {risk === 'Low' && 'Conditions safe'}
        </div>
      </div>
    </div>
  </div>
);
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}) {
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

export default function Dashboard() {
  const [time, setTime] = useState(new Date());

  const { selectedZone: lockedZone, setSelectedZoneIndex } = useZone();

  const initialIndex = zones.findIndex((z) => z.id === lockedZone?.id);

  const [localIndex, setLocalIndex] = useState(
    initialIndex >= 0 ? initialIndex : 0
  );

  const activeZone = zones[localIndex];

  const hourlyData = generateHourlyData(activeZone);
  const currentHour = time.getHours();
  const currentHourData = hourlyData[currentHour];

  const currentHourLabel = currentHourData?.hour;
  const liveTemp = currentHourData?.temp ?? activeZone.temperature;
  const liveFeels = currentHourData?.feelsLike ?? activeZone.feelsLike;

  const overallRisk: RiskLevel =
    liveTemp >= 42
      ? 'Extreme'
      : liveTemp >= 38
      ? 'High'
      : liveTemp >= 34
      ? 'Moderate'
      : 'Low';

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const index = zones.findIndex((z) => z.id === lockedZone?.id);
    if (index >= 0) {
      setLocalIndex(index);
    }
  }, [lockedZone]);

  const timeStr = time.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const dateStr = time.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <PremiumBackground>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <div
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8
          pb-6 border-b border-orange-500/15"
        >
          <div>
            <h1
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              className="font-light text-5xl tracking-tight text-heat-50 leading-none mb-2 flex items-end gap-3"
            >
              <span className="flex items-center gap-2">{activeZone.name}</span>
              <em className="italic text-orange-400/70 text-4xl">UHI Monitor</em>
            </h1>

            <div className="flex flex-wrap gap-1.5 mt-3">
              {zones.map((z, i) => (
                <button
                  key={z.id}
                  onClick={() => {
                    setLocalIndex(i);
                    setSelectedZoneIndex(i);
                  }}
                  className={`font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full
                    border transition-all duration-150 ${
                      localIndex === i
                        ? 'border-orange-400/70 text-orange-200 bg-orange-500/18 shadow-[0_0_30px_rgba(249,115,22,0.12)]'
                        : 'border-orange-500/20 text-orange-300/55 hover:text-orange-200 hover:border-orange-400/45 hover:bg-orange-500/8'
                    }`}
                >
                  {z.name}
                </button>
              ))}
            </div>

            <p className="mono-label mt-3 text-orange-400/70">
              {dateStr.toUpperCase()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-2 bg-[#1d1212]/65 border border-orange-500/20
              rounded-xl px-3.5 py-2 backdrop-blur-xl"
            >
              <Clock className="w-3.5 h-3.5 text-orange-400/70" />
              <span className="font-mono text-heat-100 text-[13px]">
                {timeStr}
              </span>
            </div>

            <div
              className="flex items-center gap-2 bg-orange-500/16 border border-orange-500/30
              rounded-xl px-3.5 py-2 backdrop-blur-xl"
            >
              <Thermometer className="w-3.5 h-3.5 text-orange-400" />
              <span
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                className="font-medium text-orange-200 text-xl leading-none"
              >
                {Math.round(liveTemp)}°C
              </span>
            </div>
          </div>
        </div>

        <div className="mono-label mb-4 text-orange-400/70">
          01 — Current Conditions · {activeZone.name}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
          <StatCard
            icon={Thermometer}
            label="Temperature"
            value={String(Math.round(liveTemp))}
            unit="°C"
            sub={`${overallRisk} risk zone`}
            accent="#f97316"
          />

          <StatCard
            icon={Activity}
            label="Feels Like"
            value={String(Math.round(liveFeels))}
            unit="°C"
            sub="Heat index adjusted"
            accent="#ef4444"
          />

          <StatCard
            icon={Droplets}
            label="Humidity"
            value={String(activeZone.humidity)}
            unit="%"
            sub="Zone moisture level"
            accent="#60a5fa"
          />

          <StatCard
            icon={Sun}
            label="UV Index"
            value={String(
              activeZone.concreteRatio > 70
                ? 9
                : activeZone.greenCover > 25
                ? 6
                : 8
            )}
            unit="/11"
            sub="Surface adjusted"
            accent="#fbbf24"
          />

          <StatCard
            icon={Wind}
            label="Green Cover"
            value={String(activeZone.greenCover)}
            unit="%"
            sub={`Concrete: ${activeZone.concreteRatio}%`}
            accent="#34d399"
          />
        </div>

        <div className="mono-label mb-4 text-orange-400/70">
          02 — Hourly Forecast · {activeZone.name}
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
                  24-hour · {activeZone.name}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 mono-label text-orange-400/70">
                  <span className="w-3 h-px bg-orange-400 inline-block" /> Temp
                </span>
                <span className="flex items-center gap-1.5 mono-label text-orange-400/70">
                  <span className="w-3 h-px bg-red-400 inline-block opacity-60" />{' '}
                  Feels
                </span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={210}>
              <LineChart
                data={hourlyData}
                margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(249,115,22,0.16)"
                  vertical={false}
                />

                <XAxis
                  dataKey="hour"
                  tick={{
                    fill: 'rgba(251,146,60,0.55)',
                    fontSize: 10,
                    fontFamily: 'JetBrains Mono',
                  }}
                  tickLine={false}
                  axisLine={false}
                  interval={3}
                />

                <YAxis
                  tick={{
                    fill: 'rgba(251,146,60,0.55)',
                    fontSize: 10,
                    fontFamily: 'JetBrains Mono',
                  }}
                  tickLine={false}
                  axisLine={false}
                  domain={['dataMin - 2', 'dataMax + 2']}
                  unit="°"
                />

                <Tooltip content={<CustomTooltip />} />

                {currentHourLabel && (
                  <ReferenceLine
                    x={currentHourLabel}
                    stroke="#f97316"
                    strokeDasharray="3 3"
                    strokeOpacity={0.6}
                  />
                )}

                <Line
                  type="monotone"
                  dataKey="temp"
                  name="Temperature"
                  stroke={activeZone.color}
                  strokeWidth={2.3}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: activeZone.color,
                    stroke: '#0d0500',
                    strokeWidth: 2,
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="feelsLike"
                  name="Feels Like"
                  stroke="#ef4444"
                  strokeWidth={1.6}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={{ r: 3, fill: '#ef4444' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </PremiumCard>

          <HeatBadge risk={overallRisk} />
        </div>

        <div className="mono-label mb-4 text-orange-400/70">
          03 — Zone Temperature Overview
        </div>

        <PremiumCard className="p-6">
          <div className="space-y-4">
            {[...zones]
              .sort((a, b) => b.temperature - a.temperature)
              .map((zone, i) => {
                const cfg = riskConfig[zone.risk];
                const pct = ((zone.temperature - 28) / (44 - 28)) * 100;
                const isActive = zone.id === activeZone.id;

                return (
                  <div key={zone.id}>
                    {i > 0 && <div className="h-px bg-orange-500/10 mb-4" />}

                    <div
                      className={`flex items-center gap-4 cursor-pointer rounded-lg px-2 py-1 -mx-2
                        transition-colors duration-150 ${
                          isActive
                            ? 'bg-orange-500/12'
                            : 'hover:bg-orange-500/8'
                        }`}
                      onClick={() => {
                        const idx = zones.findIndex((z) => z.id === zone.id);
                        setLocalIndex(idx);
                        setSelectedZoneIndex(idx);
                      }}
                    >
                      <div className="w-24 shrink-0">
                        <div
                          className={`text-[13px] font-medium transition-colors ${
                            isActive ? 'text-orange-200' : 'text-heat-100'
                          }`}
                        >
                          {zone.name}
                        </div>

                        <div
                          className={`text-[10px] font-mono uppercase tracking-wider mt-0.5 ${cfg.text}`}
                        >
                          {zone.risk}
                        </div>
                      </div>

                      <div className="flex-1 bg-black/30 rounded-full h-1.5 overflow-hidden border border-orange-500/10">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: zone.color,
                          }}
                        />
                      </div>

                      <div
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, serif",
                        }}
                        className="text-2xl font-medium shrink-0 w-16 text-right"
                      >
                        <span style={{ color: zone.color }}>
                          {zone.temperature}°
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </PremiumCard>
      </div>
    </PremiumBackground>
  );
}