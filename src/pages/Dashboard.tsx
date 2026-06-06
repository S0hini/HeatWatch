export default function Dashboard() {
  const [time, setTime] = useState(now);

  const { selectedZone: lockedZone, setSelectedZoneIndex } = useZone();
  const [localIndex, setLocalIndex] = useState(zones.indexOf(lockedZone));

  // activeZone is always the locked one — no hover preview
  const activeZone = zones[localIndex];

  const hourlyData       = generateHourlyData(activeZone);
  const currentHour      = now.getHours();
  const currentHourData  = hourlyData[currentHour];
  const currentHourLabel = currentHourData?.hour;
  const liveTemp         = currentHourData?.temp     ?? activeZone.temperature;
  const liveFeels        = currentHourData?.feelsLike ?? activeZone.feelsLike;

  const overallRisk: RiskLevel =
    liveTemp >= 42 ? 'Extreme' :
    liveTemp >= 38 ? 'High'    :
    liveTemp >= 34 ? 'Moderate': 'Low';

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = time.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  const dateStr = time.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8
                      pb-6 border-b border-surface-700/40">
        <div>
          {/* Static zone name — no hover */}
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              className="font-light text-5xl tracking-tight text-heat-50 leading-none mb-2 flex items-end gap-3">
            <span className="flex items-center gap-2">
              {activeZone.name}
            </span>
            <em className="italic text-surface-500 text-4xl">UHI Monitor</em>
          </h1>

          {/* Zone pills — only interaction point */}
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
                    ? 'border-heat-500/60 text-heat-300 bg-heat-600/15'
                    : 'border-surface-700/60 text-surface-500 hover:text-heat-300 hover:border-heat-600/40'
                }`}
              >
                {z.name}
              </button>
            ))}
          </div>

          <p className="mono-label mt-3">{dateStr.toUpperCase()}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-surface-800/80 border border-surface-700/60
                          rounded-xl px-3.5 py-2">
            <Clock className="w-3.5 h-3.5 text-surface-500" />
            <span className="font-mono text-heat-200 text-[13px]">{timeStr}</span>
          </div>
          <div className="flex items-center gap-2 bg-heat-600/15 border border-heat-600/25
                          rounded-xl px-3.5 py-2">
            <Thermometer className="w-3.5 h-3.5 text-heat-400" />
            <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  className="font-medium text-heat-300 text-xl leading-none">
              {Math.round(liveTemp)}°C
            </span>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="mono-label mb-4">01 — Current Conditions · {activeZone.name}</div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        <StatCard icon={Thermometer} label="Temperature" value={String(Math.round(liveTemp))}  unit="°C"    sub={`${activeZone.risk} risk zone`}          accent="#f97316" />
        <StatCard icon={Activity}    label="Feels Like"  value={String(Math.round(liveFeels))} unit="°C"    sub="Heat index adjusted"                      accent="#ef4444" />
        <StatCard icon={Droplets}    label="Humidity"    value={String(activeZone.humidity)}   unit="%"     sub="Zone moisture level"                      accent="#60a5fa" />
        <StatCard icon={Sun}         label="UV Index"    value={String(activeZone.concreteRatio > 70 ? 9 : activeZone.greenCover > 25 ? 6 : 8)} unit="/11" sub="Surface adjusted" accent="#fbbf24" />
        <StatCard icon={Wind}        label="Green Cover" value={String(activeZone.greenCover)} unit="%"     sub={`Concrete: ${activeZone.concreteRatio}%`} accent="#34d399" />
      </div>

      {/* ── Chart + Risk Badge ── */}
      <div className="mono-label mb-4">02 — Hourly Forecast · {activeZone.name}</div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="section-title flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-heat-500" />
                Hourly Temperature
              </h2>
              <p className="mono-label mt-1">24-hour · {activeZone.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 mono-label">
                <span className="w-3 h-px bg-heat-500 inline-block" /> Temp
              </span>
              <span className="flex items-center gap-1.5 mono-label">
                <span className="w-3 h-px bg-ember-400 inline-block opacity-60" /> Feels
              </span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={hourlyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d1600" vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: '#6b3800', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                     tickLine={false} axisLine={false} interval={3} />
              <YAxis tick={{ fill: '#6b3800', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                     tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} unit="°" />
              <Tooltip content={<CustomTooltip />} />
              {currentHourLabel && (
                <ReferenceLine x={currentHourLabel} stroke="#f97316" strokeDasharray="3 3" strokeOpacity={0.5} />
              )}
              <Line type="monotone" dataKey="temp"      name="Temperature" stroke={activeZone.color} strokeWidth={2}
                    dot={false} activeDot={{ r: 4, fill: activeZone.color, stroke: '#0d0500', strokeWidth: 2 }} />
              <Line type="monotone" dataKey="feelsLike" name="Feels Like"  stroke="#ef4444" strokeWidth={1.5}
                    strokeDasharray="4 4" dot={false} activeDot={{ r: 3, fill: '#ef4444' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <HeatBadge risk={overallRisk} />
      </div>

      {/* ── Zone Overview ── */}
      <div className="mono-label mb-4">03 — Zone Temperature Overview</div>
      <div className="glass-card p-6">
        <div className="space-y-4">
          {[...zones].sort((a, b) => b.temperature - a.temperature).map((zone, i) => {
            const cfg = riskConfig[zone.risk];
            const pct = ((zone.temperature - 28) / (44 - 28)) * 100;
            const isActive = zone.id === activeZone.id;
            return (
              <div key={zone.id}>
                {i > 0 && <div className="h-px bg-surface-800/60 mb-4" />}
                <div
                  className={`flex items-center gap-4 cursor-pointer rounded-lg px-2 py-1 -mx-2
                              transition-colors duration-150 ${isActive ? 'bg-heat-600/10' : 'hover:bg-surface-800/40'}`}
                  onClick={() => {
                    const idx = zones.indexOf(zone);
                    setLocalIndex(idx);
                    setSelectedZoneIndex(idx);
                  }}
                >
                  <div className="w-24 shrink-0">
                    <div className={`text-[13px] font-medium transition-colors ${isActive ? 'text-heat-300' : 'text-heat-200'}`}>
                      {zone.name}
                    </div>
                    <div className={`text-[10px] font-mono uppercase tracking-wider mt-0.5 ${cfg.text}`}>
                      {zone.risk}
                    </div>
                  </div>
                  <div className="flex-1 bg-surface-800 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                         style={{ width: `${pct}%`, backgroundColor: zone.color }} />
                  </div>
                  <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                       className="text-2xl font-medium shrink-0 w-16 text-right">
                    <span style={{ color: zone.color }}>{zone.temperature}°</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}