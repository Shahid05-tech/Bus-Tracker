import { useEffect, useRef, useState } from "react";
import { Plus, Minus, Crosshair, RotateCcw, Bus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBusLocations, useGoogleMaps } from "@/hooks/use-firebase";
import { BusLocation } from "@shared/schema";

interface MapViewProps {
  selectedRoute?: any;
  fromLocation?: { name: string; latitude: number; longitude: number };
  toLocation?: { name: string; latitude: number; longitude: number };
}

export default function MapView({ selectedRoute, fromLocation, toLocation }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const busMarkersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);
  
  const { busLocations, isLoading: busLocationsLoading } = useBusLocations();
  const { isLoaded: isGoogleMapsLoaded, error: googleMapsError } = useGoogleMaps();
  
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [activeBusCount, setActiveBusCount] = useState(0);

  // Initialize Google Map
  useEffect(() => {
    if (!isGoogleMapsLoaded || !mapRef.current || mapInstanceRef.current) return;

    // Default center (New York City)
    const center = { lat: 40.7589, lng: -73.9851 };

    mapInstanceRef.current = new google.maps.Map(mapRef.current, {
      zoom: 13,
      center,
      styles: [
        {
          featureType: "all",
          elementType: "geometry.fill",
          stylers: [{ color: "#f5f5f5" }]
        },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#ffffff" }]
        },
        {
          featureType: "road",
          elementType: "labels.text.fill",
          stylers: [{ color: "#666666" }]
        }
      ],
      disableDefaultUI: true,
      zoomControl: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });
  }, [isGoogleMapsLoaded]);

  // Update bus markers
  useEffect(() => {
    if (!mapInstanceRef.current || !busLocations) return;

    const currentMarkers = busMarkersRef.current;
    const currentBusIds = new Set(Object.keys(busLocations));
    
    // Remove markers for buses that no longer exist
    currentMarkers.forEach((marker, busId) => {
      if (!currentBusIds.has(busId)) {
        marker.setMap(null);
        currentMarkers.delete(busId);
      }
    });

    // Update or create markers for current buses
    Object.entries(busLocations).forEach(([busId, busLocation]) => {
      const position = { lat: busLocation.latitude, lng: busLocation.longitude };
      
      if (currentMarkers.has(busId)) {
        // Update existing marker
        const marker = currentMarkers.get(busId)!;
        marker.setPosition(position);
      } else {
        // Create new marker
        const marker = new google.maps.Marker({
          position,
          map: mapInstanceRef.current,
          title: `Bus ${busLocation.busNumber}`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#1a1a1a',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
          label: {
            text: busLocation.busNumber,
            color: '#ffffff',
            fontSize: '10px',
            fontWeight: '600'
          }
        });

        // Add info window
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; font-family: Inter, sans-serif;">
              <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600;">Bus ${busLocation.busNumber}</h3>
              <p style="margin: 0; font-size: 12px; color: #666;">
                Speed: ${busLocation.speed || 0} mph<br/>
                Last updated: ${new Date(busLocation.timestamp).toLocaleTimeString()}
              </p>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current, marker);
        });

        currentMarkers.set(busId, marker);
      }
    });

    setActiveBusCount(Object.keys(busLocations).length);
    setLastUpdate(new Date().toLocaleTimeString());
  }, [busLocations]);

  // Draw route polyline when locations are selected
  useEffect(() => {
    if (!mapInstanceRef.current || !fromLocation || !toLocation) {
      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null);
        routePolylineRef.current = null;
      }
      return;
    }

    // Remove existing polyline
    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
    }

    // Create new polyline
    const path = [
      { lat: fromLocation.latitude, lng: fromLocation.longitude },
      { lat: toLocation.latitude, lng: toLocation.longitude }
    ];

    routePolylineRef.current = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#1a1a1a',
      strokeOpacity: 1.0,
      strokeWeight: 4,
      map: mapInstanceRef.current
    });

    // Fit map to show the route
    const bounds = new google.maps.LatLngBounds();
    path.forEach(point => bounds.extend(point));
    mapInstanceRef.current.fitBounds(bounds);
  }, [fromLocation, toLocation]);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom() || 13;
      mapInstanceRef.current.setZoom(currentZoom + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom() || 13;
      mapInstanceRef.current.setZoom(Math.max(currentZoom - 1, 1));
    }
  };

  const handleCenterMap = () => {
    if (navigator.geolocation && mapInstanceRef.current) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          mapInstanceRef.current!.setCenter(userLocation);
          mapInstanceRef.current!.setZoom(15);
        },
        () => {
          // Fallback to default center
          mapInstanceRef.current!.setCenter({ lat: 40.7589, lng: -73.9851 });
        }
      );
    }
  };

  const handleRefresh = () => {
    // Force refresh bus locations (Firebase handles this automatically)
    setLastUpdate(new Date().toLocaleTimeString());
  };

  if (googleMapsError) {
    return (
      <div className="flex-1 relative flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">Map Loading Error</h3>
          <p className="text-muted-foreground">Failed to load Google Maps: {googleMapsError}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Please ensure VITE_GOOGLE_MAPS_API_KEY is configured correctly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative">
      {/* Map Container */}
      <div
        ref={mapRef}
        className="h-full w-full"
        data-testid="map-container"
      />

      {/* Loading overlay */}
      {!isGoogleMapsLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handleZoomIn}
          className="bg-background shadow-sm"
          data-testid="button-zoom-in"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleZoomOut}
          className="bg-background shadow-sm"
          data-testid="button-zoom-out"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleCenterMap}
          className="bg-background shadow-sm"
          data-testid="button-center-map"
        >
          <Crosshair className="h-4 w-4" />
        </Button>
      </div>

      {/* Real-time Status Bar */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-background border border-border rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Real-time tracking active</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Last updated: <span data-testid="text-last-update">{lastUpdate || 'Never'}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                <Bus className="inline h-4 w-4 mr-1" />
                <span data-testid="text-bus-count">{activeBusCount}</span> buses online
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="text-primary hover:text-primary/80"
                data-testid="button-refresh"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
