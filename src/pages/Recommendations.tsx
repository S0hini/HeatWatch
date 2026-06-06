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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-10">

      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            className="font-light text-5xl tracking-tight text-heat-50 leading-none mb-2">
          Recommendations
          <em className="italic text-surface-500 ml-3 text-4xl">for {selectedZone.name}</em>
        </h1>
        <p className="mono-label mt-2">Dynamic guidance based on current heat conditions</p>
      </div>

      {/* Condition banner */}
      <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-5 flex flex-col sm:flex-row
                       items-start sm:items-center justify-between gap-4`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${cfg.bg} border ${cfg.border}`}>
            <AlertTriangle className={`w-6 h-6 ${cfg.text}`} />
          </div>
          <div>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
               className={`font-semibold text-2xl tracking-tight ${cfg.text}`}>
              {risk} Heat Alert — {selectedZone.name}
            </p>
            <p className="text-sm text-surface-400 mt-0.5">
              {Math.round(liveTemp)}°C · Feels like {Math.round(liveFeels)}°C · {selectedZone.humidity}% humidity · {selectedZone.surface} surface
            </p>
          </div>
        </div>
        <div className={`font-mono text-[10px] uppercase tracking-wider ${cfg.text}
                         border ${cfg.border} rounded-xl px-4 py-2 shrink-0`}>
          Updated just now
        </div>
      </div>

      {/* Individuals */}
      <section>
        <SectionHeader
          icon={User}
          title="For Individuals"
          badge="Personal safety and health guidance"
          badgeColor="bg-blue-500/15 text-blue-400"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <RecommendationCard
            icon={Clock}
            title="Avoid Peak Heat Hours"
            body="Stay indoors between 11 AM and 4 PM when UV and temperature are at their highest. Plan outdoor activities for early morning or after sunset."
            urgency={isExtremeOrHigh ? 'critical' : 'warning'}
          />
          <RecommendationCard
            icon={Droplets}
            title="Hydrate Frequently"
            body="Drink at least 3–4 litres of water daily. Avoid caffeine and alcohol which accelerate dehydration. Carry water when outdoors."
            urgency={isExtremeOrHigh ? 'critical' : 'normal'}
          />
          <RecommendationCard
            icon={Umbrella}
            title="Wear Protective Clothing"
            body="Use light-coloured, loose-fitting cotton clothes. Wear a wide-brimmed hat and apply SPF 50+ sunscreen when outdoors."
            urgency="warning"
          />
          <RecommendationCard
            icon={Wind}
            title="Improve Home Ventilation"
            body="Close curtains on sun-facing windows during daytime. Use fans and cross-ventilation. Wet curtains improve evaporative cooling by 3–5°C."
            urgency="normal"
          />
          <RecommendationCard
            icon={Home}
            title="Check on Vulnerable Neighbours"
            body="Elderly residents, infants, and those with chronic illness face higher risk. Check in on neighbours daily during extreme heat events."
            urgency={risk === 'Extreme' ? 'critical' : 'warning'}
          />
          <RecommendationCard
            icon={AlertTriangle}
            title="Recognize Heat Stroke Signs"
            body="Symptoms: hot dry skin, confusion, rapid pulse, loss of consciousness. Call 108 immediately. Move victim to cool shade and apply wet cloths."
            urgency="critical"
          />
        </div>
      </section>

      {/* City Planners */}
      <section>
        <SectionHeader
          icon={Building2}
          title="For City Planners"
          badge="Infrastructure and policy interventions"
          badgeColor="bg-heat-600/20 text-heat-400"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Zone-specific recommendation */}
          <RecommendationCard
            icon={TreePine}
            title={`Intervention for ${selectedZone.name}`}
            body={selectedZone.recommendation}
            urgency={isExtremeOrHigh ? 'critical' : 'warning'}
          />
          {hotZones.filter(z => z.id !== selectedZone.id).map((zone) => (
            <RecommendationCard
              key={zone.id}
              icon={TreePine}
              title={`Plant Trees in ${zone.name}`}
              body={`${zone.name} has only ${zone.greenCover}% green cover. A 10% increase in urban tree canopy can reduce local temperatures by 1.5–3°C. Target major arterials first.`}
              urgency="warning"
            />
          ))}
          <RecommendationCard
            icon={Waves}
            title="Add Water Bodies to Industrial Zones"
            body="Introduce retention ponds and fountains in Howrah and Garden Reach. Water features reduce ambient temperatures up to 4°C within a 100m radius."
            urgency="warning"
          />
          <RecommendationCard
            icon={Building2}
            title="Cool Roofs Mandate"
            body="Require reflective roofing materials for new construction and major renovations across Esplanade and Park Street commercial districts."
            urgency="normal"
          />
          {coolZone && coolZone.id !== selectedZone.id && (
            <RecommendationCard
              icon={MapPin}
              title={`Replicate ${coolZone.name} Model`}
              body={`${coolZone.name}'s ${coolZone.greenCover}% green cover keeps temperatures ${Math.round(liveTemp - coolZone.temperature)}°C below ${selectedZone.name}. Enforce its planning standards citywide.`}
              urgency="normal"
            />
          )}
        </div>
      </section>

      {/* Alerts */}
      <section>
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
              {coolingCenters.map((center) => (
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
      </section>

    </div>
  );
}