import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
  httpOptions: { apiVersion: "v1beta" },
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      farmerName = "John Mwangi",
      farmerPhone = "+254712345678",
      crop = "Maize",
      onsetTiming = "3–5 days ago",
      symptoms = "",
      imageBase64 = null,
      mimeType = "image/jpeg",
    } = body || {};

    const prompt = [
      `You are an agricultural extension assistant helping a smallholder farmer in Njoro, Nakuru County, Kenya.`,
      `Crop: ${crop}`,
      `Symptom onset: ${onsetTiming}`,
      `Observed symptoms: ${symptoms || "Not specified"}`,
      `Provide a concise, practical preliminary triage with:`,
      `1. "summary": a clear 1-2 sentence overview of what the symptoms/photo suggest.`,
      `2. "confidence": e.g. "Moderate (75%)" or "Low — needs field verification".`,
      `3. "possibleCauses": array of 2-3 objects with { "name": string, "likelihood": string, "notes": string }.`,
      `4. "safeNextStep": a safe, practical immediate action for the farmer before applying any inputs.`,
    ].join("\n");

    const contents: Array<
      | string
      | {
          inlineData: {
            data: string;
            mimeType: string;
          };
        }
    > = [prompt];

    if (imageBase64 && typeof imageBase64 === "string") {
      contents.push({
        inlineData: {
          data: imageBase64,
          mimeType: typeof mimeType === "string" && mimeType ? mimeType : "image/jpeg",
        },
      });
    }

    let diagnosis = {
      summary: `Preliminary check logged for ${crop} (${onsetTiming}).`,
      confidence: "Moderate (70%)",
      possibleCauses: [
        {
          name: "Nutrient or moisture stress",
          likelihood: "Possible",
          notes: "Inspect lower leaves, soil moisture, and drainage after recent rainfall.",
        },
        {
          name: "Early foliar spotting / pest pressure",
          likelihood: "Verify in field",
          notes: "Check leaf undersides and neighboring plants for spreading lesions or insects.",
        },
      ],
      safeNextStep:
        "Scout the plot in morning light, avoid over-watering or spraying blindly before confirming the cause, and follow local extension guidance.",
    };

    if (process.env.GEMINI_API_KEY) {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              confidence: { type: Type.STRING },
              possibleCauses: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    likelihood: { type: Type.STRING },
                    notes: { type: Type.STRING },
                  },
                  required: ["name"],
                },
              },
              safeNextStep: { type: Type.STRING },
            },
            required: ["summary", "confidence", "possibleCauses", "safeNextStep"],
          },
        },
      });

      const rawText = response.text?.trim() || "";
      if (rawText) {
        try {
          const parsed = JSON.parse(rawText);
          diagnosis = {
            summary: parsed.summary || diagnosis.summary,
            confidence: parsed.confidence || diagnosis.confidence,
            possibleCauses:
              Array.isArray(parsed.possibleCauses) && parsed.possibleCauses.length > 0
                ? parsed.possibleCauses
                : diagnosis.possibleCauses,
            safeNextStep: parsed.safeNextStep || diagnosis.safeNextStep,
          };
        } catch {
          diagnosis = {
            ...diagnosis,
            summary: rawText,
          };
        }
      }
    }

    // Optional Supabase persistence (non-blocking if table/columns differ)
    try {
      await supabase.from("cases").insert({
        farmer_name: farmerName,
        farmer_phone: farmerPhone,
        crop,
        onset_timing: onsetTiming,
        symptoms,
        diagnosis,
        status: "New",
      });
    } catch {
      // Ignore DB insert errors so diagnostic response still succeeds
    }

    return NextResponse.json({ ok: true, diagnosis });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to run crop diagnosis.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}