// src/model/types.ts
export interface Device {
  credentialID: Buffer; // 저장 시 Buffer 혹은 base64 string으로 관리
  publicKey: string;
  counter: number;
}

export interface User {
  _id?: any;
  username: string;
  devices: Device[];
  currentChallenge?: string;
}
