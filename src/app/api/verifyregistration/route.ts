
/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from 'next/server';
import { verifyRegistration } from '@/lib/actions'
export async function POST(request: Request) {
  const body = await request.json();
  try {
    const verified = await verifyRegistration(body);
    return NextResponse.json({ verified });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
