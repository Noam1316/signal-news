/**
 * GET /api/unsubscribe?token=xxx&email=yyy
 * Unsubscribes user and shows a simple confirmation page.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSubscriber, removeSubscriber } from '@/services/subscriber-store';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email') ?? '';
  const token = searchParams.get('token') ?? '';

  if (!email || !token) {
    return new NextResponse(page('שגיאה', 'קישור לא תקין.'), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  const sub = await getSubscriber(email);

  if (!sub || sub.token !== token) {
    return new NextResponse(page('שגיאה', 'לא נמצא מינוי תואם.'), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  await removeSubscriber(email);

  return new NextResponse(page('הסרה בוצעה ✓', `הכתובת ${escapeHtml(email)} הוסרה מרשימת התפוצה של Signal News.`), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function page(title: string, msg: string): string {
  return `<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="UTF-8"/><title>${title}</title>
  <style>body{margin:0;background:#0a0f1e;color:#f1f5f9;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;direction:rtl;}
  .box{text-align:center;max-width:400px;} h1{font-size:28px;color:#6366f1;} p{color:#94a3b8;} a{color:#6366f1;}</style>
  </head><body><div class="box"><h1>${title}</h1><p>${msg}</p><a href="/dashboard">חזור לדשבורד →</a></div></body></html>`;
}
