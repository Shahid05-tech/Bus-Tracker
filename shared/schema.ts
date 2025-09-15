import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const buses = pgTable("buses", {
  id: varchar("id").primaryKey(),
  busNumber: text("bus_number").notNull(),
  route: text("route").notNull(),
  currentLat: real("current_lat"),
  currentLng: real("current_lng"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  isActive: boolean("is_active").default(true),
  capacity: real("capacity").default(50),
  currentPassengers: real("current_passengers").default(0)
});

export const routes = pgTable("routes", {
  id: varchar("id").primaryKey(),
  routeName: text("route_name").notNull(),
  stops: jsonb("stops").notNull(), // Array of stop objects {name, lat, lng, order}
  schedule: jsonb("schedule").notNull(), // Array of time objects
  isActive: boolean("is_active").default(true)
});

export const busStops = pgTable("bus_stops", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  routes: jsonb("routes").notNull() // Array of route IDs that use this stop
});

export const routeSuggestions = pgTable("route_suggestions", {
  id: varchar("id").primaryKey(),
  fromLocation: text("from_location").notNull(),
  toLocation: text("to_location").notNull(),
  directRoute: jsonb("direct_route"), // Bus route if direct connection exists
  connectingRoutes: jsonb("connecting_routes"), // Array of connecting route objects
  estimatedTime: real("estimated_time"), // in minutes
  createdAt: timestamp("created_at").defaultNow()
});

// Insert schemas
export const insertBusSchema = createInsertSchema(buses).omit({
  lastUpdated: true
});

export const insertRouteSchema = createInsertSchema(routes);

export const insertBusStopSchema = createInsertSchema(busStops);

export const insertRouteSuggestionSchema = createInsertSchema(routeSuggestions).omit({
  id: true,
  createdAt: true
});

// Types
export type Bus = typeof buses.$inferSelect;
export type InsertBus = z.infer<typeof insertBusSchema>;

export type Route = typeof routes.$inferSelect;
export type InsertRoute = z.infer<typeof insertRouteSchema>;

export type BusStop = typeof busStops.$inferSelect;
export type InsertBusStop = z.infer<typeof insertBusStopSchema>;

export type RouteSuggestion = typeof routeSuggestions.$inferSelect;
export type InsertRouteSuggestion = z.infer<typeof insertRouteSuggestionSchema>;

// Firebase-specific schemas for real-time data
export const busLocationSchema = z.object({
  busId: z.string(),
  busNumber: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  timestamp: z.number(),
  speed: z.number().optional(),
  heading: z.number().optional(),
  route: z.string()
});

export const routeSearchSchema = z.object({
  from: z.object({
    name: z.string(),
    latitude: z.number(),
    longitude: z.number()
  }),
  to: z.object({
    name: z.string(),
    latitude: z.number(),
    longitude: z.number()
  })
});

export type BusLocation = z.infer<typeof busLocationSchema>;
export type RouteSearch = z.infer<typeof routeSearchSchema>;
