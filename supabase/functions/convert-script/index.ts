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
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    console.log('GEMINI_API_KEY exists:', !!GEMINI_API_KEY);
    console.log('Text:', text?.substring(0, 50));
    console.log('Language pair:', languagePair);

    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not found in environment');
      throw new Error('GEMINI_API_KEY is not configured');
    }

    if (!text || !languagePair) {
      throw new Error('Text and language pair are required');
    }

    const systemPrompts: Record<string, string> = {
      'benglish-bangla': `You are a Benglish to Bangla script converter. Convert Bengali words written in English/Latin letters into proper Bangla script. DO NOT translate English words - keep them as-is. Only convert Bengali words that are written using English letters into Bangla script. Preserve all punctuation, tone, structure, and formatting exactly as given. Handle informal, poetic, or conversational text naturally.`,
      'hinglish-hindi': `You are a Hinglish to Hindi script converter. Convert Hindi words written in English/Latin letters into proper Devanagari/Hindi script. DO NOT translate English words - keep them as-is. Only convert Hindi words that are written using English letters into Hindi script. Preserve all punctuation, tone, structure, and formatting exactly as given. Handle informal, poetic, or conversational text naturally.`,
      'benglish-english': `You are a Benglish to English translator. Convert Bengali words written in English/Latin letters into proper formal English translation. Translate the complete meaning accurately while maintaining the tone and context. Preserve formatting. If there are actual English words mixed in, keep them as they are.`,
      'hinglish-english': `You are a Hinglish to English translator. Convert Hindi words written in English/Latin letters into proper formal English translation. Translate the complete meaning accurately while maintaining the tone and context. Preserve formatting. If there are actual English words mixed in, keep them as they are.`
    };

    const systemPrompt = systemPrompts[languagePair] || systemPrompts['benglish-bangla'];

    const requestBody = {
      contents: [{
        parts: [{
          text: `${systemPrompt}\n\nConvert this text:\n${text}`
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
      }
    };

    console.log('Calling Gemini API...');
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    console.log('Gemini response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', JSON.stringify(errorData));
      throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('Gemini response received');
    
    const convertedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!convertedText) {
      console.error('No text in response:', JSON.stringify(data));
      throw new Error('No converted text received from API');
    }

    return new Response(
      JSON.stringify({ convertedText }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error in convert-script function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});