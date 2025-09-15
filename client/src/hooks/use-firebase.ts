import { useState, useEffect } from 'react';
import { subscribeToBusLocations } from '@/lib/firebase';
import { BusLocation } from '@shared/schema';

export function useBusLocations() {
  const [busLocations, setBusLocations] = useState<Record<string, BusLocation>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const unsubscribe = subscribeToBusLocations((locations) => {
        setBusLocations(locations);
        setIsLoading(false);
      });

      return unsubscribe;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Firebase');
      setIsLoading(false);
    }
  }, []);

  return { busLocations, isLoading, error };
}

export function useGoogleMaps() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;

    // Global callback function
    (window as any).initMap = () => {
      setIsLoaded(true);
    };

    script.onerror = () => {
      setError('Failed to load Google Maps');
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
      delete (window as any).initMap;
    };
  }, []);

  return { isLoaded, error };
}
