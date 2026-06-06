import { useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell,
} from 'recharts';
import { BarChart2, TrendingUp, ThermometerSun, Info } from 'lucide-react';
import {
  zones,
  historicalData,
  heatIndexTable,
  riskConfig,
  generateHourlyData,
} from '../lib/mockData';

function CustomBarTooltip({ active, payload, label }: { active?: boolean; payload?: {value: number; name: string}[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const zone = zones.find((z) => z.name === label);
  return (
    <div className="bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 shadow-card text-sm">
      <p className="font-semibold text-heat-100 mb-2">{label}</p>
      <p className="text-heat-400">{payload[0].value}°C surface temperature</p>
      {zone && (
        <p className="text-surface-400 text-xs mt-1">{zone.surface} · {zone.risk} risk</p>
      )}
    </div>
  );
}

function CustomHistTooltip({ active, payload, label }: { active?: boolean; payload?: {value: number; name: string}[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 shadow-card text-sm">
      <p className="text-surface-400 text-xs mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-heat-200">
          <span className="font-semibold">{p.value}</span>
          {p.name === 'avgTemp' ? '°C avg' : '°C UHI intensity'}
        </p>
      ))}
    </div>
  );
}

function HeatIndexBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    Caution: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    'Extreme Caution': 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    Danger: 'text-red-400 bg-red-600/10 border-red-600/30',
    'Extreme Danger': 'text-red-300 bg-red-700/20 border-red-700/40 font-bold',
  };

  return (
    <span className={`text-xs px-2 py-1 rounded-lg border ${colors[level] ?? 'text-surface-400'}`}>
      {level}
    </span>
  );
}

export default function Analysis() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date());
    }, 60 * 1000);

    return () => clearInterval(id);
  }, []);

  const currentHour = time.getHours();

  const zoneBarData = useMemo(() => {
    return zones.map((zone) => {
      const hourly = generateHourlyData(zone);
      const current = hourly[currentHour];

      return {
        name: zone.name,
        temp: current?.temp ?? zone.temperature,
        color: zone.color,
      };
    });
  }, [currentHour]);

  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-[#070608]">
      {/* Background image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat bg-fixed"
        style={{ backgroundImage: "url('/bg.png')" }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 z-[1] bg-[#070608]/35" />
      {/* Page content */}
      <div className="relative z-[2]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-3xl text-heat-50 mb-1 flex items-center gap-3">
          <BarChart2 className="w-7 h-7 text-heat-500" />
          Heat Analysis
        </h1>
        <p className="text-surface-400 text-sm">
          Comparative zone data, historical trends, and heat index reference
        </p>
      </div>

      {/* Zone comparison bar chart */}
      <div className="glass-card p-6">
        <div className="mb-6">
          <h2 className="section-title mb-1">Zone Temperature Comparison</h2>
          <p className="text-xs text-surface-500">
            Hourly surface temperatures across all 6 monitored zones
          </p>
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={zoneBarData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d1600" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              domain={[28, 45]}
              unit="°"
            />
            <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(249,115,22,0.05)' }} />
            <Bar dataKey="temp" radius={[6, 6, 0, 0]}>
              {zoneBarData.map((entry, index) => (
                <Cell key={index} fill={entry.color} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Zone explanations */}
      <div>
        <h2 className="section-title mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-amber-400" />
          Why Is Each Zone Hot?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...zones].sort((a, b) => b.temperature - a.temperature).map((zone) => {
            const cfg = riskConfig[zone.risk];

            return (
              <div key={zone.id} className="glass-card-hover p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: zone.color }}
                    />
                    <span className="font-display font-semibold text-heat-100">
                      {zone.name}
                    </span>
                  </div>

                  <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                    {zone.risk}
                  </span>
                </div>

                {/* Mini metrics */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center bg-surface-800 rounded-lg p-2">
                    <div className="font-bold text-base" style={{ color: zone.color }}>
                      {zone.temperature}°
                    </div>
                    <div className="text-[10px] text-surface-500">Temp</div>
                  </div>

                  <div className="text-center bg-surface-800 rounded-lg p-2">
                    <div className="font-bold text-base text-stone-400">
                      {zone.concreteRatio}%
                    </div>
                    <div className="text-[10px] text-surface-500">Concrete</div>
                  </div>

                  <div className="text-center bg-surface-800 rounded-lg p-2">
                    <div className="font-bold text-base text-emerald-400">
                      {zone.greenCover}%
                    </div>
                    <div className="text-[10px] text-surface-500">Green</div>
                  </div>
                </div>

                <p className="text-xs text-surface-400 leading-relaxed line-clamp-4">
                  {zone.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historical trend */}
      <div className="glass-card p-6">
        <div className="mb-6">
          <h2 className="section-title flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-heat-500" />
            Historical Temperature Trend
          </h2>
          <p className="text-xs text-surface-500">
            Kolkata average temperatures and UHI intensity from 2000–2026 (simulated projection)
          </p>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={historicalData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d1600" vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="temp"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              domain={[28, 37]}
              unit="°C"
            />
            <YAxis
              yAxisId="uhi"
              orientation="right"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              domain={[0, 8]}
              unit="°C"
            />
            <Tooltip content={<CustomHistTooltip />} />
            <Legend
              formatter={(value) => (
                <span className="text-xs text-surface-400">
                  {value === 'avgTemp' ? 'Avg Temperature' : 'UHI Intensity'}
                </span>
              )}
            />
            <Line
              yAxisId="temp"
              type="monotone"
              dataKey="avgTemp"
              stroke="#f97316"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#f97316' }}
            />
            <Line
              yAxisId="uhi"
              type="monotone"
              dataKey="uhiIntensity"
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={{ r: 3, fill: '#ef4444' }}
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-4 p-4 bg-ember-600/8 border border-ember-600/20 rounded-xl">
          <p className="text-xs text-ember-300 leading-relaxed">
            <span className="font-semibold">Trend alert:</span> Kolkata's average temperature has risen by ~6.2°C over 26 years, with UHI intensity growing from 1.8°C to 6.4°C — driven by rapid urbanization, reduced green cover, and increased impervious surfaces.
          </p>
        </div>
      </div>

      {/* Heat Index Table */}
      <div className="glass-card p-6">
        <div className="mb-5">
          <h2 className="section-title flex items-center gap-2 mb-1">
            <ThermometerSun className="w-5 h-5 text-amber-400" />
            Heat Index Reference Table
          </h2>
          <p className="text-xs text-surface-500">
            Combined effect of temperature and humidity on perceived danger
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-700">
                <th className="text-left text-xs text-surface-400 font-medium pb-3 pr-4">
                  Temp
                </th>
                <th className="text-center text-xs text-surface-400 font-medium pb-3 px-2">
                  30% RH
                </th>
                <th className="text-center text-xs text-surface-400 font-medium pb-3 px-2">
                  50% RH
                </th>
                <th className="text-center text-xs text-surface-400 font-medium pb-3 px-2">
                  70% RH
                </th>
                <th className="text-center text-xs text-surface-400 font-medium pb-3 px-2">
                  90% RH
                </th>
              </tr>
            </thead>

            <tbody>
              {heatIndexTable.map((row, i) => (
                <tr key={i} className="border-b border-surface-800/50">
                  <td className="py-3 pr-4 font-display font-bold text-heat-300">
                    {row.temp}°C
                  </td>
                  <td className="py-3 px-2 text-center">
                    <HeatIndexBadge level={row.humidity30} />
                  </td>
                  <td className="py-3 px-2 text-center">
                    <HeatIndexBadge level={row.humidity50} />
                  </td>
                  <td className="py-3 px-2 text-center">
                    <HeatIndexBadge level={row.humidity70} />
                  </td>
                  <td className="py-3 px-2 text-center">
                    <HeatIndexBadge level={row.humidity90} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-surface-500 mt-3">
          Current conditions: {38}°C at {72}% RH —{' '}
          <span className="text-red-400 font-medium">Extreme Danger level</span>
        </p>
      </div>
    </div>
      </div>
    </div>
  );
}