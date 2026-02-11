import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;

async function checkRateLimit(clientIp: string): Promise<boolean> {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);

    // Try to get existing record
    const { data } = await supabase
      .from("rate_limits")
      .select("request_count, window_start")
      .eq("client_ip", clientIp)
      .eq("function_name", "why-this-place")
      .single();

    if (!data) {
      // First request - create record
      await supabase.from("rate_limits").upsert({
        client_ip: clientIp,
        function_name: "why-this-place",
        request_count: 1,
        window_start: now.toISOString(),
      }, { onConflict: "client_ip,function_name" });
      return true;
    }

    const recordWindowStart = new Date(data.window_start);

    if (recordWindowStart < windowStart) {
      // Window expired - reset
      await supabase
        .from("rate_limits")
        .update({ request_count: 1, window_start: now.toISOString() })
        .eq("client_ip", clientIp)
        .eq("function_name", "why-this-place");
      return true;
    }

    if (data.request_count >= MAX_REQUESTS_PER_WINDOW) {
      return false; // Rate limited
    }

    // Increment counter
    await supabase
      .from("rate_limits")
      .update({ request_count: data.request_count + 1 })
      .eq("client_ip", clientIp)
      .eq("function_name", "why-this-place");
    return true;
  } catch (e) {
    console.error("Rate limit check failed:", e);
    return true; // Allow on error to avoid blocking legitimate requests
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Rate limiting
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const allowed = await checkRateLimit(clientIp);
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Too many requests. Please wait a moment." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { place, mood, userContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a friendly, concise place recommendation assistant for a dining/cafe discovery app. 
Given a place's details and the user's current mood, generate a short, compelling "Why this place?" explanation.

Rules:
- Keep it to 1-2 sentences max (under 40 words)
- Be specific about what makes this place great for the user's mood
- Use a warm, conversational tone
- Mention specific attributes like distance, rating, cuisine, price if relevant
- Don't use generic phrases like "great choice" - be specific
- If mood is provided, tailor the explanation to that mood`;

    const placeInfo = `Place: ${place.name}
Category: ${place.category}
Distance: ${place.distance}m
${place.rating ? `Rating: ${place.rating}/5` : ''}
${place.priceLevel ? `Price: ${'₹'.repeat(place.priceLevel)}` : ''}
${place.cuisineType ? `Cuisine: ${place.cuisineType}` : ''}
${place.isOpen !== undefined ? `Status: ${place.isOpen ? 'Open now' : 'Closed'}` : ''}
${place.address ? `Address: ${place.address}` : ''}`;

    const userPrompt = `${placeInfo}
${mood ? `\nUser's mood: ${mood}` : ''}
${userContext ? `\nAdditional context: ${userContext}` : ''}

Generate a "Why this place?" explanation.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 100,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const explanation = data.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ explanation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("why-this-place error:", e);
    return new Response(JSON.stringify({ error: "Unable to generate explanation. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
