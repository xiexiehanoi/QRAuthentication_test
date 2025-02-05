// app/passkey-registration/actions.ts
'use server';

import { cookies, headers } from 'next/headers';
import {
  generateRegistrationOptions as _generateRegistrationOptions,
  verifyRegistrationResponse as _verifyRegistrationResponse,
} from '@simplewebauthn/server';
import User from '@/models/User';
import { connectToDatabase } from '@/lib/mongoose';
import { Buffer } from 'buffer';

/**
 * getWebAuthnSettings
 * 현재 요청의 host를 기반으로 rpID와 origin을 구성합니다.
 */
export async function getWebAuthnSettings() {
  // headers()가 Promise를 반환하는 경우 await 처리합니다.
  const headersList = await headers();
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
 * WebAuthn 등록 옵션 생성 및 생성된 challenge를 쿠키에 저장
 */
export async function beginRegistrationAction() {
  await connectToDatabase();
  const { rpID, origin } = await getWebAuthnSettings();

  const options = await _generateRegistrationOptions({
    rpName: 'My Awesome App',
    rpID,
    // userID는 Uint8Array 타입이어야 합니다.
    userID: new TextEncoder().encode('temporary-user-id'), // 실제 사용자 식별자로 대체
    userName: 'temporary-user',  // 실제 사용자 이름으로 대체
    attestationType: 'none',
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      userVerification: "required",
      requireResidentKey: false, // iOS Safari 대응
    },
  });
  
  const cookieStore = await cookies();
  cookieStore.set('registrationChallenge', options.challenge, { httpOnly: true });
  return options;
}

/**
 * finishRegistrationAction
 * 클라이언트에서 전달받은 attestation 응답을 검증하고 사용자 등록 처리
 */
export async function finishRegistrationAction(registrationResponse: any) {
  await connectToDatabase();
  const { rpID, origin } = await getWebAuthnSettings();

  const cookieStore = await cookies();
  const expectedChallenge = cookieStore.get('registrationChallenge')?.value;
  cookieStore.delete('registrationChallenge');
  
  if (!expectedChallenge) {
    throw new Error("Challenge 정보가 없습니다.");
  }

  const verification = await _verifyRegistrationResponse({
    response: registrationResponse,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });

  if (verification.verified && verification.registrationInfo) {
    // 최신 타입에서는 registrationInfo.credential 안에 값들이 들어 있습니다.
    const { credential } = verification.registrationInfo;
    // credential의 프로퍼티 이름이 id, publicKey, counter로 되어 있는지 확인합니다.
    const { publicKey, id: credID, counter } = credential;
    
    // Buffer를 사용하여 binary 데이터를 base64 문자열로 변환합니다.
    const encodedCredentialID = Buffer.from(credID).toString('base64');

    // 테스트용: 사용자 조회 (실제 서비스에서는 고유 사용자 정보를 사용)
    const existingUser = await User.findOne({ credentialID: encodedCredentialID });
    if (existingUser) {
      throw new Error("이미 등록되어있는 passkey입니다.");
    }
    
    // 새 사용자 생성 (실제 서비스에서는 기존 사용자 문서 업데이트)
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
