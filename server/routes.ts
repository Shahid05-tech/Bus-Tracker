import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRouteSuggestionSchema, routeSearchSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Route search endpoint
  app.post("/api/routes/search", async (req, res) => {
    try {
      const searchData = routeSearchSchema.parse(req.body);
      
      // Calculate distance between points
      const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };

      // Get all routes
      const routes = await storage.getAllRoutes();
      const busStops = await storage.getAllBusStops();
      
      // Find routes that connect the origin and destination
      const suggestions = [];
      
      // Check for direct routes
      for (const route of routes) {
        const stops = route.stops as any[];
        let hasOrigin = false;
        let hasDestination = false;
        let originOrder = 0;
        let destinationOrder = 0;
        
        for (const stop of stops) {
          const distanceToOrigin = calculateDistance(
            searchData.from.latitude, searchData.from.longitude,
            stop.lat, stop.lng
          );
          const distanceToDestination = calculateDistance(
            searchData.to.latitude, searchData.to.longitude,
            stop.lat, stop.lng
          );
          
          if (distanceToOrigin < 0.5) { // Within 500m
            hasOrigin = true;
            originOrder = stop.order;
          }
          if (distanceToDestination < 0.5) { // Within 500m
            hasDestination = true;
            destinationOrder = stop.order;
          }
        }
        
        if (hasOrigin && hasDestination && originOrder < destinationOrder) {
          const estimatedTime = (destinationOrder - originOrder) * 8; // 8 minutes per stop
          suggestions.push({
            id: `direct-${route.id}`,
            routeType: 'direct',
            busNumber: route.routeName,
            duration: `${estimatedTime} min`,
            route: stops.map(s => s.name).join(' → '),
            nextArrival: '3 min',
            isLiveTracking: true,
            estimatedTime
          });
        }
      }
      
      // Check for connecting routes (simplified logic)
      if (suggestions.length === 0) {
        // Find intermediate stops that connect to destination
        for (const route1 of routes) {
          for (const route2 of routes) {
            if (route1.id === route2.id) continue;
            
            const stops1 = route1.stops as any[];
            const stops2 = route2.stops as any[];
            
            // Find common stops between routes
            const commonStops = stops1.filter(stop1 => 
              stops2.some(stop2 => 
                calculateDistance(stop1.lat, stop1.lng, stop2.lat, stop2.lng) < 0.1
              )
            );
            
            if (commonStops.length > 0) {
              suggestions.push({
                id: `transfer-${route1.id}-${route2.id}`,
                routeType: 'transfer',
                busNumber: `${route1.routeName}, ${route2.routeName}`,
                duration: '18 min',
                route: `${searchData.from.name} → ${commonStops[0].name} → ${searchData.to.name}`,
                nextArrival: '5 min',
                transferTime: '4 min',
                isLiveTracking: true,
                estimatedTime: 18
              });
              break;
            }
          }
          if (suggestions.length > 0) break;
        }
      }
      
      // Add alternative routes
      if (routes.length > 0) {
        suggestions.push({
          id: 'alternative-1',
          routeType: 'alternative',
          busNumber: '67',
          duration: '25 min',
          route: `${searchData.from.name} → North Route → ${searchData.to.name}`,
          nextArrival: '8 min',
          isLiveTracking: false,
          estimatedTime: 25
        });
      }
      
      res.json({ suggestions });
    } catch (error) {
      console.error('Route search error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid search parameters', details: error.errors });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get all active buses
  app.get("/api/buses", async (req, res) => {
    try {
      const buses = await storage.getAllBuses();
      res.json(buses.filter(bus => bus.isActive));
    } catch (error) {
      console.error('Get buses error:', error);
      res.status(500).json({ error: 'Failed to fetch buses' });
    }
  });

  // Get all routes
  app.get("/api/routes", async (req, res) => {
    try {
      const routes = await storage.getAllRoutes();
      res.json(routes.filter(route => route.isActive));
    } catch (error) {
      console.error('Get routes error:', error);
      res.status(500).json({ error: 'Failed to fetch routes' });
    }
  });

  // Get all bus stops
  app.get("/api/bus-stops", async (req, res) => {
    try {
      const busStops = await storage.getAllBusStops();
      res.json(busStops);
    } catch (error) {
      console.error('Get bus stops error:', error);
      res.status(500).json({ error: 'Failed to fetch bus stops' });
    }
  });

  // Update bus location (for bus tracking devices)
  app.post("/api/buses/:busId/location", async (req, res) => {
    try {
      const { busId } = req.params;
      const { latitude, longitude } = req.body;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
      }
      
      const updatedBus = await storage.updateBusLocation(busId, latitude, longitude);
      if (!updatedBus) {
        return res.status(404).json({ error: 'Bus not found' });
      }
      
      res.json(updatedBus);
    } catch (error) {
      console.error('Update bus location error:', error);
      res.status(500).json({ error: 'Failed to update bus location' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
