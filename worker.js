const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-goog-api-key",
};

export default {
  async fetch(request, env, ctx) {
    // Handle preflight OPTIONS request
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Only POST allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user-provided Gemini API key from header or body
    let userApiKey = request.headers.get('x-goog-api-key');
    let reqBody = {};
    if (!userApiKey) {
      reqBody = await request.json();
      userApiKey = reqBody.userApiKey;
      delete reqBody.userApiKey;
    } else {
      reqBody = await request.json();
    }
    if (!userApiKey) {
      return new Response(JSON.stringify({ error: 'Missing Gemini API key' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Forward the request body to Gemini API using the user key
    const geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=' + userApiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody),
    });

    const geminiData = await geminiRes.json();
    return new Response(JSON.stringify(geminiData), {
      status: geminiRes.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  },
};
