// app/attendance-check/passkey-authentication-client.tsx
'use client';

import { useState } from 'react';
import { beginAuthenticationAction, finishAuthenticationAction } from './actions';

interface Props {
  sessionId: string;
}

export default function PasskeyAuthenticationClient({ sessionId }: Props) {
  const [message, setMessage] = useState('');

  async function handleAttendance() {
    try {
      // 1. 인증 옵션 생성 및 challenge 저장 (쿠키)
      const opts = await beginAuthenticationAction();

      // 변환: challenge와 user.id는 WebAuthn API가 Uint8Array를 요구합니다.
      const challenge = Uint8Array.from(atob(opts.challenge), (c) => c.charCodeAt(0));
      const user = {
        ...opts.user,
        id: Uint8Array.from(atob(opts.user.id), (c) => c.charCodeAt(0)),
      };

      // 만약 opts.allowCredentials가 존재한다면, 각 항목의 id를 변환합니다.
      const allowCredentials = opts.allowCredentials?.map((cred: { id: string; [key: string]: any }) => ({
        ...cred,
        id: Uint8Array.from(atob(cred.id), (c) => c.charCodeAt(0)),
      }));

      const publicKeyOptions = {
        ...opts,
        challenge,
        user,
        allowCredentials,
      };

      // 2. WebAuthn API 호출 → iOS Safari에서 FaceID 인증 프롬프트 노출
      const assertion = await navigator.credentials.get({
        publicKey: publicKeyOptions,
      }) as PublicKeyCredential | null;

      if (!assertion) {
        setMessage('인증에 실패하였습니다.');
        return;
      }

      const authResponse = assertion.response as AuthenticatorAssertionResponse;
      const authenticationResponse = {
        id: assertion.id,
        rawId: btoa(String.fromCharCode(...new Uint8Array(assertion.rawId))),
        type: assertion.type,
        response: {
          authenticatorData: btoa(String.fromCharCode(...new Uint8Array(authResponse.authenticatorData))),
          clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(authResponse.clientDataJSON))),
          signature: btoa(String.fromCharCode(...new Uint8Array(authResponse.signature))),
          userHandle: authResponse.userHandle
            ? btoa(String.fromCharCode(...new Uint8Array(authResponse.userHandle)))
            : null,
        },
      };

      // 3. 인증 응답 검증 및 출석 기록 저장 처리
      const result = await finishAuthenticationAction(authenticationResponse, sessionId);
      setMessage(result);
    } catch (error: unknown) {
      console.error(error);
      setMessage((error as Error).message || '출석 체크 중 오류가 발생했습니다.');
    }
  }

  return (
    <div>
      <button onClick={handleAttendance}>출석체크</button>
      {message && (
        <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #ccc' }}>
          <p>{message}</p>
        </div>
      )}
    </div>
  );
}
