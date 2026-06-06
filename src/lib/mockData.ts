export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Extreme';
export type SurfaceType = 'Concrete' | 'Mixed' | 'Industrial' | 'Green' | 'Riverside';

export interface Zone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  temperature: number;
  feelsLike: number;
  humidity: number;
  risk: RiskLevel;
  surface: SurfaceType;
  greenCover: number; // %
  concreteRatio: number; // %
  population: string;
  description: string;
  recommendation: string;
  color: string;
}

export interface HourlyData {
  hour: string;
  temp: number;
  feelsLike: number;
}

export interface HistoricalData {
  year: string;
  avgTemp: number;
  uhiIntensity: number;
}

export interface HeatIndexEntry {
  temp: number;
  humidity30: string;
  humidity50: string;
  humidity70: string;
  humidity90: string;
}

export const currentConditions = {
  city: 'Kolkata',
  temperature: 38,
  feelsLike: 44,
  humidity: 72,
  uvIndex: 9,
  windSpeed: 12,
  airQuality: 'Moderate',
  lastUpdated: new Date(),
};

export const zones: Zone[] = [
  {
    id: 'howrah',
    name: 'Howrah',
    lat: 22.5958,
    lng: 88.2636,
    temperature: 42,
    feelsLike: 49,
    humidity: 68,
    risk: 'Extreme',
    surface: 'Industrial',
    greenCover: 4,
    concreteRatio: 87,
    population: '1.07M',
    description: 'Dense industrial zone with minimal vegetation. Heavy vehicle traffic and manufacturing plants create significant heat accumulation. The historic Howrah Bridge area sees peak temperatures due to concrete saturation.',
    recommendation: 'Priority zone for emergency cooling centers. Immediate need for rooftop gardens and reflective surface treatments on industrial buildings.',
    color: '#dc2626',
  },
  {
    id: 'esplanade',
    name: 'Esplanade',
    lat: 22.5726,
    lng: 88.3519,
    temperature: 39,
    feelsLike: 46,
    humidity: 71,
    risk: 'High',
    surface: 'Concrete',
    greenCover: 8,
    concreteRatio: 82,
    population: '0.6M',
    description: 'Commercial hub with dense high-rise buildings creating urban canyons that trap heat. Limited tree canopy along major arterials. High foot traffic generates additional anthropogenic heat.',
    recommendation: 'Install cool pavements on BBD Bagh corridors. Expand Maidan green buffer zone and add misting stations at major pedestrian intersections.',
    color: '#ea580c',
  },
  {
    id: 'park-street',
    name: 'Park Street',
    lat: 22.5550,
    lng: 88.3520,
    temperature: 38,
    feelsLike: 44,
    humidity: 73,
    risk: 'High',
    surface: 'Concrete',
    greenCover: 12,
    concreteRatio: 76,
    population: '0.4M',
    description: 'Entertainment and business district with moderate building density. Victoria Memorial and nearby parks provide some cooling relief, but commercial strip generates concentrated heat during peak hours.',
    recommendation: 'Expand street tree planting along Park Street corridor. Implement green building standards for new commercial developments.',
    color: '#f97316',
  },
  {
    id: 'garden-reach',
    name: 'Garden Reach',
    lat: 22.5126,
    lng: 88.2986,
    temperature: 40,
    feelsLike: 47,
    humidity: 70,
    risk: 'High',
    surface: 'Riverside',
    greenCover: 9,
    concreteRatio: 79,
    population: '0.5M',
    description: 'Port and shipyard area along the Hooghly River. Industrial riverside activity negates potential water cooling effects. Densely packed low-rise residential areas with negligible vegetation cover.',
    recommendation: 'Restore riverside vegetation buffer. Install solar-reflective roofing program in residential clusters near port area.',
    color: '#fb923c',
  },
  {
    id: 'salt-lake',
    name: 'Salt Lake',
    lat: 22.5833,
    lng: 88.4139,
    temperature: 36,
    feelsLike: 41,
    humidity: 75,
    risk: 'Moderate',
    surface: 'Mixed',
    greenCover: 28,
    concreteRatio: 58,
    population: '0.8M',
    description: 'Planned satellite township with relatively organized layout and green spaces. IT sector presence with modern building standards. Higher tree coverage compared to central zones provides measurable cooling.',
    recommendation: 'Maintain existing green cover. Introduce white roofing mandate for new IT parks. Expand Central Park buffer zone.',
    color: '#f59e0b',
  },
  {
    id: 'new-town',
    name: 'New Town',
    lat: 22.5811,
    lng: 88.4617,
    temperature: 35,
    feelsLike: 40,
    humidity: 77,
    risk: 'Moderate',
    surface: 'Green',
    greenCover: 35,
    concreteRatio: 48,
    population: '0.35M',
    description: 'Newest planned township with the highest green cover in the study area. Modern eco-conscious architecture and mandatory green buffer zones keep temperatures 6-7°C below the city average.',
    recommendation: 'Model zone for UHI mitigation. Replicate green zone planning standards across redevelopment projects. Protect existing wetland ecosystems.',
    color: '#10b981',
  },
];

export const generateHourlyData = (zone: Zone): HourlyData[] => {
  return Array.from({ length: 24 }, (_, h) => {
    const hour =
      h === 0 ? '12 AM' :
      h < 12 ? `${h} AM` :
      h === 12 ? '12 PM' :
      `${h - 12} PM`;

    const peakHour = 14;
    const variation = Math.cos(((h - peakHour) * Math.PI) / 12);

    const amplitude =
      4 +
      (zone.concreteRatio / 100) * 4 -
      (zone.greenCover / 100) * 2;

    const temp = zone.temperature + amplitude * variation;
    const feelsLike = temp + (zone.humidity / 100) * 6;

    return {
      hour,
      temp: Number(temp.toFixed(1)),
      feelsLike: Number(feelsLike.toFixed(1)),
    };
  });
};

export const hourlyData: HourlyData[] = generateHourlyData(zones[2]);

export const historicalData: HistoricalData[] = [
  { year: '2000', avgTemp: 29.2, uhiIntensity: 1.8 },
  { year: '2003', avgTemp: 29.8, uhiIntensity: 2.1 },
  { year: '2006', avgTemp: 30.4, uhiIntensity: 2.5 },
  { year: '2009', avgTemp: 30.9, uhiIntensity: 2.9 },
  { year: '2012', avgTemp: 31.6, uhiIntensity: 3.3 },
  { year: '2015', avgTemp: 32.2, uhiIntensity: 3.8 },
  { year: '2018', avgTemp: 33.0, uhiIntensity: 4.4 },
  { year: '2021', avgTemp: 33.8, uhiIntensity: 5.0 },
  { year: '2024', avgTemp: 34.7, uhiIntensity: 5.8 },
  { year: '2026', avgTemp: 35.4, uhiIntensity: 6.4 },
];

export const heatIndexTable: HeatIndexEntry[] = [
  { temp: 32, humidity30: 'Caution', humidity50: 'Caution', humidity70: 'Extreme Caution', humidity90: 'Danger' },
  { temp: 35, humidity30: 'Caution', humidity50: 'Extreme Caution', humidity70: 'Danger', humidity90: 'Danger' },
  { temp: 38, humidity30: 'Extreme Caution', humidity50: 'Danger', humidity70: 'Extreme Danger', humidity90: 'Extreme Danger' },
  { temp: 41, humidity30: 'Danger', humidity50: 'Extreme Danger', humidity70: 'Extreme Danger', humidity90: 'Extreme Danger' },
  { temp: 44, humidity30: 'Extreme Danger', humidity50: 'Extreme Danger', humidity70: 'Extreme Danger', humidity90: 'Extreme Danger' },
];

export const coolingCenters = [
  { name: 'Rabindra Sarani Community Center', zone: 'Esplanade', address: 'Near Shyambazar', open: '7 AM – 9 PM' },
  { name: 'Howrah District Hospital Annex', zone: 'Howrah', address: 'Hospital Road, Howrah', open: '24 Hours' },
  { name: 'Salt Lake Stadium Relief Point', zone: 'Salt Lake', address: 'Sector V', open: '6 AM – 8 PM' },
  { name: 'Garden Reach Municipal Hall', zone: 'Garden Reach', address: 'Port Trust Road', open: '8 AM – 6 PM' },
];

export const riskConfig: Record<RiskLevel, { color: string; bg: string; border: string; text: string; dot: string }> = {
  Low:     { color: '#10b981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  Moderate:{ color: '#f59e0b', bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text: 'text-amber-400',   dot: 'bg-amber-400'   },
  High:    { color: '#f97316', bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  text: 'text-orange-400',  dot: 'bg-orange-400'  },
  Extreme: { color: '#dc2626', bg: 'bg-red-600/10',     border: 'border-red-600/30',     text: 'text-red-400',     dot: 'bg-red-400'     },
};
