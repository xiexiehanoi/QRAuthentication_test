// src/app/attendance-check/actions.ts
'use server';

import { verifyAuthentication } from '@/lib/actions'; // 서버 전용 로직

export async function verifyAuthenticationAction(formData: FormData): Promise<boolean> {
  const authenticationResponse = formData.get('authenticationResponse') as string;
  if (!authenticationResponse) {
    throw new Error('No authentication response provided');
  }
  const parsed = JSON.parse(authenticationResponse);
  const verified = await verifyAuthentication(parsed);
  return verified;
}
