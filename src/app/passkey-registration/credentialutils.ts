// src/app/passkey-registration/credentialUtils.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

export function bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (const b of bytes) {
      binary += String.fromCharCode(b);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
  
  export function credentialToJSON(cred: any): any {
    if (cred instanceof ArrayBuffer) {
      return bufferToBase64(cred);
    } else if (Array.isArray(cred)) {
      return cred.map((item) => credentialToJSON(item));
    } else if (cred !== null && typeof cred === 'object') {
      const obj: Record<string, any> = {};
      for (const key in cred) {
        if (Object.prototype.hasOwnProperty.call(cred, key)) {
          obj[key] = credentialToJSON(cred[key]);
        }
      }
      return obj;
    }
    return cred;
  }
  