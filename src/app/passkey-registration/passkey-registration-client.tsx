// app/passkey-registration/passkey-registration-client.tsx
'use client';

import { useState } from 'react';
import { beginRegistrationAction, finishRegistrationAction } from './actions';

export default function PasskeyRegistrationClient() {
  const [message, setMessage] = useState('');

  async function handleRegister() {
    try {
      const opts = await beginRegistrationAction();

      const modifiedExcludeCredentials = opts.excludeCredentials?.map((cred: { id: string; [key: string]: any }) => ({
        ...cred,
        id: Uint8Array.from(atob(cred.id), (c) => c.charCodeAt(0)),
      }));

      const publicKeyOptions = {
        ...opts,
        challenge: Uint8Array.from(atob(opts.challenge), (c) => c.charCodeAt(0)),
        user: {
          ...opts.user,
          id: Uint8Array.from(atob(opts.user.id), (c) => c.charCodeAt(0)),
        },
        excludeCredentials: modifiedExcludeCredentials,
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyOptions,
      }) as PublicKeyCredential | null;

      if (!credential) {
        setMessage('등록에 실패하였습니다.');
        return;
      }

      const attestationResponse = credential.response as AuthenticatorAttestationResponse;
      const registrationResponse = {
        id: credential.id,
        rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
        type: credential.type,
        response: {
          attestationObject: btoa(String.fromCharCode(...new Uint8Array(attestationResponse.attestationObject))),
          clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(attestationResponse.clientDataJSON))),
        },
      };

      const result = await finishRegistrationAction(registrationResponse);
      setMessage(result.success ? "등록이 완료되었습니다." : "등록 실패");
    } catch (error: any) {
      console.error(error);
      setMessage(error.message || "등록 중 오류가 발생했습니다.");
    }
  }

  return (
    <div>
      <button onClick={handleRegister}>등록하기</button>
      {message && (
        <div style={{ border: '1px solid #ccc', padding: '1rem', marginTop: '1rem' }}>
          <p>{message}</p>
          <button onClick={() => setMessage('')}>닫기</button>
        </div>
      )}
    </div>
  );
}
