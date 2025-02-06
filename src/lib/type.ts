// src/lib/type.ts
import { ObjectId } from 'mongodb';

export interface Device {
  credentialID: Buffer;
  publicKey: string;
  counter: number;
}

export interface User {
  _id?: ObjectId;
  username: string;
  // 등록 시 passkey 관련 정보는 devices 배열에 저장됩니다.
  devices: Device[];
  currentChallenge?: string;
  // 추가로 email, organizationId 등 필요한 필드가 있다면 여기에 추가할 수 있습니다.
  email?: string;
  organizationId?: string;
}
