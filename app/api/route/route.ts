import { NextResponse } from "next/server";

type RouteRequestBody = {
  start: [number, number]; // [lng, lat]
  end: [number, number];   // [lng, lat]
  mode?: "foot-walking" | "driving-car";
};

export async function POST(req: Request) {
  try {
    const body: RouteRequestBody = await req.json();
    const { start, end, mode = "driving-car" } = body;

    if (!start || !end || !Array.isArray(start) || !Array.isArray(end) || start.length < 2 || end.length < 2) {
      return NextResponse.json({ ok: false, error: "Invalid start or end coordinates" }, { status: 400 });
    }

    const [startLng, startLat] = start;
    const [endLng, endLat] = end;

    if (!Number.isFinite(startLng) || !Number.isFinite(startLat) || !Number.isFinite(endLng) || !Number.isFinite(endLat)) {
      return NextResponse.json({ ok: false, error: "Non-finite coordinates" }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTESERVICE_API_KEY;
    const profile = mode === "foot-walking" ? "foot-walking" : "driving-car";

    // 1. Try OpenRouteService if API key is provided
    if (apiKey) {
      try {
        const orsRes = await fetch(`https://api.openrouteservice.org/v2/directions/${profile}/geojson`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: apiKey,
          },
          body: JSON.stringify({
            coordinates: [
              [startLng, startLat],
              [endLng, endLat],
            ],
          }),
        });

        if (orsRes.ok) {
          const geoJson = await orsRes.json();
          const coords = geoJson?.features?.[0]?.geometry?.coordinates;
          if (Array.isArray(coords) && coords.length > 0) {
            return NextResponse.json({ ok: true, source: "ors", coordinates: coords });
          }
        }
      } catch {
        // Fallback to OSRM if ORS call fails
      }
    }

    // 2. Fallback to public OSRM API (or OSM router) if ORS key is not set or failed
    try {
      const osrmProfile = profile === "foot-walking" ? "foot" : "driving";
      const osrmUrl = osrmProfile === "foot"
        ? `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`
        : `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;

      const osrmRes = await fetch(osrmUrl, { signal: AbortSignal.timeout(4000) });
      if (osrmRes.ok) {
        const data = await osrmRes.json();
        const coords = data?.routes?.[0]?.geometry?.coordinates;
        if (Array.isArray(coords) && coords.length > 0) {
          return NextResponse.json({ ok: true, source: "osrm", coordinates: coords });
        }
      }
    } catch {
      // Fallback failed
    }

    return NextResponse.json({ ok: false, error: "Routing service unavailable" }, { status: 502 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
