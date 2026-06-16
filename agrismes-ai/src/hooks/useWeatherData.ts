import { useState, useEffect, useCallback } from "react";

interface WeatherCondition {
  temperature: number;
  humidity: number;
  description: string;
  rainfall: number;
  icon: "sunny" | "cloudy" | "rainy" | "stormy";
}

interface RegionWeather {
  region: string;
  country: string;
  weather: WeatherCondition;
  lastUpdated: Date;
}

interface UseWeatherDataReturn {
  weatherData: Record<string, RegionWeather>;
  isLoading: boolean;
  error: string | null;
  refreshWeather: () => Promise<void>;
  getWeatherForRegion: (region: string) => RegionWeather | null;
}

// Production zone coordinates for Open-Meteo API
const PRODUCTION_ZONES: Record<string, { lat: number; lon: number; country: string }> = {
  // Coffee regions
  "ethiopia_sidamo": { lat: 6.0, lon: 38.5, country: "Ethiopia" },
  "kenya_aa": { lat: -0.4, lon: 37.0, country: "Kenya" },
  "tanzania_kilimanjaro": { lat: -3.1, lon: 37.4, country: "Tanzania" },
  
  // Cashew regions
  "tanzania_mtwara": { lat: -10.3, lon: 40.2, country: "Tanzania" },
  "ivory_coast": { lat: 7.5, lon: -5.5, country: "Ivory Coast" },
  "benin": { lat: 9.3, lon: 2.3, country: "Benin" },
  
  // Cocoa regions
  "ghana_western": { lat: 5.5, lon: -2.5, country: "Ghana" },
  
  // Sesame regions
  "ethiopia_humera": { lat: 14.3, lon: 36.6, country: "Ethiopia" },
  "tanzania_dodoma": { lat: -6.2, lon: 35.8, country: "Tanzania" },
  
  // Avocado regions
  "kenya_muranga": { lat: -0.7, lon: 37.1, country: "Kenya" },
  
  // Macadamia regions
  "kenya_thika": { lat: -1.0, lon: 37.1, country: "Kenya" },
  "malawi": { lat: -13.3, lon: 33.8, country: "Malawi" },
};

// Cache duration: 30 minutes
const CACHE_DURATION = 30 * 60 * 1000;
const WEATHER_CACHE_KEY = "agrismes_weather_cache";

const getWeatherIcon = (weatherCode: number): "sunny" | "cloudy" | "rainy" | "stormy" => {
  if (weatherCode === 0 || weatherCode === 1) return "sunny";
  if (weatherCode >= 2 && weatherCode <= 3) return "cloudy";
  if (weatherCode >= 51 && weatherCode <= 67) return "rainy";
  if (weatherCode >= 80 && weatherCode <= 99) return "stormy";
  return "cloudy";
};

const getWeatherDescription = (weatherCode: number): string => {
  if (weatherCode === 0) return "Clear sky";
  if (weatherCode === 1) return "Mainly clear";
  if (weatherCode === 2) return "Partly cloudy";
  if (weatherCode === 3) return "Overcast";
  if (weatherCode >= 51 && weatherCode <= 55) return "Light drizzle";
  if (weatherCode >= 56 && weatherCode <= 57) return "Freezing drizzle";
  if (weatherCode >= 61 && weatherCode <= 65) return "Rain";
  if (weatherCode >= 66 && weatherCode <= 67) return "Freezing rain";
  if (weatherCode >= 80 && weatherCode <= 82) return "Rain showers";
  if (weatherCode >= 95 && weatherCode <= 99) return "Thunderstorm";
  return "Variable";
};

export function useWeatherData(): UseWeatherDataReturn {
  const [weatherData, setWeatherData] = useState<Record<string, RegionWeather>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load cached data on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(WEATHER_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          // Convert date strings back to Date objects
          const parsedData: Record<string, RegionWeather> = {};
          for (const [key, value] of Object.entries(data)) {
            const weather = value as RegionWeather;
            parsedData[key] = {
              ...weather,
              lastUpdated: new Date(weather.lastUpdated),
            };
          }
          setWeatherData(parsedData);
          return;
        }
      }
    } catch (e) {
      console.debug("[WeatherData] Failed to load cache:", e);
    }
    
    // Fetch fresh data
    fetchAllWeather();
  }, []);

  const fetchWeatherForZone = async (
    zoneId: string,
    coords: { lat: number; lon: number; country: string }
  ): Promise<RegionWeather | null> => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,weather_code,precipitation&timezone=auto`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      const current = data.current;
      
      const weatherCode = current.weather_code || 0;
      
      return {
        region: zoneId.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        country: coords.country,
        weather: {
          temperature: Math.round(current.temperature_2m),
          humidity: Math.round(current.relative_humidity_2m),
          description: getWeatherDescription(weatherCode),
          rainfall: current.precipitation || 0,
          icon: getWeatherIcon(weatherCode),
        },
        lastUpdated: new Date(),
      };
    } catch (e) {
      console.debug(`[WeatherData] Failed to fetch for ${zoneId}:`, e);
      return null;
    }
  };

  const fetchAllWeather = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch a subset of zones to avoid rate limiting
      const priorityZones = [
        "ethiopia_sidamo",
        "kenya_aa", 
        "tanzania_mtwara",
        "kenya_muranga",
        "ghana_western",
      ];
      
      const results = await Promise.all(
        priorityZones.map(async (zoneId) => {
          const coords = PRODUCTION_ZONES[zoneId];
          if (!coords) return null;
          const result = await fetchWeatherForZone(zoneId, coords);
          return result ? [zoneId, result] as const : null;
        })
      );
      
      const newData: Record<string, RegionWeather> = {};
      for (const result of results) {
        if (result) {
          newData[result[0]] = result[1];
        }
      }
      
      setWeatherData(newData);
      
      // Cache the results
      try {
        localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({
          data: newData,
          timestamp: Date.now(),
        }));
      } catch (e) {
        console.debug("[WeatherData] Failed to cache:", e);
      }
    } catch (e) {
      setError("Failed to fetch weather data");
      console.error("[WeatherData] Fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshWeather = useCallback(async () => {
    await fetchAllWeather();
  }, []);

  const getWeatherForRegion = useCallback((region: string): RegionWeather | null => {
    // Try exact match first
    if (weatherData[region]) return weatherData[region];
    
    // Try normalized search
    const normalized = region.toLowerCase().replace(/\s+/g, "_");
    if (weatherData[normalized]) return weatherData[normalized];
    
    // Try partial match
    for (const [key, value] of Object.entries(weatherData)) {
      if (key.includes(normalized) || normalized.includes(key)) {
        return value;
      }
    }
    
    return null;
  }, [weatherData]);

  return {
    weatherData,
    isLoading,
    error,
    refreshWeather,
    getWeatherForRegion,
  };
}
