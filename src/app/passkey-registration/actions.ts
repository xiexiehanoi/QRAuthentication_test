// app/passkey-registration/actions.ts
'use server';

import { cookies, headers } from 'next/headers';
import {
  generateRegistrationOptions as _generateRegistrationOptions,
  verifyRegistrationResponse as _verifyRegistrationResponse,
} from '@simplewebauthn/server';
import type { RegistrationResponseJSON } from '@simplewebauthn/typescript-types';
import User from '@/models/User';
import { connectToDatabase } from '@/lib/mongoose';
import { Buffer } from 'buffer';

/**
 * getWebAuthnSettings
 * 현재 요청의 호스트를 기반으로 rpID와 origin을 구성합니다.
 */
export async function getWebAuthnSettings() {
  const headersList = headers();
  const host = headersList.get("host") || "";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

  let hostname = host.replace("www.", "");
  if (process.env.NODE_ENV === "development") {
    hostname = hostname.replace(":3000", "");
  }
  if (hostname.startsWith("localhost")) {
    return {
      rpID: "localhost",
      origin: "http://localhost:3000",
    };
  }
  return {
    rpID: hostname,
    origin: `${protocol}://${hostname}`,
  };
}

/**
 * beginRegistrationAction
 * WebAuthn 등록 옵션 생성 및 생성된 challenge를 쿠키에 저장합니다.
 */
export async function beginRegistrationAction() {
  await connectToDatabase();
  const { rpID } = await getWebAuthnSettings();

  const options = await _generateRegistrationOptions({
    rpName: 'My Awesome App',
    rpID,
    // userID는 Uint8Array 타입이어야 합니다.
    userID: new TextEncoder().encode('temporary-user-id'),
    userName: 'temporary-user',
    attestationType: 'none',
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      userVerification: "required",
      requireResidentKey: false,
    },
  });
  
  const cookieStore = cookies();
  cookieStore.set('registrationChallenge', options.challenge, { httpOnly: true });
  return options;
}

/**
 * finishRegistrationAction
 * 클라이언트에서 전달받은 attestation 응답을 검증하고 사용자 등록 처리합니다.
 */
export async function finishRegistrationAction(registrationResponse: unknown) {
  await connectToDatabase();
  const { rpID, origin } = await getWebAuthnSettings();

  const cookieStore = cookies();
  const expectedChallenge = cookieStore.get('registrationChallenge')?.value;
  cookieStore.delete('registrationChallenge');
  
  if (!expectedChallenge) {
    throw new Error("Challenge 정보가 없습니다.");
  }

  const parsedResponse = registrationResponse as RegistrationResponseJSON;

  const verification = await _verifyRegistrationResponse({
    response: parsedResponse,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });

  if (verification.verified && verification.registrationInfo) {
    const { credential } = verification.registrationInfo;
    const { publicKey, id: credID, counter } = credential;
    
    const encodedCredentialID = Buffer.from(credID).toString('base64');

    const existingUser = await User.findOne({ credentialID: encodedCredentialID });
    if (existingUser) {
      throw new Error("이미 등록되어있는 passkey입니다.");
    }
    
    await User.create({
      username: 'temporary-user',
      credentialID: encodedCredentialID,
      publicKey: Buffer.from(publicKey).toString('base64'),
      counter,
    });
    return { success: true };
  }
  throw new Error("등록 실패");
}
