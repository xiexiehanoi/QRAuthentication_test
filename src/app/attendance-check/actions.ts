// app/attendance-check/actions.ts
'use server';

import { cookies, headers } from 'next/headers';
import { generateAuthenticationOptions, verifyAuthenticationResponse as _verifyAuthenticationResponse } from '@simplewebauthn/server';
import User from '@/models/User';
import AttendanceSession from '@/models/AttendanceSession';
import { connectToDatabase } from '@/lib/mongoose';
import { Buffer } from 'buffer';

interface WebAuthnSettings {
  rpID: string;
  origin: string;
}

/**
 * getWebAuthnSettings
 * 현재 요청의 호스트를 기반으로 rpID와 origin을 구성합니다.
 */
export async function getWebAuthnSettings(): Promise<WebAuthnSettings> {
  // headers()는 동기적으로 사용 가능합니다.
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
 * beginAuthenticationAction
 * WebAuthn 인증 옵션을 생성하고, 생성된 challenge를 쿠키에 저장합니다.
 */
export async function beginAuthenticationAction() {
  await connectToDatabase();
  const { rpID, origin } = await getWebAuthnSettings();

  const options = generateAuthenticationOptions({
    rpID,
    userVerification: "preferred",
    timeout: 60000,
  });

  const cookieStore = cookies();
  cookieStore.set("authenticationChallenge", options.challenge, { httpOnly: true });
  
  return {
    ...options,
    extensions: { credProps: true },
  };
}

/**
 * finishAuthenticationAction
 * 클라이언트에서 받은 인증 응답을 검증하고 출석 기록을 DB에 저장합니다.
 */
export async function finishAuthenticationAction(
  authenticationResponse: unknown,
  sessionId: string
) {
  await connectToDatabase();
  const { rpID, origin } = await getWebAuthnSettings();
  const cookieStore = cookies();
  const expectedChallenge = cookieStore.get("authenticationChallenge")?.value;
  cookieStore.delete("authenticationChallenge");
  
  if (!expectedChallenge) {
    throw new Error("Challenge 정보가 없습니다.");
  }

  const verification = await _verifyAuthenticationResponse({
    response: authenticationResponse,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });

  if (verification.verified && verification.authenticationInfo && verification.registrationInfo) {
    // 최신 SimpleWebAuthn에서는 등록 정보는 registrationInfo.credential 내부에 있습니다.
    const { credential } = verification.registrationInfo;
    const { publicKey, id: credID, counter } = credential;
    
    const encodedCredentialID = Buffer.from(credID).toString('base64');

    // 테스트용: 해당 credentialID를 가진 사용자를 조회합니다.
    const user = await User.findOne({ credentialID: encodedCredentialID });
    if (!user) {
      throw new Error("사용자 정보가 없습니다.");
    }

    // 업데이트된 counter로 사용자 정보를 저장합니다.
    user.counter = verification.authenticationInfo.newCounter;
    await user.save();

    // AttendanceSession에 출석 기록 저장
    await AttendanceSession.create({
      sessionId,
      userId: user._id,
    });
    return "출석이 완료되었습니다.";
  }
  throw new Error("인증 실패");
}
