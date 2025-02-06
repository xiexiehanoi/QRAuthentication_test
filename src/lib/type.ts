// lib/type.ts
import { ObjectId } from 'mongodb';

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