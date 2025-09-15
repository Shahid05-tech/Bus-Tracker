import { Clock, MapPin, Wifi, WifiOff } from "lucide-react";

interface RouteCardProps {
  busNumber: string;
  routeType: 'direct' | 'transfer' | 'alternative';
  duration: string;
  route: string;
  nextArrival: string;
  isLiveTracking: boolean;
  transferTime?: string;
  onClick?: () => void;
}

export default function RouteCard({
  busNumber,
  routeType,
  duration,
  route,
  nextArrival,
  isLiveTracking,
  transferTime,
  onClick
}: RouteCardProps) {
  const getRouteTypeDisplay = () => {
    switch (routeType) {
      case 'direct':
        return <span className="text-green-600 text-xs font-medium">Direct Route</span>;
      case 'transfer':
        return <span className="text-orange-600 text-xs font-medium">1 Transfer</span>;
      case 'alternative':
        return <span className="text-blue-600 text-xs font-medium">Alternative</span>;
      default:
        return null;
    }
  };

  const getBusNumberDisplay = () => {
    if (routeType === 'transfer') {
      const buses = busNumber.split(',');
      return (
        <div className="flex items-center space-x-2">
          {buses.map((bus, index) => (
            <span key={index} className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm font-semibold">
              Bus {bus.trim()}
            </span>
          ))}
        </div>
      );
    }
    
    return (
      <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-sm font-semibold">
        Bus {busNumber}
      </span>
    );
  };

  return (
    <div 
      className="mb-4 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
      onClick={onClick}
      data-testid={`card-route-${busNumber.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getBusNumberDisplay()}
          {getRouteTypeDisplay()}
        </div>
        <span className="text-sm font-semibold text-foreground">{duration}</span>
      </div>
      
      <div className="text-sm text-muted-foreground mb-2">
        <MapPin className="inline h-3 w-3 mr-1" />
        {route}
      </div>
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          {transferTime ? `Transfer time: ${transferTime}` : `Next arrival: ${nextArrival}`}
        </span>
        <span className="flex items-center">
          {isLiveTracking ? (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
              <Wifi className="h-3 w-3 mr-1" />
              Live tracking
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 mr-1" />
              <span className="text-red-500">No live data</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
}
