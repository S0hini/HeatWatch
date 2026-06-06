import { createContext, useContext, useState, ReactNode } from 'react';
import { zones, type Zone } from '../lib/mockData';

interface ZoneContextType {
  selectedZone: Zone;
  setSelectedZoneIndex: (i: number) => void;
}

const ZoneContext = createContext<ZoneContextType | null>(null);

export function ZoneProvider({ children }: { children: ReactNode }) {
  const [zoneIndex, setZoneIndex] = useState(0);

  return (
    <ZoneContext.Provider value={{
      selectedZone: zones[zoneIndex],
      setSelectedZoneIndex: setZoneIndex,
    }}>
      {children}
    </ZoneContext.Provider>
  );
}

export function useZone() {
  const ctx = useContext(ZoneContext);
  if (!ctx) throw new Error('useZone must be used within ZoneProvider');
  return ctx;
}