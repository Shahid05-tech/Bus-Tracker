import { useState, useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import SearchPanel from "@/components/SearchPanel";
import MapView from "@/components/MapView";
import { initializeSampleData } from "@/lib/firebase";

interface SearchLocation {
  name: string;
  latitude: number;
  longitude: number;
}

interface RouteSuggestion {
  id: string;
  busNumber: string;
  routeType: 'direct' | 'transfer' | 'alternative';
  duration: string;
  route: string;
  nextArrival: string;
  isLiveTracking: boolean;
  transferTime?: string;
}

export default function Home() {
  const [selectedRoute, setSelectedRoute] = useState<RouteSuggestion | null>(null);
  const [fromLocation, setFromLocation] = useState<SearchLocation | null>(null);
  const [toLocation, setToLocation] = useState<SearchLocation | null>(null);

  // Initialize Firebase sample data on component mount
  useEffect(() => {
    initializeSampleData().catch(console.error);
  }, []);

  const handleRouteSelect = (route: RouteSuggestion) => {
    setSelectedRoute(route);
  };

  const handleLocationSelect = (from: SearchLocation, to: SearchLocation) => {
    setFromLocation(from);
    setToLocation(to);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="flex h-[calc(100vh-4rem)]">
        <SearchPanel 
          onRouteSelect={handleRouteSelect}
          onLocationSelect={handleLocationSelect}
        />
        <MapView 
          selectedRoute={selectedRoute}
          fromLocation={fromLocation || undefined}
          toLocation={toLocation || undefined}
        />
      </div>
    </div>
  );
}
