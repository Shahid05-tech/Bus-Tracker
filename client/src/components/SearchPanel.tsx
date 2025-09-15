import { useState, useRef, useEffect } from "react";
import { Search, MapPin, Flag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import RouteCard from "./RouteCard";
import { useGoogleMaps } from "@/hooks/use-firebase";

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

interface SearchPanelProps {
  onRouteSelect?: (route: RouteSuggestion) => void;
  onLocationSelect?: (from: SearchLocation, to: SearchLocation) => void;
}

export default function SearchPanel({ onRouteSelect, onLocationSelect }: SearchPanelProps) {
  const [currentLocation, setCurrentLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [routeSuggestions, setRouteSuggestions] = useState<RouteSuggestion[]>([]);
  const [showCurrentSuggestions, setShowCurrentSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [currentLocationSuggestions, setCurrentLocationSuggestions] = useState<SearchLocation[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<SearchLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const currentLocationRef = useRef<HTMLInputElement>(null);
  const destinationRef = useRef<HTMLInputElement>(null);
  const { isLoaded: isGoogleMapsLoaded } = useGoogleMaps();

  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    if (isGoogleMapsLoaded && window.google) {
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
      
      // Create a dummy div for PlacesService (required by Google Maps API)
      const dummyDiv = document.createElement('div');
      const map = new google.maps.Map(dummyDiv);
      placesServiceRef.current = new google.maps.places.PlacesService(map);
    }
  }, [isGoogleMapsLoaded]);

  const searchPlaces = (query: string, callback: (results: SearchLocation[]) => void) => {
    if (!autocompleteServiceRef.current || !placesServiceRef.current || query.length < 2) {
      callback([]);
      return;
    }

    autocompleteServiceRef.current.getPlacePredictions(
      {
        input: query,
        types: ['establishment', 'geocode']
      },
      (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          const locations: SearchLocation[] = [];
          let processed = 0;

          predictions.slice(0, 5).forEach((prediction) => {
            placesServiceRef.current!.getDetails(
              {
                placeId: prediction.place_id,
                fields: ['name', 'geometry', 'formatted_address']
              },
              (place, detailStatus) => {
                processed++;
                if (detailStatus === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
                  locations.push({
                    name: place.name || place.formatted_address || prediction.description,
                    latitude: place.geometry.location.lat(),
                    longitude: place.geometry.location.lng()
                  });
                }

                if (processed === Math.min(predictions.length, 5)) {
                  callback(locations);
                }
              }
            );
          });
        } else {
          callback([]);
        }
      }
    );
  };

  const handleCurrentLocationChange = (value: string) => {
    setCurrentLocation(value);
    setShowCurrentSuggestions(true);
    
    if (value.length >= 2) {
      searchPlaces(value, (results) => {
        setCurrentLocationSuggestions(results);
      });
    } else {
      setCurrentLocationSuggestions([]);
    }
  };

  const handleDestinationChange = (value: string) => {
    setDestination(value);
    setShowDestinationSuggestions(true);
    
    if (value.length >= 2) {
      searchPlaces(value, (results) => {
        setDestinationSuggestions(results);
      });
    } else {
      setDestinationSuggestions([]);
    }
  };

  const selectCurrentLocation = (location: SearchLocation) => {
    setCurrentLocation(location.name);
    setShowCurrentSuggestions(false);
  };

  const selectDestination = (location: SearchLocation) => {
    setDestination(location.name);
    setShowDestinationSuggestions(false);
  };

  const handleSearch = async () => {
    if (!currentLocation || !destination) return;

    setIsSearching(true);
    
    try {
      // Find the selected locations
      const fromLocation = currentLocationSuggestions.find(loc => loc.name === currentLocation) || 
                          { name: currentLocation, latitude: 0, longitude: 0 };
      const toLocation = destinationSuggestions.find(loc => loc.name === destination) || 
                        { name: destination, latitude: 0, longitude: 0 };

      // Call parent callback
      onLocationSelect?.(fromLocation, toLocation);

      // Mock route suggestions (replace with actual API call)
      const mockSuggestions: RouteSuggestion[] = [
        {
          id: '1',
          busNumber: '42A',
          routeType: 'direct',
          duration: '12 min',
          route: 'Main Street → City Center → Airport',
          nextArrival: '3 min',
          isLiveTracking: true
        },
        {
          id: '2',
          busNumber: '15, 23',
          routeType: 'transfer',
          duration: '18 min',
          route: 'Main Street → Central Station → Airport',
          nextArrival: '5 min',
          transferTime: '4 min',
          isLiveTracking: true
        },
        {
          id: '3',
          busNumber: '67',
          routeType: 'alternative',
          duration: '25 min',
          route: 'Main Street → North Route → Airport',
          nextArrival: '8 min',
          isLiveTracking: false
        }
      ];

      setRouteSuggestions(mockSuggestions);
    } finally {
      setIsSearching(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Use reverse geocoding to get the address
          if (isGoogleMapsLoaded && window.google) {
            const geocoder = new google.maps.Geocoder();
            const latLng = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };

            geocoder.geocode({ location: latLng }, (results, status) => {
              if (status === 'OK' && results?.[0]) {
                setCurrentLocation(results[0].formatted_address);
              }
            });
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col overflow-hidden">
      {/* Search Form */}
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-semibold mb-4">Plan Your Journey</h2>
        
        {/* Current Location Input */}
        <div className="mb-4 relative">
          <Label className="block text-sm font-medium text-muted-foreground mb-2">From</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={currentLocationRef}
              type="text"
              placeholder="Enter current location"
              value={currentLocation}
              onChange={(e) => handleCurrentLocationChange(e.target.value)}
              onFocus={() => setShowCurrentSuggestions(true)}
              onBlur={() => setTimeout(() => setShowCurrentSuggestions(false), 200)}
              className="pl-10"
              data-testid="input-current-location"
            />
            <button
              onClick={getCurrentLocation}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              data-testid="button-current-location"
            >
              <MapPin className="h-4 w-4" />
            </button>
          </div>
          
          {/* Current Location Suggestions */}
          {showCurrentSuggestions && currentLocationSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto z-50">
              {currentLocationSuggestions.map((location, index) => (
                <div
                  key={index}
                  className="p-3 hover:bg-accent cursor-pointer text-sm"
                  onClick={() => selectCurrentLocation(location)}
                  data-testid={`suggestion-current-${index}`}
                >
                  <MapPin className="inline h-3 w-3 mr-2 text-muted-foreground" />
                  {location.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Destination Input */}
        <div className="mb-4 relative">
          <Label className="block text-sm font-medium text-muted-foreground mb-2">To</Label>
          <div className="relative">
            <Flag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={destinationRef}
              type="text"
              placeholder="Enter destination"
              value={destination}
              onChange={(e) => handleDestinationChange(e.target.value)}
              onFocus={() => setShowDestinationSuggestions(true)}
              onBlur={() => setTimeout(() => setShowDestinationSuggestions(false), 200)}
              className="pl-10"
              data-testid="input-destination"
            />
          </div>
          
          {/* Destination Suggestions */}
          {showDestinationSuggestions && destinationSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto z-50">
              {destinationSuggestions.map((location, index) => (
                <div
                  key={index}
                  className="p-3 hover:bg-accent cursor-pointer text-sm"
                  onClick={() => selectDestination(location)}
                  data-testid={`suggestion-destination-${index}`}
                >
                  <MapPin className="inline h-3 w-3 mr-2 text-muted-foreground" />
                  {location.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Search Button */}
        <Button
          onClick={handleSearch}
          disabled={!currentLocation || !destination || isSearching}
          className="w-full"
          data-testid="button-search-routes"
        >
          <Search className="h-4 w-4 mr-2" />
          {isSearching ? 'Searching...' : 'Find Routes'}
        </Button>
      </div>

      {/* Route Suggestions */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Route Suggestions
          </h3>
          
          {routeSuggestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Enter locations to see route suggestions</p>
            </div>
          ) : (
            routeSuggestions.map((route) => (
              <RouteCard
                key={route.id}
                busNumber={route.busNumber}
                routeType={route.routeType}
                duration={route.duration}
                route={route.route}
                nextArrival={route.nextArrival}
                isLiveTracking={route.isLiveTracking}
                transferTime={route.transferTime}
                onClick={() => onRouteSelect?.(route)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
