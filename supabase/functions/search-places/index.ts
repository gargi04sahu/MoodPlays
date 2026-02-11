/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map mood categories to OSM amenity types (food & drink focused)
const categoryMapping: Record<string, string[]> = {
  // Cafes & Coffee
  "cafe": ["cafe"],
  "coffee_shop": ["cafe"],
  // Restaurants
  "restaurant": ["restaurant"],
  "fast_food": ["fast_food"],
  // Bars & Pubs
  "bar": ["bar", "pub"],
  "pub": ["pub", "bar"],
  // Default - all food & drink
  "default": ["restaurant", "cafe", "bar", "fast_food", "pub"],
};

// Multiple Overpass API endpoints for fallback
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function queryOverpass(query: string): Promise<any> {
  const body = `data=${encodeURIComponent(query)}`;
  
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      console.log(`Trying Overpass endpoint: ${endpoint}`);
      const response = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      }, 15000); // 15 second timeout per endpoint
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Success from ${endpoint}, got ${data.elements?.length || 0} elements`);
        return data;
      }
      console.log(`Endpoint ${endpoint} returned status ${response.status}`);
    } catch (error) {
      console.log(`Endpoint ${endpoint} failed:`, error instanceof Error ? error.message : error);
    }
  }
  
  throw new Error("All Overpass API endpoints failed");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { latitude, longitude, categories = [], radius = 5000 } = body;

    // Validate latitude
    if (typeof latitude !== 'number' || !isFinite(latitude) || latitude < -90 || latitude > 90) {
      return new Response(
        JSON.stringify({ error: 'Invalid latitude. Must be a number between -90 and 90.', results: [] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate longitude
    if (typeof longitude !== 'number' || !isFinite(longitude) || longitude < -180 || longitude > 180) {
      return new Response(
        JSON.stringify({ error: 'Invalid longitude. Must be a number between -180 and 180.', results: [] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate radius
    const validRadius = typeof radius === 'number' && isFinite(radius) ? Math.max(100, Math.min(radius, 50000)) : 5000;

    // Validate categories
    if (!Array.isArray(categories) || categories.some((cat: unknown) => typeof cat !== 'string' || cat.length > 50)) {
      return new Response(
        JSON.stringify({ error: 'Categories must be an array of strings (max 50 chars each).', results: [] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Searching places at ${latitude}, ${longitude} with radius ${validRadius}`);

    // Build OSM amenity types from categories
    let amenityTypes: string[] = [];
    if (categories.length > 0) {
      categories.forEach((cat: string) => {
        const types = categoryMapping[cat] || categoryMapping["default"];
        amenityTypes = [...amenityTypes, ...types];
      });
    } else {
      amenityTypes = categoryMapping["default"];
    }
    
    // Remove duplicates
    amenityTypes = [...new Set(amenityTypes)];
    console.log(`Searching for amenity types: ${amenityTypes.join(", ")}`);

    // Build simpler Overpass query for better performance
    const amenityFilter = amenityTypes.map(t => `node["amenity"="${t}"](around:${validRadius},${latitude},${longitude});`).join("\n");
    
    const overpassQuery = `
      [out:json][timeout:15];
      (
        ${amenityFilter}
      );
      out body 25;
    `;

    const data = await queryOverpass(overpassQuery);

    // Transform OSM data to our format
    const results = data.elements
      .filter((el: any) => el.tags?.name)
      .slice(0, 20)
      .map((el: any) => ({
        id: `osm-${el.id}`,
        name: el.tags.name,
        category: el.tags.amenity || el.tags.tourism || el.tags.leisure || "Place",
        latitude: el.lat,
        longitude: el.lon,
        address: [el.tags["addr:street"], el.tags["addr:city"]].filter(Boolean).join(", ") || null,
        phone: el.tags.phone || null,
        website: el.tags.website || null,
        cuisine: el.tags.cuisine || null,
        opening_hours: el.tags.opening_hours || null,
      }));

    console.log(`Returning ${results.length} places`);

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in search-places function:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, results: [] }),
      {
        status: 200, // Return 200 with empty results to trigger fallback
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
