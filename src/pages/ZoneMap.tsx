import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { MapPin, Thermometer, Layers, TreePine, Building2, Droplets } from 'lucide-react';
import { zones, riskConfig, type Zone } from '../lib/mockData';

function FlyToZone({ zone }: { zone: Zone | null }) {
  const map = useMap();
  const prevZone = useRef<Zone | null>(null);

  useEffect(() => {
    if (zone && zone.id !== prevZone.current?.id) {
      map.flyTo([zone.lat, zone.lng], 14, { duration: 1.2 });
      prevZone.current = zone;
    }
  }, [zone, map]);

  return null;
}

function ZoneSidebar({
  selected,
  onSelect,
}: {
  selected: Zone | null;
  onSelect: (z: Zone) => void;
}) {
  return (
    <div className="w-full lg:w-80 shrink-0 flex flex-col glass-card overflow-hidden">
      <div className="p-5 border-b border-surface-700/50">
        <h2 className="section-title flex items-center gap-2">
          <Layers className="w-5 h-5 text-heat-500" />
          Monitoring Zones
        </h2>
        <p className="text-xs text-surface-500 mt-1">Select a zone to inspect</p>
      </div>
      <div className="overflow-y-auto flex-1">
        {zones.map((zone) => {
          const cfg = riskConfig[zone.risk];
          const isSelected = selected?.id === zone.id;
          return (
            <button
              key={zone.id}
              onClick={() => onSelect(zone)}
              className={`w-full text-left px-5 py-4 border-b border-surface-800/50 transition-all duration-200 flex items-center gap-4 ${
                isSelected
                  ? 'bg-heat-600/15 border-l-2 border-l-heat-500'
                  : 'hover:bg-surface-800/50 border-l-2 border-l-transparent'
              }`}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: zone.color + '20', border: `1px solid ${zone.color}40` }}
              >
                <MapPin className="w-4 h-4" style={{ color: zone.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-heat-100 text-sm">{zone.name}</span>
                  <span className="font-display font-bold text-sm" style={{ color: zone.color }}>
                    {zone.temperature}°C
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                    {zone.risk}
                  </span>
                  <span className="text-xs text-surface-500 truncate">{zone.surface}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ZonePopupContent({ zone }: { zone: Zone }) {
  const cfg = riskConfig[zone.risk];
  return (
    <div className="min-w-[220px]">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-4 h-4" style={{ color: zone.color }} />
        <span className="font-display font-semibold text-heat-100 text-sm">{zone.name}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-surface-800/80 rounded-lg p-2 text-center">
          <div className="font-bold text-lg" style={{ color: zone.color }}>{zone.temperature}°C</div>
          <div className="text-xs text-surface-500">Temp</div>
        </div>
        <div className="bg-surface-800/80 rounded-lg p-2 text-center">
          <div className={`font-bold text-sm ${cfg.text}`}>{zone.risk}</div>
          <div className="text-xs text-surface-500">Risk Level</div>
        </div>
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-2 text-surface-400">
          <Building2 className="w-3 h-3" />
          <span>Surface: <span className="text-heat-200">{zone.surface}</span></span>
        </div>
        <div className="flex items-center gap-2 text-surface-400">
          <TreePine className="w-3 h-3" />
          <span>Green cover: <span className="text-emerald-400">{zone.greenCover}%</span></span>
        </div>
        <div className="flex items-center gap-2 text-surface-400">
          <Droplets className="w-3 h-3" />
          <span>Humidity: <span className="text-blue-400">{zone.humidity}%</span></span>
        </div>
      </div>
      <p className="text-xs text-amber-300/80 mt-3 leading-relaxed border-t border-surface-700 pt-3">
        {zone.recommendation}
      </p>
    </div>
  );
}

export default function ZoneMap() {
  const [selected, setSelected] = useState<Zone | null>(null);

  const handleSelect = (zone: Zone) => {
    setSelected(zone);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-0 h-[calc(100vh-64px)] overflow-hidden animate-fade-in">
      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={[22.5726, 88.3519]}
          zoom={12}
          className="w-full h-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FlyToZone zone={selected} />
          {zones.map((zone) => (
            <CircleMarker
              key={zone.id}
              center={[zone.lat, zone.lng]}
              radius={selected?.id === zone.id ? 32 : 24}
              pathOptions={{
                color: zone.color,
                fillColor: zone.color,
                fillOpacity: selected?.id === zone.id ? 0.55 : 0.35,
                weight: selected?.id === zone.id ? 3 : 2,
              }}
              eventHandlers={{ click: () => handleSelect(zone) }}
            >
              <Popup maxWidth={260}>
                <ZonePopupContent zone={zone} />
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Map overlay legend */}
        <div className="absolute bottom-4 left-4 z-[1000] glass-card px-4 py-3 text-xs space-y-1.5">
          <div className="text-surface-400 font-medium mb-2 uppercase tracking-wider text-[10px]">Risk Legend</div>
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

        {/* Kolkata label */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] glass-card px-4 py-2 flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-heat-400" />
          <span className="text-sm font-medium text-heat-200">Kolkata Metropolitan Area</span>
        </div>
      </div>

      {/* Sidebar */}
      <ZoneSidebar selected={selected} onSelect={handleSelect} />
    </div>
  );
}
