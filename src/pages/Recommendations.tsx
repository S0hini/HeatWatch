import {
  User, Building2, AlertTriangle, Droplets, Umbrella,
  TreePine, Waves, Wind, Home, MapPin, Clock, Phone
} from 'lucide-react';
import { zones, coolingCenters, riskConfig, generateHourlyData, type RiskLevel } from '../lib/mockData';
import { useZone } from '../contexts/ZoneContext';

interface RecCard {
  icon: React.ElementType;
  title: string;
  body: string;
  urgency?: 'normal' | 'warning' | 'critical';
}

function RecommendationCard({ icon: Icon, title, body, urgency = 'normal' }: RecCard) {
  const styles = {
    normal:   'border-surface-700/60 hover:border-heat-600/40',
    warning:  'border-amber-600/30 bg-amber-500/5 hover:border-amber-500/50',
    critical: 'border-ember-600/40 bg-ember-600/8 hover:border-ember-500/60',
  };
  const iconStyles = {
    normal:   'bg-surface-800 text-heat-400',
    warning:  'bg-amber-500/15 text-amber-400',
    critical: 'bg-ember-600/20 text-ember-400',
  };

  return (
    <div className={`glass-card p-5 transition-all duration-200 hover:shadow-heat-sm ${styles[urgency]}`}>
      <div className="flex items-start gap-4">
        <div className={`p-2.5 rounded-xl shrink-0 ${iconStyles[urgency]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-semibold text-heat-100 text-sm mb-1.5 leading-tight">{title}</h4>
          <p className="text-xs text-surface-400 leading-relaxed">{body}</p>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  icon: Icon, title, badge, badgeColor,
}: {
  icon: React.ElementType;
  title: string;
  badge: string;
  badgeColor: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`p-2.5 rounded-xl ${badgeColor}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h2 className="section-title">{title}</h2>
        <span className="text-xs text-surface-500">{badge}</span>
      </div>
    </div>
  );
}

export default function Recommendations() {
  const { selectedZone } = useZone();
  const now          = new Date();
  const hourlyData   = generateHourlyData(selectedZone);
  const liveTemp     = hourlyData[now.getHours()]?.temp     ?? selectedZone.temperature;
  const liveFeels    = hourlyData[now.getHours()]?.feelsLike ?? selectedZone.feelsLike;

  const risk: RiskLevel =
    liveTemp >= 42 ? 'Extreme' :
    liveTemp >= 38 ? 'High'    :
    liveTemp >= 34 ? 'Moderate': 'Low';

  const cfg = riskConfig[risk];
  const isExtremeOrHigh = risk === 'Extreme' || risk === 'High';
  const hotZones = zones.filter(z => z.risk === 'Extreme' || z.risk === 'High');
  const coolZone = zones.find(z => z.risk === 'Low' || z.risk === 'Moderate');

  return (
  <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-[#070608]">
    <div
      className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/bg.png')" }}
    />
    <div className="absolute inset-0 z-[1] bg-[#070608]/35" />
    <div className="relative z-[2]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-10">

      {/* Zone Status Banner */}
      <div className={`rounded-2xl border p-5 flex items-center justify-between gap-4
        ${cfg.bg} ${cfg.border}`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${cfg.bg} border ${cfg.border}`}>
            <AlertTriangle className={`w-6 h-6 ${cfg.text}`} />
          </div>
          <div>
            <p className="text-xs text-surface-500 uppercase tracking-wider mb-0.5">
              Current Zone · {selectedZone.name}
            </p>
            <h1 className={`font-display font-bold text-2xl ${cfg.text}`}>
              {risk} Heat Risk — {Math.round(liveTemp)}°C / Feels {Math.round(liveFeels)}°C
            </h1>
          </div>
        </div>
        <div className="shrink-0 text-right hidden sm:block">
          <p className="text-xs text-surface-500">Surface</p>
          <p className="text-sm font-medium text-heat-200">{selectedZone.surface}</p>
        </div>
      </div>

      {/* Personal Safety */}
      <div>
        <SectionHeader
          icon={User}
          title="Personal Safety"
          badge="What you should do right now"
          badgeColor="bg-ember-600/20 text-ember-400"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <RecommendationCard
            icon={Droplets}
            title="Hydrate Continuously"
            body="Drink at least 250 ml of water every 20–30 minutes. Avoid alcohol, caffeine, and sugary drinks which accelerate dehydration in high-heat conditions."
            urgency={isExtremeOrHigh ? 'critical' : 'warning'}
          />
          <RecommendationCard
            icon={Umbrella}
            title="Avoid Peak Sun Hours"
            body="Stay indoors between 11 AM – 4 PM. If you must go out, wear light-coloured loose clothing, a wide-brim hat, and SPF 50+ sunscreen."
            urgency={isExtremeOrHigh ? 'warning' : 'normal'}
          />
          <RecommendationCard
            icon={Wind}
            title="Cool Down Actively"
            body="Use wet towels on neck and wrists, take cool (not cold) showers, and use fans with cross-ventilation. Avoid ice baths which can cause thermal shock."
            urgency="normal"
          />
          <RecommendationCard
            icon={Home}
            title="Optimise Indoor Environment"
            body="Close curtains on sun-facing windows. Run air conditioning at 24–26°C for efficiency. If no AC, use ceiling fans and open windows after sunset."
            urgency="normal"
          />
          <RecommendationCard
            icon={Phone}
            title="Know Heat Emergency Signs"
            body="Watch for confusion, no sweating despite heat, rapid pulse, or fainting — these are signs of heatstroke. Call 108 immediately and move the person to a cool shaded area."
            urgency={isExtremeOrHigh ? 'critical' : 'normal'}
          />
          <RecommendationCard
            icon={Clock}
            title="Time Outdoor Activity Wisely"
            body="Schedule exercise, errands, or walks before 8 AM or after 6 PM. Even brief 10-minute exposures at peak hours can cause cumulative heat stress."
            urgency="normal"
          />
        </div>
      </div>

      {/* Urban Planning */}
      <div>
        <SectionHeader
          icon={Building2}
          title="Urban & Infrastructure Actions"
          badge="Zone-level interventions to reduce UHI"
          badgeColor="bg-blue-500/15 text-blue-400"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <RecommendationCard
            icon={TreePine}
            title="Expand Green Cover"
            body={`${selectedZone.name} has only ${selectedZone.greenCover}% green cover. Planting native shade trees along pavements can reduce surface temperatures by 4–8°C within 5 years.`}
            urgency={selectedZone.greenCover < 15 ? 'critical' : 'warning'}
          />
          <RecommendationCard
            icon={Waves}
            title="Install Cool Pavements"
            body="Replace dark asphalt with light-coloured or permeable paving materials. Reflective surfaces can lower ambient air temperature by 2–3°C in dense zones."
            urgency="warning"
          />
          <RecommendationCard
            icon={Building2}
            title="Mandate Cool Roofs"
            body="Enforce white or reflective roofing in new construction permits. Cool roofs can cut indoor temperatures by up to 5°C, reducing AC load and energy use."
            urgency="normal"
          />
          <RecommendationCard
            icon={Droplets}
            title="Integrate Water Features"
            body="Fountains, misting systems, and urban ponds lower surrounding air temperatures through evaporative cooling — effective within a 30–50 metre radius."
            urgency="normal"
          />
          <RecommendationCard
            icon={Wind}
            title="Improve Street Ventilation"
            body="Redesign street grids to align with prevailing south-westerly winds. Wind corridors between buildings can reduce felt temperature by 2–4°C."
            urgency="normal"
          />
          <RecommendationCard
            icon={MapPin}
            title="Prioritise High-Risk Zones"
            body={`Zones like ${hotZones.map(z => z.name).join(' and ')} require immediate intervention. Coordinate with KMC for emergency greening and surface treatment.`}
            urgency="critical"
          />
        </div>
      </div>

      {/* Emergency Alerts */}
      <div>
        <SectionHeader
          icon={AlertTriangle}
          title="Emergency Alerts"
          badge={isExtremeOrHigh ? 'Extreme conditions — cooling centers active' : 'No emergency alerts'}
          badgeColor="bg-ember-600/20 text-ember-400"
        />

        {isExtremeOrHigh ? (
          <>
            <div className="bg-ember-600/10 border border-ember-600/30 rounded-2xl p-5 mb-5">
              <p className="text-sm text-ember-300 font-medium mb-1">
                Heat Emergency in Effect — {selectedZone.name}
              </p>
              <p className="text-xs text-surface-400">
                Temperatures above {Math.round(liveTemp)}°C with {selectedZone.humidity}% humidity create{' '}
                {risk === 'Extreme' ? 'Extreme Danger' : 'Danger'} conditions. Visit your nearest cooling center
                immediately if you feel unwell.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {coolingCenters
                .filter((center) => center.zone === selectedZone.name)
                .map((center) => (
                <div key={center.name} className="glass-card-hover p-5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-ember-600/15 rounded-xl text-ember-400 shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-heat-100 text-sm mb-1">{center.name}</h4>
                      <p className="text-xs text-surface-400 mb-2">{center.address} · {center.zone}</p>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                          <Clock className="w-3 h-3" />{center.open}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-amber-400">
                          <Phone className="w-3 h-3" />Call 108
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {coolingCenters.filter((center) => center.zone === selectedZone.name).length === 0 && (
                <div className="glass-card p-5 col-span-2 text-center">
                  <p className="text-surface-400 text-sm mb-1">No cooling centers listed for {selectedZone.name}.</p>
                  <p className="text-surface-500 text-xs">Contact KMC helpline or call 108 for nearest available shelter.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="glass-card p-8 text-center">
            <div className="w-12 h-12 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-heat-200 font-medium mb-1">No Active Alerts for {selectedZone.name}</p>
            <p className="text-surface-500 text-sm">
              {selectedZone.name} is at {risk} risk with {Math.round(liveTemp)}°C. Continue monitoring.
            </p>
          </div>
        )}
      </div>

    </div>
    </div>
  </div>
  );
}