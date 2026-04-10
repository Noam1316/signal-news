import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    GROQ_API_KEY: process.env.GROQ_API_KEY ? 'SET' : 'NOT_SET',
    KV_REST_API_URL: process.env.KV_REST_API_URL ? 'SET' : 'NOT_SET',
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? 'SET' : 'NOT_SET',
    GMAIL_USER: process.env.GMAIL_USER ? process.env.GMAIL_USER.substring(0, 8) + '***' : 'NOT_SET',
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD ? 'SET (' + process.env.GMAIL_APP_PASSWORD.length + ' chars)' : 'NOT_SET',
    RESEND_API_KEY: process.env.RESEND_API_KEY ? 'SET' : 'NOT_SET',
  });
}
