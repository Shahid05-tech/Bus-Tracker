import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, push, set, off } from "firebase/database";
import { BusLocation } from "@shared/schema";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com/`
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);

// Firebase Realtime Database helpers
export const busLocationsRef = ref(database, 'busLocations');
export const routesRef = ref(database, 'routes');
export const busStopsRef = ref(database, 'busStops');

// Subscribe to real-time bus location updates
export const subscribeToBusLocations = (callback: (locations: Record<string, BusLocation>) => void) => {
  const unsubscribe = onValue(busLocationsRef, (snapshot) => {
    const data = snapshot.val() || {};
    callback(data);
  });
  
  return () => off(busLocationsRef, 'value', unsubscribe);
};

// Update bus location in Firebase
export const updateBusLocation = async (busLocation: BusLocation) => {
  const busRef = ref(database, `busLocations/${busLocation.busId}`);
  await set(busRef, {
    ...busLocation,
    timestamp: Date.now()
  });
};

// Get route data
export const getRouteData = (routeId: string, callback: (route: any) => void) => {
  const routeRef = ref(database, `routes/${routeId}`);
  return onValue(routeRef, (snapshot) => {
    const data = snapshot.val();
    callback(data);
  });
};

// Initialize sample data (for development)
export const initializeSampleData = async () => {
  // Sample bus locations
  const sampleBusLocations = {
    'bus-42a-1': {
      busId: 'bus-42a-1',
      busNumber: '42A',
      latitude: 40.7589,
      longitude: -73.9851,
      timestamp: Date.now(),
      speed: 25,
      heading: 90,
      route: 'route-42a'
    },
    'bus-42a-2': {
      busId: 'bus-42a-2',
      busNumber: '42A',
      latitude: 40.7614,
      longitude: -73.9776,
      timestamp: Date.now(),
      speed: 30,
      heading: 85,
      route: 'route-42a'
    },
    'bus-15-1': {
      busId: 'bus-15-1',
      busNumber: '15',
      latitude: 40.7505,
      longitude: -73.9934,
      timestamp: Date.now(),
      speed: 20,
      heading: 45,
      route: 'route-15'
    }
  };

  // Sample routes
  const sampleRoutes = {
    'route-42a': {
      id: 'route-42a',
      name: 'Route 42A',
      stops: [
        { name: 'Main Street Station', lat: 40.7505, lng: -73.9934, order: 1 },
        { name: 'City Center', lat: 40.7589, lng: -73.9851, order: 2 },
        { name: 'Airport Terminal', lat: 40.7614, lng: -73.9776, order: 3 }
      ],
      schedule: [
        { time: '06:00', stop: 'Main Street Station' },
        { time: '06:15', stop: 'City Center' },
        { time: '06:30', stop: 'Airport Terminal' }
      ],
      color: '#1a1a1a'
    },
    'route-15': {
      id: 'route-15',
      name: 'Route 15',
      stops: [
        { name: 'Main Street Station', lat: 40.7505, lng: -73.9934, order: 1 },
        { name: 'Central Station', lat: 40.7549, lng: -73.9840, order: 2 },
        { name: 'Airport Terminal', lat: 40.7614, lng: -73.9776, order: 3 }
      ],
      schedule: [
        { time: '06:05', stop: 'Main Street Station' },
        { time: '06:25', stop: 'Central Station' },
        { time: '06:45', stop: 'Airport Terminal' }
      ],
      color: '#6b7280'
    }
  };

  // Sample bus stops
  const sampleBusStops = {
    'stop-main-street': {
      id: 'stop-main-street',
      name: 'Main Street Station',
      latitude: 40.7505,
      longitude: -73.9934,
      routes: ['route-42a', 'route-15']
    },
    'stop-city-center': {
      id: 'stop-city-center',
      name: 'City Center',
      latitude: 40.7589,
      longitude: -73.9851,
      routes: ['route-42a']
    },
    'stop-central-station': {
      id: 'stop-central-station',
      name: 'Central Station',
      latitude: 40.7549,
      longitude: -73.9840,
      routes: ['route-15']
    },
    'stop-airport': {
      id: 'stop-airport',
      name: 'Airport Terminal',
      latitude: 40.7614,
      longitude: -73.9776,
      routes: ['route-42a', 'route-15']
    }
  };

  try {
    await set(busLocationsRef, sampleBusLocations);
    await set(routesRef, sampleRoutes);
    await set(busStopsRef, sampleBusStops);
    console.log('Sample data initialized successfully');
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
};
