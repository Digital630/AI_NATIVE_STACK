import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type GlobalWeatherRequestBody = {
  lat?: number;
  lon?: number;
};

type LocationPayload = {
  name: string;
  country: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
};

// Very small in-memory cache (best-effort)
const cache: Record<string, { payload: unknown; ts: number }> = {};
const CACHE_MS = 60_000;

function getClientIp(req: Request): string | null {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || null;
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    null
  );
}

async function resolveLocationFromIp(ip: string | null): Promise<{ location: LocationPayload; source: string }> {
  // Default fallback if IP is unavailable or lookup fails
  const fallback: LocationPayload = {
    name: "Dodoma",
    country: "Tanzania",
    countryCode: "TZ",
    latitude: -6.1659,
    longitude: 35.7516,
  };

  if (!ip) return { location: fallback, source: "fallback" };

  try {
    const resp = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}?fields=success,latitude,longitude,city,country,country_code`);
    if (!resp.ok) return { location: fallback, source: "fallback" };
    const data = await resp.json();
    if (!data?.success || typeof data.latitude !== "number" || typeof data.longitude !== "number") {
      return { location: fallback, source: "fallback" };
    }

    return {
      source: "ip",
      location: {
        name: data.city || "Your Location",
        country: data.country || "",
        countryCode: (data.country_code || "").toUpperCase(),
        latitude: data.latitude,
        longitude: data.longitude,
      },
    };
  } catch {
    return { location: fallback, source: "fallback" };
  }
}

async function reverseGeocode(lat: number, lon: number): Promise<Pick<LocationPayload, "name" | "country" | "countryCode"> | null> {
  try {
    const resp = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    return {
      name: data.city || data.locality || "My Location",
      country: data.countryName || "",
      countryCode: (data.countryCode || "").toUpperCase(),
    };
  } catch {
    return null;
  }
}

async function fetchOpenMeteo(lat: number, lon: number) {
  const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");
  weatherUrl.searchParams.set("latitude", String(lat));
  weatherUrl.searchParams.set("longitude", String(lon));
  weatherUrl.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m,is_day"
  );
  weatherUrl.searchParams.set(
    "hourly",
    "temperature_2m,relative_humidity_2m,precipitation_probability,weather_code"
  );
  weatherUrl.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code"
  );
  weatherUrl.searchParams.set("timezone", "auto");
  weatherUrl.searchParams.set("forecast_days", "3");

  const resp = await fetch(weatherUrl);
  if (!resp.ok) throw new Error("Failed to fetch weather data");
  return await resp.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as GlobalWeatherRequestBody;

    let location: LocationPayload;
    let locationSource = "ip";

    if (typeof body.lat === "number" && typeof body.lon === "number") {
      const reverse = await reverseGeocode(body.lat, body.lon);
      location = {
        name: reverse?.name || "My Location",
        country: reverse?.country || "",
        countryCode: reverse?.countryCode || "",
        latitude: body.lat,
        longitude: body.lon,
      };
      locationSource = "geolocation";
    } else {
      const ip = getClientIp(req);
      const resolved = await resolveLocationFromIp(ip);
      location = resolved.location;
      locationSource = resolved.source;
    }

    const cacheKey = `${Math.round(location.latitude * 1000)}/${Math.round(location.longitude * 1000)}`;
    const cached = cache[cacheKey];
    if (cached && Date.now() - cached.ts < CACHE_MS) {
      return new Response(JSON.stringify(cached.payload), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await fetchOpenMeteo(location.latitude, location.longitude);

    const current = {
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      windDirection: data.current.wind_direction_10m,
      rainProbability: data.current.precipitation_probability || 0,
      weatherCode: data.current.weather_code,
      isDay: data.current.is_day === 1,
    };

    const hourlyForecast = (data.hourly.time || []).slice(0, 24).map((time: string, i: number) => ({
      time,
      temperature: data.hourly.temperature_2m[i],
      humidity: data.hourly.relative_humidity_2m[i],
      rainProbability: data.hourly.precipitation_probability[i] || 0,
      weatherCode: data.hourly.weather_code[i],
    }));

    const dailyForecast = (data.daily.time || []).map((date: string, i: number) => ({
      date,
      tempMax: data.daily.temperature_2m_max[i],
      tempMin: data.daily.temperature_2m_min[i],
      rainProbability: data.daily.precipitation_probability_max[i] || 0,
      weatherCode: data.daily.weather_code[i],
    }));

    const payload = {
      success: true,
      location,
      locationSource,
      current,
      hourlyForecast,
      dailyForecast,
      fetchedAt: new Date().toISOString(),
    };

    cache[cacheKey] = { payload, ts: Date.now() };

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("global-weather error:", err);
    return new Response(JSON.stringify({ success: false, error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
