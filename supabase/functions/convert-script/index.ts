import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { text, languagePair } = await req.json();
    
    if (!text || !languagePair) {
      return new Response(
        JSON.stringify({ error: 'Text and language pair are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY environment variable not found');
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const systemPrompts: Record<string, string> = {
      'benglish-bangla': 'Convert Bengali words written in English/Latin letters into proper Bangla script. DO NOT translate English words - keep them as-is. Only convert Bengali words.',
      'hinglish-hindi': 'Convert Hindi words written in English/Latin letters into proper Devanagari/Hindi script. DO NOT translate English words - keep them as-is. Only convert Hindi words.',
      'benglish-english': 'Translate Benglish (Bengali in English/Latin letters) into proper English translation.',
      'hinglish-english': 'Translate Hinglish (Hindi in English/Latin letters) into proper English translation.'
    };

    const systemPrompt = systemPrompts[languagePair] || systemPrompts['benglish-bangla'];

    const requestBody = {
      contents: [{
        parts: [{
          text: `${systemPrompt}\n\nConvert: ${text}`
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('API Error:', response.status, responseData);
      return new Response(
        JSON.stringify({ error: `API Error: ${responseData?.error?.message || 'Unknown error'}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const convertedText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!convertedText) {
      console.error('No text in response:', responseData);
      return new Response(
        JSON.stringify({ error: 'No response from API' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(
      JSON.stringify({ convertedText }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});