import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const WEATHER_CACHE_KEY = "agrismes_global_weather_cache";
const LOCATION_CACHE_KEY = "agrismes_last_location";
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  rainProbability: number;
  weatherCode: number;
  isDay: boolean;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  humidity: number;
  rainProbability: number;
  weatherCode: number;
}

export interface DailyForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  rainProbability: number;
  weatherCode: number;
}

export interface LocationData {
  name: string;
  country: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
}

export interface GlobalWeatherState {
  current: WeatherData | null;
  hourlyForecast: HourlyForecast[];
  dailyForecast: DailyForecast[];
  location: LocationData | null;
  lastUpdated: Date | null;
  isLoading: boolean;
  error: string | null;
  isCached: boolean;
  locationDenied: boolean;
}

// Regional presets for Africa
export const AFRICAN_REGION_PRESETS: Record<string, { lat: number; lon: number; name: string; country: string; countryCode: string }> = {
  "east-africa": { lat: -6.1659, lon: 35.7516, name: "Dodoma", country: "Tanzania", countryCode: "TZ" },
  "west-africa": { lat: 6.5244, lon: 3.3792, name: "Lagos", country: "Nigeria", countryCode: "NG" },
  "southern-africa": { lat: -25.7479, lon: 28.2293, name: "Pretoria", country: "South Africa", countryCode: "ZA" },
  "central-africa": { lat: -4.4419, lon: 15.2663, name: "Kinshasa", country: "DR Congo", countryCode: "CD" },
};

// Country code to currency mapping
export const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  TZ: "TZS", // Tanzania
  KE: "KES", // Kenya
  UG: "UGX", // Uganda
  NG: "NGN", // Nigeria
  GH: "GHS", // Ghana
  ZA: "ZAR", // South Africa
  CI: "XOF", // Ivory Coast
  ET: "ETB", // Ethiopia
  BJ: "XOF", // Benin
  CD: "CDF", // DR Congo
  US: "USD", // USA
  GB: "GBP", // UK
  CA: "CAD", // Canada
  AE: "AED", // UAE
  EU: "EUR", // Europe
  DE: "EUR", // Germany
  FR: "EUR", // France
  IT: "EUR", // Italy
  ES: "EUR", // Spain
  IN: "INR", // India
  CN: "CNY", // China
};

function getWeatherDescription(code: number): string {
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code <= 49) return "Foggy";
  if (code <= 69) return "Rainy";
  if (code <= 79) return "Snowy";
  if (code <= 99) return "Thunderstorm";
  return "Unknown";
}

function getWeatherIcon(code: number, isDay: boolean): string {
  if (code === 0) return isDay ? "☀️" : "🌙";
  if (code <= 3) return isDay ? "⛅" : "☁️";
  if (code <= 49) return "🌫️";
  if (code <= 59) return "🌧️";
  if (code <= 69) return "🌧️";
  if (code <= 79) return "❄️";
  if (code <= 99) return "⛈️";
  return "🌡️";
}

export function useGlobalWeather() {
  const [state, setState] = useState<GlobalWeatherState>({
    current: null,
    hourlyForecast: [],
    dailyForecast: [],
    location: null,
    lastUpdated: null,
    isLoading: true,
    error: null,
    isCached: false,
    locationDenied: false,
  });

  type GlobalWeatherApiResponse = {
    success: boolean;
    error?: string;
    location: LocationData;
    locationSource?: string;
    current: WeatherData;
    hourlyForecast: HourlyForecast[];
    dailyForecast: DailyForecast[];
    fetchedAt?: string;
  };

  const writeCache = useCallback((newState: GlobalWeatherState) => {
    localStorage.setItem(
      WEATHER_CACHE_KEY,
      JSON.stringify({
        ...newState,
        lastUpdated: newState.lastUpdated?.toISOString(),
      })
    );
    if (newState.location) localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(newState.location));
  }, []);

  const applyApiPayload = useCallback(
    (payload: GlobalWeatherApiResponse, opts?: { locationDenied?: boolean }) => {
      const newState: GlobalWeatherState = {
        current: payload.current,
        hourlyForecast: payload.hourlyForecast,
        dailyForecast: payload.dailyForecast,
        location: payload.location,
        lastUpdated: new Date(payload.fetchedAt || Date.now()),
        isLoading: false,
        error: null,
        isCached: false,
        locationDenied: opts?.locationDenied ?? false,
      };

      writeCache(newState);
      setState(newState);
    },
    [writeCache]
  );

  const useCachedIfAvailable = useCallback((message: string) => {
    const cached = localStorage.getItem(WEATHER_CACHE_KEY);
    if (!cached) return false;
    try {
      const parsedCache = JSON.parse(cached);
      setState({
        ...parsedCache,
        lastUpdated: parsedCache.lastUpdated ? new Date(parsedCache.lastUpdated) : null,
        isLoading: false,
        error: message,
        isCached: true,
        locationDenied: parsedCache.locationDenied || false,
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  const invokeGlobalWeather = useCallback(async (body: { lat?: number; lon?: number }) => {
    const { data, error } = await supabase.functions.invoke("global-weather", { body });
    if (error) throw new Error(error.message);
    return data as GlobalWeatherApiResponse;
  }, []);

  const fetchWeatherByCoords = useCallback(
    async (lat: number, lon: number, opts?: { locationDenied?: boolean }) => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        const payload = await invokeGlobalWeather({ lat, lon });
        if (!payload?.success) throw new Error(payload?.error || "Failed to fetch weather");
        applyApiPayload(payload, opts);
      } catch (error) {
        console.error("Weather fetch error:", error);
        if (!useCachedIfAvailable("Using cached data")) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: error instanceof Error ? error.message : "Failed to fetch weather",
          }));
        }
      }
    },
    [applyApiPayload, invokeGlobalWeather, useCachedIfAvailable]
  );

  const fetchWeatherByIp = useCallback(
    async (opts?: { locationDenied?: boolean }) => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        const payload = await invokeGlobalWeather({});
        if (!payload?.success) throw new Error(payload?.error || "Failed to fetch weather");
        applyApiPayload(payload, opts);
      } catch (error) {
        console.error("Weather fetch error:", error);
        if (!useCachedIfAvailable("Using cached data")) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: error instanceof Error ? error.message : "Failed to fetch weather",
          }));
        }
      }
    },
    [applyApiPayload, invokeGlobalWeather, useCachedIfAvailable]
  );

  const searchCity = useCallback(async (query: string): Promise<LocationData[]> => {
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
      );
      if (!response.ok) return [];
      
      const data = await response.json();
      if (!data.results) return [];

      return data.results.map((r: any) => ({
        name: r.name,
        country: r.country || "",
        countryCode: r.country_code?.toUpperCase() || "",
        latitude: r.latitude,
        longitude: r.longitude,
      }));
    } catch {
      return [];
    }
  }, []);

  const useMyLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: "Geolocation not supported", locationDenied: true }));
      // Fall back to IP-based detection
      await fetchWeatherByIp({ locationDenied: true });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, locationDenied: false }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        await fetchWeatherByCoords(latitude, longitude);
      },
      (error) => {
        console.log("Geolocation error:", error.code, error.message);
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: "Location access denied", 
          locationDenied: true,
        }));
        // Fall back to IP-based detection (keeps app usable even when location is denied)
        fetchWeatherByIp({ locationDenied: true });
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  }, [fetchWeatherByCoords, fetchWeatherByIp]);

  const selectRegion = useCallback(async (regionId: string) => {
    const region = AFRICAN_REGION_PRESETS[regionId];
    if (region) {
      await fetchWeatherByCoords(region.lat, region.lon);
    }
  }, [fetchWeatherByCoords]);

  const selectLocation = useCallback(async (location: LocationData) => {
    await fetchWeatherByCoords(location.latitude, location.longitude);
  }, [fetchWeatherByCoords]);

  const refresh = useCallback(async () => {
    if (state.location) {
      await fetchWeatherByCoords(state.location.latitude, state.location.longitude);
    }
  }, [state.location, fetchWeatherByCoords]);

  // Load cached data or try auto-detection on mount
  useEffect(() => {
    const loadInitialData = async () => {
      // Check cache first
      const cached = localStorage.getItem(WEATHER_CACHE_KEY);
      const lastLocation = localStorage.getItem(LOCATION_CACHE_KEY);

      if (cached) {
        try {
          const parsedCache = JSON.parse(cached);
          const cacheTime = new Date(parsedCache.lastUpdated).getTime();
          const now = Date.now();

          if (now - cacheTime < CACHE_DURATION && parsedCache.current) {
            setState({
              ...parsedCache,
              lastUpdated: new Date(parsedCache.lastUpdated),
              isLoading: false,
              isCached: true,
              locationDenied: parsedCache.locationDenied || false,
            });
            return;
          }
        } catch (e) {
          console.log("Cache parse error:", e);
          localStorage.removeItem(WEATHER_CACHE_KEY);
        }
      }

      // If we have a last location, use it to refresh
      if (lastLocation) {
        try {
          const location = JSON.parse(lastLocation);
          await fetchWeatherByCoords(location.latitude, location.longitude);
          return;
        } catch (e) {
          console.log("Last location parse error:", e);
          localStorage.removeItem(LOCATION_CACHE_KEY);
        }
      }

      // No cache or last location - use backend IP-based detection
      await fetchWeatherByIp();
    };

    loadInitialData();
  }, [fetchWeatherByCoords, fetchWeatherByIp]);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.location) {
        refresh();
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [state.location, refresh]);

  return {
    ...state,
    searchCity,
    useMyLocation,
    selectRegion,
    selectLocation,
    refresh,
    getWeatherDescription,
    getWeatherIcon,
  };
}
