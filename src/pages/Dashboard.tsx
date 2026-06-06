import { useState, useEffect } from 'react';
import {
  Thermometer, Droplets, Wind, Sun, Activity,
  TrendingUp, Clock, AlertTriangle
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { currentConditions, hourlyData, zones, riskConfig, type RiskLevel } from '../lib/mockData';

const now = new Date();

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}

function StatCard({ icon: Icon, label, value, sub, color = 'text-heat-400' }: StatCardProps) {
  return (
    <div className="glass-card-hover p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-surface-500 uppercase tracking-wider">{label}</span>
        <div className={`p-2 rounded-lg bg-surface-800 ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="stat-value">{value}</div>
      {sub && <div className="text-xs text-surface-500 mt-1">{sub}</div>}
    </div>
  );
}

function HeatBadge({ risk }: { risk: RiskLevel }) {
  const cfg = riskConfig[risk];
  const pulsing = risk === 'Extreme' || risk === 'High';

  return (
    <div className={`relative flex flex-col items-center justify-center p-8 rounded-2xl border ${cfg.bg} ${cfg.border} overflow-hidden`}>
      {pulsing && (
        <div className={`absolute inset-0 ${cfg.bg} animate-pulse-slow rounded-2xl`} />
      )}
      <div className={`relative z-10 flex flex-col items-center gap-3`}>
        <AlertTriangle className={`w-10 h-10 ${cfg.text}`} />
        <div>
          <div className="text-center text-xs text-surface-500 uppercase tracking-wider mb-1">Heat Risk Level</div>
          <div className={`font-display font-bold text-4xl text-center ${cfg.text}`}>{risk}</div>
        </div>
        <div className={`flex items-center gap-2 text-xs ${cfg.text}/70`}>
          <span className={`w-2 h-2 rounded-full ${cfg.dot} ${pulsing ? 'animate-pulse' : ''}`} />
          {risk === 'Extreme' && 'Seek shelter immediately'}
          {risk === 'High' && 'Limit outdoor exposure'}
          {risk === 'Moderate' && 'Take precautions'}
          {risk === 'Low' && 'Conditions safe'}
        </div>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: {value: number; name: string}[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 shadow-card">
      <p className="text-xs text-surface-400 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-heat-200">{p.value}°C</span>
          <span className="text-surface-500 text-xs">{p.name}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [time, setTime] = useState(now);
  const currentHour = now.getHours();
  const currentHourLabel = hourlyData[currentHour]?.hour;

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const overallRisk: RiskLevel =
    currentConditions.temperature >= 42 ? 'Extreme' :
    currentConditions.temperature >= 38 ? 'High' :
    currentConditions.temperature >= 34 ? 'Moderate' : 'Low';

  const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl text-heat-50 mb-1">
            {currentConditions.city}
          </h1>
          <p className="text-surface-400 text-sm">{dateStr}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-surface-800 border border-surface-700 rounded-xl px-4 py-2.5">
            <Clock className="w-4 h-4 text-heat-500" />
            <span className="font-mono text-heat-200 text-sm font-medium">{timeStr}</span>
          </div>
          <div className="flex items-center gap-2 bg-heat-600/20 border border-heat-600/30 rounded-xl px-4 py-2.5">
            <Thermometer className="w-4 h-4 text-heat-400" />
            <span className="font-display font-bold text-heat-300">{currentConditions.temperature}°C</span>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          icon={Thermometer}
          label="Temperature"
          value={`${currentConditions.temperature}°C`}
          sub="Above 35°C threshold"
          color="text-heat-400"
        />
        <StatCard
          icon={Activity}
          label="Feels Like"
          value={`${currentConditions.feelsLike}°C`}
          sub="Heat index adjusted"
          color="text-ember-400"
        />
        <StatCard
          icon={Droplets}
          label="Humidity"
          value={`${currentConditions.humidity}%`}
          sub="High moisture level"
          color="text-blue-400"
        />
        <StatCard
          icon={Sun}
          label="UV Index"
          value={String(currentConditions.uvIndex)}
          sub="Very High — protect skin"
          color="text-amber-400"
        />
        <StatCard
          icon={Wind}
          label="Wind Speed"
          value={`${currentConditions.windSpeed} km/h`}
          sub="Light breeze"
          color="text-teal-400"
        />
      </div>

      {/* Chart + Heat badge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="section-title flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-heat-500" />
                Hourly Temperature
              </h2>
              <p className="text-xs text-surface-500 mt-1">24-hour forecast for Kolkata</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-surface-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-heat-500 inline-block rounded" /> Temperature
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-ember-400 inline-block rounded border-dashed" /> Feels Like
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={hourlyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d1600" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval={3}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 11 }}
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
                stroke="#f97316"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#f97316', stroke: '#0d0500', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="feelsLike"
                name="Feels Like"
                stroke="#ef4444"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                activeDot={{ r: 4, fill: '#ef4444' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <HeatBadge risk={overallRisk} />
      </div>

      {/* Zone temperature strip */}
      <div className="glass-card p-6">
        <h2 className="section-title mb-5 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          Zone Temperature Overview
        </h2>
        <div className="space-y-3">
          {zones.sort((a, b) => b.temperature - a.temperature).map((zone) => {
            const cfg = riskConfig[zone.risk];
            const pct = ((zone.temperature - 28) / (44 - 28)) * 100;
            return (
              <div key={zone.id} className="flex items-center gap-4">
                <div className="w-28 text-sm font-medium text-heat-200 shrink-0">{zone.name}</div>
                <div className="flex-1 bg-surface-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: zone.color }}
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-semibold text-heat-200 w-12 text-right">{zone.temperature}°C</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.text} w-20 text-center`}>
                    {zone.risk}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
