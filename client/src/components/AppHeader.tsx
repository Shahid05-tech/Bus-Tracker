import { Bus, Settings } from "lucide-react";

export default function AppHeader() {
  return (
    <header className="bg-background border-b border-border shadow-sm relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <Bus className="h-8 w-8 text-foreground" />
            <h1 className="text-xl font-semibold text-foreground">BusTracker</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
              Live Tracking Active
            </span>
            <button 
              className="p-2 rounded-md hover:bg-secondary transition-colors"
              data-testid="button-settings"
            >
              <Settings className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
