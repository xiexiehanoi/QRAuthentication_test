// lib/actions.ts
'use server'

import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { 
  GenerateRegistrationOptionsOpts, 
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/server';
import { User,Device } from './type';
import clientPromise from './mongodb';

// Passkey 등록을 위한 옵션 생성
export async function handleRegistration(username: string, rpID: string, origin: string) {
  const client = await clientPromise;
  const db = client.db('ncamp');
  const users = db.collection<User>('users');

  console.log('Registration attempt for username:', username);
  console.log('Origin:', origin);
  console.log('RPID:', rpID);

  const existingUser = await users.findOne({ username });
  if (existingUser) {
    console.log('User already exists:', username);
    throw new Error('Username already exists');
  }

  const options: GenerateRegistrationOptionsOpts = {
    rpName: 'QR Authentication',
    rpID,
    userID: Buffer.from(username),
    userName: username,
    timeout: 60000,
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: 'required',
    },
  };

  const registrationOptions = await generateRegistrationOptions(options);

  const newUser = {
    username,
    devices: [],
    currentChallenge: registrationOptions.challenge,
  };

  console.log('Saving new user:', newUser);
  
  await users.insertOne(newUser);
  
  const savedUser = await users.findOne({ username });
  console.log('Saved user:', savedUser);

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
  const db = client.db('ncamp');
  const users = db.collection<User>('users');

  console.log('Verifying registration for username:', username);
  console.log('Response ID:', response.id);

  const user = await users.findOne({ username });
  if (!user) {
    console.log('User not found:', username);
    throw new Error('User not found');
  }

  try {
    console.log('Verifying with challenge:', user.currentChallenge);
    
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: user.currentChallenge!,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    console.log('Verification result:', JSON.stringify(verification, null, 2));

    if (verification.verified && verification.registrationInfo) {
      const newDevice: Device = {
        credentialID: Buffer.from(response.id, 'base64url'),
        publicKey: Buffer.from(verification.registrationInfo.credential.publicKey),
        counter: 0,
      };

      console.log('Adding new device:', {
        credentialID: response.id,
        counter: 0
      });

      await users.updateOne(
        { username },
        {
          $push: { devices: { $each: [newDevice] } },
          $unset: { currentChallenge: "" }
        }
      );

      const updatedUser = await users.findOne({ username });
      console.log('Updated user:', updatedUser);

      return true;
    }
    return false;
  } catch (error) {
    console.error('Registration verification error:', error);
    console.error('Registration response:', response);
    return false;
  }
}

// 출석 체크를 위한 인증 옵션 생성
export async function getAuthenticationOptions(rpID: string) {
  console.log('Generating authentication options for RPID:', rpID);
  

    const client = await clientPromise;
    const db = client.db('ncamp');
    const users = db.collection<User>('users');

  
    const options = await generateAuthenticationOptions({
      rpID,
      timeout: 60000,
      userVerification: 'required',
      allowCredentials: [],
    });
  

    await users.updateOne(
      { username: 'test-user' },
      { $set: { currentChallenge: options.challenge } }
    );

  
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
    const db = client.db('ncamp');
    const users = db.collection<User>('users');

    console.log('Authentication attempt with credential ID:', response.id);
    const searchCredentialId = Buffer.from(response.id, 'base64url');
    
    const user = await users.findOne({
      'devices.credentialID': searchCredentialId,
    });

    console.log('Found user:', user ? user.username : 'none');

    if (!user) throw new Error('User not found');

    // Binary를 Buffer로 변환
    const devices = user.devices.map((d: Device) => {
      console.log('Processing device:', {
        credentialID: d.credentialID.toString('base64url'),
        counter: d.counter,
      });
      return {
        ...d,
        credentialID: Buffer.from(d.credentialID.buffer),
        publicKey: Buffer.from(d.publicKey.buffer),
      };
    });

    const device = devices.find(
      (d) => Buffer.compare(d.credentialID, searchCredentialId) === 0
    );

    if (!device) {
      console.log('Available device IDs:', devices.map(d => d.credentialID.toString('base64url')));
      throw new Error('Device not found');
    }

    console.log('Found matching device with counter:', device.counter);

    const verification = await verifyAuthenticationResponse({
      response,
      expectedOrigin: origin,
      expectedRPID: rpID,
      expectedChallenge: user.currentChallenge || '',
      credential: {
        id: response.id,
        publicKey: device.publicKey,
        counter: device.counter
      }
    });

    console.log('Verification result:', verification);

    if (verification.verified) {
      await users.updateOne(
        { 
          username: user.username,
          'devices.credentialID': device.credentialID 
        },
        { 
          $set: { 'devices.$.counter': verification.authenticationInfo.newCounter }
        }
      );

      const attendanceSession = {
        userId: user._id,
        username: user.username,
        timestamp: new Date(),
        sessionId: new Date().toISOString(),
      };

      await db.collection('attendanceSessions').insertOne(attendanceSession);
      console.log('Attendance recorded for user:', user.username);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Authentication error:', error);
    console.error('Authentication response:', response);
    return false;
  }
}