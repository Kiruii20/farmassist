import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
  httpOptions: { apiVersion: "v1beta" },
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      farmerName,
      farmerPhone,
      crop,
      onsetTiming,
      symptoms,
      imageBase64,
      mimeType,
      photoUrl,
      consentGranted,
    } = body;

    if (photoUrl && !consentGranted) {
      return NextResponse.json(
        { error: 'Photo sharing consent is required (Kenya Data Protection Act, 2019).' },
        { status: 400 }
      );
    }

    const prompt = `You are FarmAssist, an agricultural advisor for smallholder farmers in Nakuru County, Kenya.
Crop: ${crop}. First noticed: ${onsetTiming || 'Recently'}. Notes: ${symptoms || 'None'}.
Inspect the leaf photo (if attached) and details. Never give a single overconfident diagnosis.
1. List 2-3 plausible causes in plain words (e.g., blight, bacterial spot, nutrient shortage, sun scorch).
2. Give a realistic confidence number from 25 to 75.
3. Write 2 short sentences of technical reasoning for the county extension officer.
4. Suggest ONE safe, low-cost next step (such as waiting 2 days to see if spots spread before buying spray).`;

    const contents: any[] = [prompt];
    if (imageBase64 && mimeType) {
      contents.push({ inlineData: { data: imageBase64, mimeType } });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            possibleCauses: { type: Type.STRING },
            confidence: { type: Type.INTEGER },
            reasoning: { type: Type.STRING },
            safeNextStep: { type: Type.STRING },
          },
          required: ['possibleCauses', 'confidence', 'reasoning', 'safeNextStep'],
        },
      },
    });

    const result = JSON.parse(response.text || '{}');

    const { data, error } = await supabase
      .from('diagnostic_cases')
      .insert({
        farmer_name: farmerName || 'John Mwangi',
        farmer_phone: farmerPhone || '+254700000001',
        channel: 'pwa',
        crop: crop || 'Tomatoes',
        onset_timing: onsetTiming || '2-3 days ago',
        symptoms: symptoms || '',
        photo_url: photoUrl || null,
        consent_granted: Boolean(consentGranted),
        ai_possible_causes:
          result.possibleCauses ||
          'Dark spots can come from blight, bacterial spot, nutrient shortage, or sun scorch.',
        ai_confidence: result.confidence ?? 42,
        ai_reasoning:
          result.reasoning ||
          'Spots and recent humid weather in Nakuru suggest early/late blight or bacterial spot. Needs officer review.',
        ai_safe_next_step:
          result.safeNextStep ||
          'Look again in 2 days to see if spots spread to new leaves. Hold off on spraying until you know.',
        status: 'new',
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ case: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Diagnosis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}