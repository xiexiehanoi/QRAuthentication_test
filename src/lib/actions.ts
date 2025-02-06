// src/lib/actions.ts
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
import type { User, Device } from '../lib/type';

// 현재 요청의 헤더를 사용하여 origin과 rpID를 동적으로 생성하는 함수
function getOriginAndRpID() {
  // next/headers의 headers() 함수는 서버 컴포넌트나 서버 액션 내에서만 사용 가능합니다.
  const reqHeaders = headers();
  // "host" 헤더 값이 존재해야 합니다.
  const host = reqHeaders.get('host');
  // x-forwarded-proto가 있으면 프로토콜을 사용하고, 없으면 http를 기본값으로 사용합니다.
  const proto = reqHeaders.get('x-forwarded-proto') || 'http';
  const origin = `${proto}://${host}`;
  const { hostname: rpID } = new URL(origin);
  return { origin, rpID };
}

export async function getRegistrationOptions(): Promise<any> {
  const { origin, rpID } = getOriginAndRpID();

  const client = await clientPromise;
  const db = client.db();
  const usersCollection = db.collection<User>('users');

  // dummy user 조회 또는 생성
  let user = await usersCollection.findOne({ username: 'dummy' });
  if (!user) {
    const newUser: User = { username: 'dummy', devices: [] };
    const result = await usersCollection.insertOne(newUser);
    user = { _id: result.insertedId, ...newUser };
  }

  // userID를 Uint8Array로 변환 (TextEncoder 사용)
  const userID = new TextEncoder().encode(user._id.toString());

  // generateRegistrationOptions의 반환값에 challenge가 반드시 있다고 단언합니다.
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

  // 생성된 challenge를 사용자 레코드에 저장
  await usersCollection.updateOne(
    { _id: user._id },
    { $set: { currentChallenge: options.challenge } }
  );

  return options;
}

export async function verifyRegistration(
  verificationResponse: RegistrationCredential
): Promise<boolean> {
  const { origin, rpID } = getOriginAndRpID();

  const client = await clientPromise;
  const db = client.db();
  const usersCollection = db.collection<User>('users');

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
    // 필요한 프로퍼티들을 any로 캐스팅하여 추출 (타입 정의가 달라질 수 있음)
    const { credentialPublicKey, credentialID, counter } =
      verification.registrationInfo as any;
    // 신규 기기를 사용자 레코드에 추가
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
  const { origin, rpID } = getOriginAndRpID();

  const client = await clientPromise;
  const db = client.db();
  const usersCollection = db.collection<User>('users');

  const user = await usersCollection.findOne({ username: 'dummy' });
  if (!user) throw new Error('User not found');

  // generateAuthenticationOptions 호출 시 rpID를 포함해야 합니다.
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
  const { origin, rpID } = getOriginAndRpID();

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

  // verifyAuthenticationResponse의 인자에 authenticator 속성이 필요함.
  // 타입 오류가 발생하면 any 단언을 사용합니다.
  // @ts-ignore
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
