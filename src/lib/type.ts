// lib/type.ts
import { ObjectId } from 'mongodb';
import type { 
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON
} from '@simplewebauthn/typescript-types';

export interface Device {
  credentialID: Uint8Array;
  publicKey: Uint8Array;
  counter: number;
}

export interface User {
  _id?: ObjectId;
  username: string;
  devices: Device[];
  currentChallenge?: string;
}

// 클라이언트 컴포넌트용 Props 타입들
export interface RegistrationFormProps {
  registrationOptions: PublicKeyCredentialCreationOptionsJSON;
  username: string;
}

export interface AttendanceFormProps {
  authenticationOptions: PublicKeyCredentialRequestOptionsJSON;
}

export type RegistrationError = {
  message: string;
  name: string;
}

export type AuthenticationError = {
  message: string;
  name: string;
}

export interface RegistrationResult {
  response: RegistrationResponseJSON;
}