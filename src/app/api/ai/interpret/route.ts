// Next.js API Route for Local AI Clinical Assistant
// POST /api/ai/interpret
// Body: { context: string, promptType: 'SOAP' | 'SUMMARY' | 'HOMEWORK' }

import { NextRequest } from "next/server";

export const runtime = "edge";

type PromptType = 'SOAP' | 'SUMMARY' | 'HOMEWORK';

interface InterpretRequest {
  context: string;
  promptType: PromptType;
}

const SYSTEM_PROMPTS: Record<PromptType, string> = {
  SOAP: `Ești un asistent clinic specializat în formatarea notelor terapeutice în format SOAP (Subjective, Objective, Assessment, Plan).

Instrucțiuni:
- Prelucrează următoarele notițe de terapie și rescrie-le într-un format SOAP profesional
- Subjective: simptomele, preocupările și experiențele raportate de pacient
- Objective: observațiile clinice obiective ale terapeutului (comportament, afect, cognițe)
- Assessment: evaluarea clinică și interpretarea datelor
- Plan: planul terapeutic, obiectivele și următorii pași

Răspunde DOAR cu textul formatat SOAP, fără explicații suplimentare.`,

  SUMMARY: `Ești un asistent clinic specializat în redactarea rezumatelor clinice concise pentru trimiterea la specialiști.

Instrucțiuni:
- Redactează un rezumat clinic de 3 propoziții bazat pe aceste notițe
- Prima propoziție: prezentarea problemei/diagnosticul de lucru
- A doua propoziție: progresul terapeutic sau observațiile clinice relevante
- A treia propoziție: recomandarea pentru evaluare/tratament suplimentar

Răspunde DOAR cu cele 3 propoziții, fără explicații suplimentare.`,

  HOMEWORK: `Ești un asistent clinic specializat în identificarea și extragerea sarcinilor terapeutice.

Instrucțiuni:
- Extrage DOAR sarcinile concrete, exercițiile și activitățile specifice atribuite pacientului din aceste notițe
- Formatează ca listă cu puncte clare și acționabile
- Ignore discuțiile teoretice, observațiile clinice sau planificările viitoare
- Concentrează-te pe activitățile concrete pe care pacientul trebuie să le realizeze

Răspunde DOAR cu lista de sarcini, fără explicații suplimentare.`
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as InterpretRequest;

    // Validate request body
    if (!body.context || typeof body.context !== 'string') {
      return new Response(
        JSON.stringify({ error: "Context is required and must be a string" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!body.promptType || !['SOAP', 'SUMMARY', 'HOMEWORK'].includes(body.promptType)) {
      return new Response(
        JSON.stringify({ error: "promptType must be one of: SOAP, SUMMARY, HOMEWORK" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get Ollama configuration
    const ollamaUrl = process.env.OLLAMA_URL || process.env.NEXT_PUBLIC_OLLAMA_URL || "http://127.0.0.1:11434";
    const model = "gemma2:9b-instruct"; // Fixed model as specified in requirements

    // Combine system prompt with user context
    const systemPrompt = SYSTEM_PROMPTS[body.promptType];
    const combinedPrompt = `${systemPrompt}\n\nNotițele de terapie:\n${body.context}`;

    // Make request to local Ollama instance
    const ollamaResponse = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt: combinedPrompt,
        stream: false
      })
    });

    if (!ollamaResponse.ok) {
      if (ollamaResponse.status === 404) {
        return new Response(
          JSON.stringify({
            error: "Ollama instance not running or Gemma 2 model not loaded"
          }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          error: `Ollama error: ${ollamaResponse.status} ${ollamaResponse.statusText}`
        }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const ollamaResult = await ollamaResponse.json() as { response?: string };

    if (!ollamaResult.response) {
      return new Response(
        JSON.stringify({ error: "No response from Ollama" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // Return the generated text
    return new Response(
      JSON.stringify({
        result: ollamaResult.response.trim(),
        promptType: body.promptType
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (err) {
    // Handle connection errors specifically
    if (err instanceof Error && err.message.includes('ECONNREFUSED')) {
      return new Response(
        JSON.stringify({
          error: "Ollama instance not running or Gemma 2 model not loaded"
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle other errors
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}