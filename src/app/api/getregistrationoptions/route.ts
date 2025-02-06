// src/app/api/getRegistrationOptions/route.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from 'next/server';
import { getRegistrationOptions } from '@/lib/actions';

export async function GET() {
  try {
    const options = await getRegistrationOptions();
    return NextResponse.json(options);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
