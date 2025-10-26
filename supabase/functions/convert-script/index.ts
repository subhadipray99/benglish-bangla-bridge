import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, languagePair } = await req.json();
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    if (!text || !languagePair) {
      throw new Error('Text and language pair are required');
    }

    const systemPrompts = {
      'benglish-bangla': `You are a Benglish to Bangla script converter. Convert Bengali words written in English/Latin letters into proper Bangla script. DO NOT translate English words - keep them as-is. Only convert Bengali words that are written using English letters into Bangla script. Preserve all punctuation, tone, structure, and formatting exactly as given. Handle informal, poetic, or conversational text naturally.`,
      'hinglish-hindi': `You are a Hinglish to Hindi script converter. Convert Hindi words written in English/Latin letters into proper Devanagari/Hindi script. DO NOT translate English words - keep them as-is. Only convert Hindi words that are written using English letters into Hindi script. Preserve all punctuation, tone, structure, and formatting exactly as given. Handle informal, poetic, or conversational text naturally.`
    };

    const systemPrompt = systemPrompts[languagePair as keyof typeof systemPrompts] || systemPrompts['benglish-bangla'];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\nConvert this text:\n${text}`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      throw new Error('Failed to convert text');
    }

    const data = await response.json();
    const convertedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

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
