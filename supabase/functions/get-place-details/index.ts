/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Unsplash Source URLs for free stock photos (no API key needed)
const PHOTO_QUERIES: Record<string, string[]> = {
  restaurant: ["restaurant interior", "indian food platter", "restaurant ambience", "food menu"],
  cafe: ["cafe interior", "coffee shop", "cafe ambience", "latte art"],
  bar: ["bar interior", "cocktail drinks", "bar ambience", "pub"],
  fast_food: ["fast food restaurant", "burger and fries", "street food india", "food counter"],
  default: ["restaurant food", "dining ambience", "food plating", "cafe interior"],
};

function getPhotoUrls(category: string, cuisine?: string): string[] {
  const categoryKey = category?.toLowerCase().replace(/\s+/g, "_") || "default";
  const queries = PHOTO_QUERIES[categoryKey] || PHOTO_QUERIES.default;
  
  // Add cuisine-specific photos if available
  const cuisineQueries: string[] = [];
  if (cuisine) {
    const cuisineLower = cuisine.toLowerCase();
    if (cuisineLower.includes("indian") || cuisineLower.includes("mughlai")) {
      cuisineQueries.push("indian food thali", "indian restaurant");
    } else if (cuisineLower.includes("chinese")) {
      cuisineQueries.push("chinese food", "noodles dish");
    } else if (cuisineLower.includes("pizza")) {
      cuisineQueries.push("pizza restaurant", "italian pizza");
    } else if (cuisineLower.includes("coffee") || cuisineLower.includes("cafe")) {
      cuisineQueries.push("coffee beans", "cafe latte");
    }
  }
  
  const allQueries = [...new Set([...queries, ...cuisineQueries])].slice(0, 5);
  
  // Use Unsplash Source for random photos (free, no API key)
  return allQueries.map((query, index) => {
    const seed = `${category}-${cuisine}-${index}`;
    return `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}&sig=${seed}`;
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { placeId, placeData } = await req.json();

    if (!placeId) {
      throw new Error("Place ID is required");
    }

    console.log("Fetching details for place:", placeId);
    
    // Get category and cuisine for photo fetching
    const category = placeData?.category || "restaurant";
    const cuisine = placeData?.cuisineType || placeData?.cuisine || null;

    // Check if this is an OSM ID (format: osm-{nodeId})
    if (placeId.startsWith("osm-")) {
      const osmId = placeId.replace("osm-", "");
      
      // Try to fetch from OSM API
      const osmUrl = `https://api.openstreetmap.org/api/0.6/node/${osmId}.json`;
      console.log("Fetching from OSM:", osmUrl);
      
      try {
        const osmRes = await fetch(osmUrl, {
          headers: {
            "User-Agent": "MoodPlaces/1.0",
            "Accept": "application/json",
          },
        });

        if (osmRes.ok) {
          const osmData = await osmRes.json();
          const element = osmData.elements?.[0];
          const tags = element?.tags || {};

          console.log("Successfully fetched OSM data for:", tags.name || placeId);

          // Build details from OSM tags
          const details = {
            fsq_id: placeId,
            name: tags.name || placeData?.name || "Unknown Place",
            categories: [{ name: tags.amenity || tags.cuisine || placeData?.category || "Place" }],
            geocodes: {
              main: {
                latitude: element?.lat || placeData?.latitude,
                longitude: element?.lon || placeData?.longitude,
              },
            },
            location: {
              formatted_address: formatAddress(tags, placeData),
              locality: tags["addr:city"] || "",
              region: tags["addr:state"] || "",
              postcode: tags["addr:postcode"] || "",
              country: tags["addr:country"] || "India",
            },
            hours: parseOsmHours(tags.opening_hours),
            rating: placeData?.rating || generateRandomRating(),
            price: tags.price_level || placeData?.priceLevel || 2,
            tel: tags.phone || tags["contact:phone"] || placeData?.phone || null,
            website: tags.website || tags["contact:website"] || placeData?.website || null,
            description: tags.description || tags.note || generateDescription(tags, placeData),
          };

          // Generate photos based on category and cuisine
          const photos = getPhotoUrls(category, cuisine);

          return new Response(
            JSON.stringify({
              details,
              photos,
              tips: generateTips(tags, placeData),
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      } catch (osmError) {
        console.log("OSM API failed, using fallback:", osmError);
      }

      // Fallback: use provided placeData if OSM fetch fails
      if (placeData) {
        console.log("Using provided place data as fallback");
        
        const details = {
          fsq_id: placeId,
          name: placeData.name || "Unknown Place",
          categories: [{ name: placeData.category || "Restaurant" }],
          geocodes: {
            main: {
              latitude: placeData.latitude,
              longitude: placeData.longitude,
            },
          },
          location: {
            formatted_address: placeData.address || "Address not available",
            locality: "",
            region: "",
            postcode: "",
            country: "India",
          },
          hours: parseOsmHours(placeData.openingHours),
          rating: placeData.rating || generateRandomRating(),
          price: placeData.priceLevel || 2,
          tel: placeData.phone || null,
          website: placeData.website || null,
          description: generateDescription({}, placeData),
        };

        // Generate photos based on category and cuisine
        const photos = getPhotoUrls(category, cuisine);

        return new Response(
          JSON.stringify({
            details,
            photos,
            tips: generateTips({}, placeData),
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // If we reach here, we couldn't get details
    throw new Error("Unable to fetch place details");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in get-place-details function:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function formatAddress(tags: Record<string, string>, placeData?: any): string {
  const parts = [];
  if (tags["addr:street"]) {
    if (tags["addr:housenumber"]) {
      parts.push(`${tags["addr:housenumber"]} ${tags["addr:street"]}`);
    } else {
      parts.push(tags["addr:street"]);
    }
  }
  if (tags["addr:city"]) parts.push(tags["addr:city"]);
  if (tags["addr:state"]) parts.push(tags["addr:state"]);
  if (tags["addr:postcode"]) parts.push(tags["addr:postcode"]);
  
  if (parts.length > 0) return parts.join(", ");
  if (placeData?.address) return placeData.address;
  return "Address not available";
}

function parseOsmHours(hoursString?: string): { display?: string; regular?: any[] } | null {
  if (!hoursString) return null;
  
  return {
    display: hoursString,
    regular: [],
  };
}

function generateRandomRating(): number {
  return Math.round((3.5 + Math.random() * 1.5) * 10) / 10;
}

function generateDescription(tags: Record<string, string>, placeData?: any): string {
  const category = tags.amenity || tags.cuisine || placeData?.category || "place";
  const name = tags.name || placeData?.name || "This place";
  
  const descriptions = [
    `${name} is a popular ${category} known for its welcoming atmosphere and quality service.`,
    `A well-regarded ${category} that locals love to visit for a great experience.`,
    `${name} offers a wonderful ${category} experience with attentive service.`,
  ];
  
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

function generateTips(tags: Record<string, string>, placeData?: any): any[] {
  const tips = [];
  const category = tags.amenity || placeData?.category || "restaurant";
  
  if (tags.cuisine || placeData?.cuisineType) {
    tips.push({
      text: `Great for ${tags.cuisine || placeData?.cuisineType} cuisine lovers!`,
      created_at: new Date().toISOString(),
    });
  }
  
  if (category === "restaurant" || category === "cafe") {
    tips.push({
      text: "The ambiance here is really nice. Perfect for a relaxed meal.",
      created_at: new Date().toISOString(),
    });
  }
  
  if (tags.outdoor_seating === "yes") {
    tips.push({
      text: "They have outdoor seating available - great on nice days!",
      created_at: new Date().toISOString(),
    });
  }
  
  return tips;
}
