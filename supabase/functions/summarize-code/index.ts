// Deno global type declaration for Supabase Edge Functions
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// @ts-ignore - Deno import (works in Supabase Edge Functions runtime)
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
    const { file_content, file_path } = await req.json();
    
    if (!file_content || !file_path) {
      throw new Error('File content and path are required');
    }

    // Get AI API configuration - supports OpenAI or any OpenAI-compatible API
    const AI_API_KEY = Deno.env.get('AI_API_KEY') || Deno.env.get('OPENAI_API_KEY');
    const AI_API_URL = Deno.env.get('AI_API_URL') || 'https://api.openai.com/v1/chat/completions';
    const AI_MODEL = Deno.env.get('AI_MODEL') || 'gpt-4o-mini';
    
    if (!AI_API_KEY) {
      throw new Error('AI_API_KEY or OPENAI_API_KEY is not configured. Please set one of these environment variables.');
    }

    console.log(`Summarizing file: ${file_path}`);

    // Call AI API (OpenAI-compatible)
    const aiResponse = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a code analysis expert. Analyze the provided code and return a JSON response with: 1) purpose (3-sentence summary), 2) criticalFunctions (array of 3 most important functions/classes), 3) refactoringPriority (number 1-5, where 5 is highest priority).'
          },
          {
            role: 'user',
            content: `Analyze this code file:\n\nFile: ${file_path}\n\nCode:\n${file_content.slice(0, 4000)}\n\nReturn only valid JSON with the structure: { "purpose": "...", "criticalFunctions": ["...", "...", "..."], "refactoringPriority": 1-5 }`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse JSON response
    let summary;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || 
                       content.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      summary = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Fallback summary
      summary = {
        purpose: content.slice(0, 200),
        criticalFunctions: ['Unable to parse functions'],
        refactoringPriority: 3,
      };
    }

    const result = {
      purpose: summary.purpose || 'Analysis unavailable',
      criticalFunctions: summary.criticalFunctions || [],
      refactoringPriority: summary.refactoringPriority || 3,
      filePath: file_path,
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in summarize-code:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
