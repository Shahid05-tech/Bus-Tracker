import { 
  type Bus, 
  type InsertBus, 
  type Route, 
  type InsertRoute,
  type BusStop,
  type InsertBusStop,
  type RouteSuggestion,
  type InsertRouteSuggestion
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Bus operations
  getBus(id: string): Promise<Bus | undefined>;
  getAllBuses(): Promise<Bus[]>;
  createBus(bus: InsertBus): Promise<Bus>;
  updateBusLocation(busId: string, latitude: number, longitude: number): Promise<Bus | undefined>;
  
  // Route operations
  getRoute(id: string): Promise<Route | undefined>;
  getAllRoutes(): Promise<Route[]>;
  createRoute(route: InsertRoute): Promise<Route>;
  
  // Bus stop operations
  getBusStop(id: string): Promise<BusStop | undefined>;
  getAllBusStops(): Promise<BusStop[]>;
  createBusStop(busStop: InsertBusStop): Promise<BusStop>;
  
  // Route suggestion operations
  getRouteSuggestion(id: string): Promise<RouteSuggestion | undefined>;
  createRouteSuggestion(suggestion: InsertRouteSuggestion): Promise<RouteSuggestion>;
}

export class MemStorage implements IStorage {
  private buses: Map<string, Bus>;
  private routes: Map<string, Route>;
  private busStops: Map<string, BusStop>;
  private routeSuggestions: Map<string, RouteSuggestion>;

  constructor() {
    this.buses = new Map();
    this.routes = new Map();
    this.busStops = new Map();
    this.routeSuggestions = new Map();
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    // Sample bus stops
    const sampleBusStops: BusStop[] = [
      {
        id: "stop-main-street",
        name: "Main Street Station",
        latitude: 40.7505,
        longitude: -73.9934,
        routes: ["route-42a", "route-15"]
      },
      {
        id: "stop-city-center",
        name: "City Center",
        latitude: 40.7589,
        longitude: -73.9851,
        routes: ["route-42a"]
      },
      {
        id: "stop-central-station",
        name: "Central Station",
        latitude: 40.7549,
        longitude: -73.9840,
        routes: ["route-15"]
      },
      {
        id: "stop-airport",
        name: "Airport Terminal",
        latitude: 40.7614,
        longitude: -73.9776,
        routes: ["route-42a", "route-15"]
      }
    ];

    // Sample routes
    const sampleRoutes: Route[] = [
      {
        id: "route-42a",
        routeName: "42A",
        stops: [
          { name: "Main Street Station", lat: 40.7505, lng: -73.9934, order: 1 },
          { name: "City Center", lat: 40.7589, lng: -73.9851, order: 2 },
          { name: "Airport Terminal", lat: 40.7614, lng: -73.9776, order: 3 }
        ],
        schedule: [
          { time: "06:00", stop: "Main Street Station" },
          { time: "06:15", stop: "City Center" },
          { time: "06:30", stop: "Airport Terminal" }
        ],
        isActive: true
      },
      {
        id: "route-15",
        routeName: "15",
        stops: [
          { name: "Main Street Station", lat: 40.7505, lng: -73.9934, order: 1 },
          { name: "Central Station", lat: 40.7549, lng: -73.9840, order: 2 },
          { name: "Airport Terminal", lat: 40.7614, lng: -73.9776, order: 3 }
        ],
        schedule: [
          { time: "06:05", stop: "Main Street Station" },
          { time: "06:25", stop: "Central Station" },
          { time: "06:45", stop: "Airport Terminal" }
        ],
        isActive: true
      }
    ];

    // Sample buses
    const sampleBuses: Bus[] = [
      {
        id: "bus-42a-1",
        busNumber: "42A",
        route: "route-42a",
        currentLat: 40.7589,
        currentLng: -73.9851,
        lastUpdated: new Date(),
        isActive: true,
        capacity: 50,
        currentPassengers: 25
      },
      {
        id: "bus-42a-2",
        busNumber: "42A",
        route: "route-42a",
        currentLat: 40.7614,
        currentLng: -73.9776,
        lastUpdated: new Date(),
        isActive: true,
        capacity: 50,
        currentPassengers: 18
      },
      {
        id: "bus-15-1",
        busNumber: "15",
        route: "route-15",
        currentLat: 40.7505,
        currentLng: -73.9934,
        lastUpdated: new Date(),
        isActive: true,
        capacity: 45,
        currentPassengers: 32
      }
    ];

    // Initialize data
    sampleBusStops.forEach(stop => this.busStops.set(stop.id, stop));
    sampleRoutes.forEach(route => this.routes.set(route.id, route));
    sampleBuses.forEach(bus => this.buses.set(bus.id, bus));
  }

  // Bus operations
  async getBus(id: string): Promise<Bus | undefined> {
    return this.buses.get(id);
  }

  async getAllBuses(): Promise<Bus[]> {
    return Array.from(this.buses.values());
  }

  async createBus(insertBus: InsertBus): Promise<Bus> {
    const id = randomUUID();
    const bus: Bus = { 
      ...insertBus, 
      id,
      lastUpdated: new Date()
    };
    this.buses.set(id, bus);
    return bus;
  }

  async updateBusLocation(busId: string, latitude: number, longitude: number): Promise<Bus | undefined> {
    const bus = this.buses.get(busId);
    if (!bus) return undefined;

    const updatedBus: Bus = {
      ...bus,
      currentLat: latitude,
      currentLng: longitude,
      lastUpdated: new Date()
    };
    
    this.buses.set(busId, updatedBus);
    return updatedBus;
  }

  // Route operations
  async getRoute(id: string): Promise<Route | undefined> {
    return this.routes.get(id);
  }

  async getAllRoutes(): Promise<Route[]> {
    return Array.from(this.routes.values());
  }

  async createRoute(insertRoute: InsertRoute): Promise<Route> {
    const id = randomUUID();
    const route: Route = { ...insertRoute, id };
    this.routes.set(id, route);
    return route;
  }

  // Bus stop operations
  async getBusStop(id: string): Promise<BusStop | undefined> {
    return this.busStops.get(id);
  }

  async getAllBusStops(): Promise<BusStop[]> {
    return Array.from(this.busStops.values());
  }

  async createBusStop(insertBusStop: InsertBusStop): Promise<BusStop> {
    const id = randomUUID();
    const busStop: BusStop = { ...insertBusStop, id };
    this.busStops.set(id, busStop);
    return busStop;
  }

  // Route suggestion operations
  async getRouteSuggestion(id: string): Promise<RouteSuggestion | undefined> {
    return this.routeSuggestions.get(id);
  }

  async createRouteSuggestion(insertSuggestion: InsertRouteSuggestion): Promise<RouteSuggestion> {
    const id = randomUUID();
    const suggestion: RouteSuggestion = { 
      ...insertSuggestion, 
      id,
      createdAt: new Date()
    };
    this.routeSuggestions.set(id, suggestion);
    return suggestion;
  }
}

export const storage = new MemStorage();
