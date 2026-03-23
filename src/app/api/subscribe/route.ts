/**
 * POST /api/subscribe — subscribe to daily brief / watchlist alerts
 * DELETE /api/subscribe?email=x — unsubscribe
 */

import { NextRequest, NextResponse } from 'next/server';
import { addSubscriber, subscriberExists } from '@/services/subscriber-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      email?: string;
      topics?: string[];
      dailyBrief?: boolean;
      watchlistAlerts?: boolean;
    };

    const { email, topics = [], dailyBrief = true, watchlistAlerts = false } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    // Already subscribed → update silently
    const exists = await subscriberExists(email);

    const sub = await addSubscriber({ email, topics, dailyBrief, watchlistAlerts });

    return NextResponse.json({
      ok: true,
      alreadyExisted: exists,
      message: exists ? 'הגדרות עודכנו' : 'נרשמת בהצלחה!',
      sub: { email: sub.email, topics: sub.topics, dailyBrief: sub.dailyBrief },
    });
  } catch (err) {
    console.error('[subscribe] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
