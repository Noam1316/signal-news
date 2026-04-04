import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    GMAIL_USER: process.env.GMAIL_USER ? process.env.GMAIL_USER.substring(0, 8) + '***' : 'NOT_SET',
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD ? 'SET (' + process.env.GMAIL_APP_PASSWORD.length + ' chars)' : 'NOT_SET',
    RESEND_API_KEY: process.env.RESEND_API_KEY ? 'SET' : 'NOT_SET',
  });
}
