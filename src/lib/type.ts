// lib/type.ts
import { ObjectId } from 'mongodb';
import type { 
  PublicKeyCredentialCreationOptionsJSON,
} from '@simplewebauthn/typescript-types';

export interface Device {
  credentialID: Buffer;
  publicKey: Buffer;
  counter: number;
}

export interface User {
  _id?: ObjectId;
  username: string;
  devices: Device[];
  currentChallenge?: string;
}

export interface RegistrationError extends Error {
  message: string;
  name: string;
}

export interface AuthenticationError extends Error {
  message: string;
  name: string;
}

export interface RegistrationState {
  loading: boolean;
  error: string | null;
  options: PublicKeyCredentialCreationOptionsJSON | null;
}

export interface AuthenticationState {
  loading: boolean;
  error: string | null;
  options: PublicKeyCredentialCreationOptionsJSON | null;
}