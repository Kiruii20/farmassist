import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { to, message } = await req.json();
    if (!to || !message) {
      return NextResponse.json({ error: 'Phone number and message are required' }, { status: 400 });
    }

    const username = process.env.AT_USERNAME || 'sandbox';
    const url =
      username === 'sandbox'
        ? 'https://api.sandbox.africastalking.com/version1/messaging'
        : 'https://api.africastalking.com/version1/messaging';

    const body = new URLSearchParams({ username, to, message });

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        apiKey: process.env.AT_API_KEY!,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: body.toString(),
    });

    const data = await res.json();
    return NextResponse.json({ ok: true, result: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'SMS send failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}