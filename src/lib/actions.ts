// lib/actions.ts
'use server'

import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { 
  GenerateRegistrationOptionsOpts, 
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  VerifyAuthenticationResponseOpts 
} from '@simplewebauthn/server';
import { User } from './type';
import clientPromise from './mongodb';

// Passkey 등록을 위한 옵션 생성
export async function handleRegistration(username: string, rpID: string, origin: string) {
  const client = await clientPromise;
  const db = client.db();
  const users = db.collection<User>('users');

  const existingUser = await users.findOne({ username });
  if (existingUser) {
    throw new Error('Username already exists');
  }

  const options: GenerateRegistrationOptionsOpts = {
    rpName: 'QR Authentication',
    rpID,
    userID: Buffer.from(username), // string을 Uint8Array로 변환
    userName: username,
    timeout: 60000,
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: 'required',
    },
  };

  const registrationOptions = await generateRegistrationOptions(options);

  await users.insertOne({
    username,
    devices: [],
    currentChallenge: registrationOptions.challenge,
  });

  return registrationOptions;
}

// Passkey 등록 확인
export async function verifyAndSaveRegistration(
  username: string, 
  response: RegistrationResponseJSON, 
  rpID: string, 
  origin: string
) {
  const client = await clientPromise;
  const db = client.db();
  const users = db.collection<User>('users');

  const user = await users.findOne({ username });
  if (!user) throw new Error('User not found');

  try {
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: user.currentChallenge!,
      expectedOrigin: origin,
      expectedRPID: rpID,
      // requireUserVerification: true,
    });

    console.log('Verification object:', JSON.stringify(verification, null, 2));


    if (verification.verified && verification.registrationInfo) {
      // Base64URL로 인코딩된 credentialID와 publicKey를 직접 사용
      const newDevice = {
        credentialID: Buffer.from(response.id, 'base64url'),
        publicKey: new Uint8Array(verification.registrationInfo.credential.publicKey),
        counter: 0,
      };

      
      await users.updateOne(
        { username },
        {
          $push: { devices: newDevice },
          $unset: { currentChallenge: "" }
        }
      );

      return true;
    }
    return false;
  } catch (error) {
    console.error('Registration verification error:', error);
    return false;
  }
}

// 출석 체크를 위한 인증 옵션 생성
export async function getAuthenticationOptions(rpID: string) {
  const options = await generateAuthenticationOptions({
    rpID,
    timeout: 60000,
    userVerification: 'required',
    allowCredentials: [],
  });

  return options;
}

// 출석 체크 인증 확인
export async function verifyAuthentication(
  response: AuthenticationResponseJSON, 
  rpID: string, 
  origin: string
) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const users = db.collection<User>('users');

    const user = await users.findOne({
      'devices.credentialID': Buffer.from(response.id, 'base64url'),
    });

    if (!user) throw new Error('User not found');

    const device = user.devices.find(
      (d) => Buffer.compare(d.credentialID, Buffer.from(response.id, 'base64url')) === 0
    );

    if (!device) throw new Error('Device not found');

    const verification = await verifyAuthenticationResponse({
      response,
      expectedOrigin: origin,
      expectedRPID: rpID,
      expectedChallenge: user.currentChallenge || '',
      requireUserVerification: true,
    } as VerifyAuthenticationResponseOpts);

    if (verification.verified) {
      await users.updateOne(
        { 'devices.credentialID': device.credentialID },
        { $set: { 'devices.$.counter': verification.authenticationInfo.newCounter } }
      );

      const attendanceSession = {
        userId: user._id,
        timestamp: new Date(),
        sessionId: new Date().toISOString(),
      };

      await db.collection('attendanceSessions').insertOne(attendanceSession);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Authentication error:', error);
    return false;
  }
}