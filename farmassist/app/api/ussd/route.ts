import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function sendAfricaTalkingSMS(to: string, message: string) {
  const username = process.env.AT_USERNAME || 'sandbox';
  const url =
    username === 'sandbox'
      ? 'https://api.sandbox.africastalking.com/version1/messaging'
      : 'https://api.africastalking.com/version1/messaging';

  const body = new URLSearchParams({ username, to, message });

  await fetch(url, {
    method: 'POST',
    headers: {
      apiKey: process.env.AT_API_KEY!,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  });
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const phoneNumber = String(formData.get('phoneNumber') || '+254700000002');
  const rawText = String(formData.get('text') || '');

  // Handle '0' (Back) presses just like your prototype
  const steps: string[] = [];
  for (const part of rawText.split('*').filter(Boolean)) {
    if (part === '0') steps.pop();
    else steps.push(part);
  }

  const reply = (text: string) =>
    new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

  if (steps.length === 0) {
    return reply('CON Karibu / Welcome\nFarmAssist\n1 English\n2 Kiswahili');
  }

  const sw = steps[0] === '2';
  const choice = steps[1];

  if (!choice) {
    return reply(
      sw
        ? 'CON FarmAssist\n1 Hali ya hewa\n2 Swali la mazao\n3 Bei ya mahindi\n4 Ongea na afisa'
        : 'CON FarmAssist\n1 Weather\n2 Crop question\n3 Maize prices\n4 Talk to officer'
    );
  }

  // 1. Weather
  if (choice === '1') {
    if (!steps[2]) {
      return reply(
        sw
          ? 'CON Hali ya hewa\nEneo: Nakuru Mashariki\n1 Ndiyo\n0 Rudi'
          : 'CON Weather\nArea: Nakuru East\n1 Yes, correct\n0 Back'
      );
    }
    if (!steps[3]) {
      return reply(
        sw
          ? 'CON Kesho: mvua inatarajiwa.\nAngalia udongo kabla ya kumwagilia.\n1 Nitumie SMS\n0 Menyu'
          : 'CON Tomorrow: rain likely.\nCheck soil is dry before watering.\n1 SMS me this\n0 Menu'
      );
    }
    if (steps[3] === '1') {
      await sendAfricaTalkingSMS(
        phoneNumber,
        sw
          ? 'Kesho mvua inatarajiwa Nakuru Mashariki. Angalia udongo kabla ya kumwagilia. - FarmAssist'
          : 'Tomorrow rain likely in Nakuru East. Check soil is dry before watering. - FarmAssist'
      );
      return reply(sw ? 'END SMS imetumwa kwenye simu yako.' : 'END SMS sent to your phone.');
    }
  }

  // 2. Crop Question -> Sends straight to Grace's tablet queue
  if (choice === '2') {
    const crops = sw ? ['Mahindi', 'Maharagwe', 'Jingine'] : ['Maize', 'Beans', 'Other'];
    if (!steps[2]) {
      return reply(
        sw
          ? 'CON Swali la mazao\n1 Mahindi\n2 Maharagwe\n3 Jingine\n0 Rudi'
          : 'CON Crop question\n1 Maize\n2 Beans\n3 Other\n0 Back'
      );
    }
    const crop = crops[Number(steps[2]) - 1] || 'Maize';
    if (!steps[3]) {
      return reply(
        sw
          ? 'CON Unaona nini?\n1 Madoa kwenye majani\n2 Majani ya manjano\n3 Kunyauka\n0 Rudi'
          : 'CON What do you see?\n1 Spotted leaves\n2 Yellow leaves\n3 Wilting\n0 Back'
      );
    }
    if (!steps[4]) {
      return reply(
        sw
          ? 'CON Yaweza kuwa sababu kadhaa. Afisa anaweza kusaidia.\n1 Nipigie simu\n0 Menyu'
          : 'CON Could be a few causes. An officer can help.\n1 Call me back\n0 Menu'
      );
    }
    if (steps[4] === '1') {
      await supabase.from('diagnostic_cases').insert({
        farmer_name: 'Mary Wanjiku (USSD)',
        farmer_phone: phoneNumber,
        channel: 'ussd',
        crop,
        symptoms: `USSD symptom choice #${steps[3]}`,
        ai_confidence: 35,
        ai_reasoning: 'Submitted via basic phone USSD menu. Farmer requested callback.',
        status: 'new',
      });
      await sendAfricaTalkingSMS(
        phoneNumber,
        sw
          ? 'Ombi lako limepokelewa. Afisa Grace atakupigia ndani ya siku 1. - FarmAssist'
          : 'Officer request received. Grace will call you within 1 day. - FarmAssist'
      );
      return reply(
        sw
          ? 'END Ombi limetumwa. Afisa atakupigia ndani ya siku 1.'
          : 'END Request sent. An officer will contact you within 1 day.'
      );
    }
  }

  // 3. Maize Prices
  if (choice === '3') {
    if (!steps[2]) {
      return reply(
        sw
          ? 'CON Mahindi / kilo\nNakuru Town 58 (km 15, leo)\nMolo 56 (km 26, jana)\n1 Nitumie SMS\n0 Menyu'
          : 'CON Maize / kg\nNakuru Town 58 (15km, today)\nMolo 56 (26km, yesterday)\n1 SMS me\n0 Menu'
      );
    }
    if (steps[2] === '1') {
      await sendAfricaTalkingSMS(
        phoneNumber,
        sw
          ? 'Mahindi/kilo: Nakuru Town KSh58 (leo), Molo KSh56 (jana). Thibitisha bei kabla ya kuuza.'
          : 'Maize/kg: Nakuru Town KSh58 (today), Molo KSh56 (yesterday). Confirm price before selling.'
      );
      return reply(sw ? 'END Bei zimetumwa kwa SMS.' : 'END Prices sent via SMS.');
    }
  }

  // 4. Direct Officer Callback
  if (choice === '4') {
    await supabase.from('diagnostic_cases').insert({
      farmer_name: 'Mary Wanjiku (USSD)',
      farmer_phone: phoneNumber,
      channel: 'ussd',
      crop: 'General inquiry',
      ai_confidence: 30,
      ai_reasoning: 'Farmer requested direct callback via USSD option 4.',
      status: 'new',
    });
    await sendAfricaTalkingSMS(
      phoneNumber,
      sw
        ? 'Ombi lako limepokelewa. Afisa atawasiliana nawe ndani ya siku 1. - FarmAssist'
        : 'Request received. An officer will contact you within 1 day. - FarmAssist'
    );
    return reply(sw ? 'END Ombi limetumwa. Asante.' : 'END Request sent. Thank you.');
  }

  return reply('END Invalid option. Please dial again.');
}