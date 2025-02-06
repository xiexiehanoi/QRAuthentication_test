// src/lib/actions.ts
'use server';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { headers } from 'next/headers';
import clientPromise from './mongodb';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationCredential,
  AuthenticationCredential,
} from '@simplewebauthn/typescript-types';
import type { User, Device } from './type';

/**
 * 현재 요청의 헤더를 사용하여 origin과 rpID를 동적으로 생성하는 함수
 */
async function getOriginAndRpID(): Promise<{ origin: string; rpID: string }> {
  // next/headers는 앱 디렉토리의 서버 컴포넌트/서버 액션 내에서 사용 가능
  const reqHeaders = await headers(); // Promise 반환 시 await
  const host = reqHeaders.get('host');
  if (!host) throw new Error('Host header is missing');
  const proto = reqHeaders.get('x-forwarded-proto') || 'http';
  const origin = `${proto}://${host}`;
  const { hostname: rpID } = new URL(origin);
  return { origin, rpID };
}

export async function getRegistrationOptions(): Promise<any> {
  // 여기서 origin은 사용하지 않고 rpID만 사용
  const { rpID } = await getOriginAndRpID();

  const client = await clientPromise;
  const db = client.db();
  const usersCollection = db.collection<User>('users');

  // "dummy" 사용자를 찾습니다.
  let user = await usersCollection.findOne({ username: 'dummy' });
  if (!user) {
    // 사용자가 없으면 새로 생성합니다.
    const newUser: User = { username: 'dummy', devices: [] };
    const result = await usersCollection.insertOne(newUser);
    user = { _id: result.insertedId, ...newUser };
  }

  // userID를 Uint8Array로 변환
  const userID = new TextEncoder().encode(user._id?.toString() || '');

  const options = generateRegistrationOptions({
    rpName: 'Example RP',
    rpID,
    userID,
    userName: user.username,
    attestationType: 'none',
    authenticatorSelection: {
      userVerification: 'required',
      residentKey: 'required',
    },
  }) as any;

  // 생성된 challenge를 사용자 문서에 저장
  await usersCollection.updateOne(
    { _id: user._id },
    { $set: { currentChallenge: options.challenge } }
  );

  return options;
}

export async function verifyRegistration(
  verificationResponse: RegistrationCredential
): Promise<boolean> {
  const { origin, rpID } = await getOriginAndRpID();

  const client = await clientPromise;
  const db = client.db();
  const usersCollection = db.collection<User>('users');

  // "dummy" 사용자를 찾습니다.
  const user = await usersCollection.findOne({ username: 'dummy' });
  if (!user) throw new Error('User not found');

  const expectedChallenge = user.currentChallenge;
  if (!expectedChallenge) throw new Error('No challenge found for user');

  const verification = await verifyRegistrationResponse({
    response: verificationResponse as any,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });

  if (verification.verified && verification.registrationInfo) {
    const { credentialPublicKey, credentialID, counter } =
      verification.registrationInfo as any;
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $push: {
          devices: {
            credentialID: Buffer.from(credentialID),
            publicKey: credentialPublicKey,
            counter,
          },
        },
      }
    );
  }

  return verification.verified;
}

export async function getAuthenticationOptions(): Promise<any> {
  const { rpID } = await getOriginAndRpID(); // origin 사용하지 않음

  const client = await clientPromise;
  const db = client.db();
  const usersCollection = db.collection<User>('users');

  const user = await usersCollection.findOne({ username: 'dummy' });
  if (!user) throw new Error('User not found');

  const options = generateAuthenticationOptions({
    rpID,
    allowCredentials: user.devices.map((dev: Device) => ({
      id: dev.credentialID.toString('base64'),
      type: 'public-key',
      transports: ['internal'],
    })),
    userVerification: 'required',
  }) as any;

  await usersCollection.updateOne(
    { _id: user._id },
    { $set: { currentChallenge: options.challenge } }
  );

  return options;
}

export async function verifyAuthentication(
  verificationResponse: AuthenticationCredential
): Promise<boolean> {
  const { origin, rpID } = await getOriginAndRpID();

  const client = await clientPromise;
  const db = client.db();
  const usersCollection = db.collection<User>('users');

  const user = await usersCollection.findOne({ username: 'dummy' });
  if (!user) throw new Error('User not found');

  const expectedChallenge = user.currentChallenge;
  if (!expectedChallenge) throw new Error('No challenge found for user');

  const device = user.devices.find((dev: Device) => {
    return dev.credentialID.toString('base64') === verificationResponse.id;
  });
  if (!device) throw new Error('Device not found');

  // 인증 응답 검증 (타입 보완을 위해 any 사용)
  const verification = await verifyAuthenticationResponse({
    response: verificationResponse as any,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    authenticator: {
      credentialPublicKey: device.publicKey,
      counter: device.counter,
      credentialID: device.credentialID,
    },
  } as any);

  if (verification.verified && verification.authenticationInfo) {
    await usersCollection.updateOne(
      { _id: user._id, 'devices.credentialID': device.credentialID },
      { $set: { 'devices.$.counter': verification.authenticationInfo.newCounter } }
    );
  }

  return verification.verified;
}
