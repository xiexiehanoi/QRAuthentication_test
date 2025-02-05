// app/passkey-registration/passkey-registration-client.tsx
'use client';

import { useState } from 'react';
import { beginRegistrationAction, finishRegistrationAction } from './actions';

export default function PasskeyRegistrationClient() {
  const [message, setMessage] = useState('');

  async function handleRegister() {
    try {
      // 1. 등록 옵션 생성 및 challenge 저장 (쿠키에)
      const opts = await beginRegistrationAction();

      // 만약 excludeCredentials가 존재한다면, 각 항목의 id를 string에서 Uint8Array로 변환합니다.
      const modifiedExcludeCredentials = opts.excludeCredentials?.map((cred: any) => ({
        ...cred,
        id: Uint8Array.from(atob(cred.id), (c) => c.charCodeAt(0)),
      }));

      // 2. WebAuthn API는 Uint8Array 형태의 challenge와 user.id를 요구합니다.
      const publicKeyOptions = {
        ...opts,
        challenge: Uint8Array.from(atob(opts.challenge), (c) => c.charCodeAt(0)),
        user: {
          ...opts.user,
          id: Uint8Array.from(atob(opts.user.id), (c) => c.charCodeAt(0)),
        },
        excludeCredentials: modifiedExcludeCredentials,
      };

      // 3. WebAuthn API 호출 → 아이폰 Safari에서 FaceID 프롬프트 노출
      const credential: PublicKeyCredential | null = await navigator.credentials.create({
        publicKey: publicKeyOptions,
      }) as PublicKeyCredential | null;

      if (!credential) {
        setMessage('등록에 실패하였습니다.');
        return;
      }

      // 4. 응답 데이터를 JSON 직렬화 가능한 형태로 변환
      const attestationResponse = credential.response as AuthenticatorAttestationResponse;
      const registrationResponse = {
        id: credential.id,
        rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
        type: credential.type,
        response: {
          attestationObject: btoa(
            String.fromCharCode(...new Uint8Array(attestationResponse.attestationObject))
          ),
          clientDataJSON: btoa(
            String.fromCharCode(...new Uint8Array(attestationResponse.clientDataJSON))
          ),
        },
        // 클라이언트에서는 challenge 정보를 보내지 않습니다. 쿠키에 저장된 값을 사용합니다.
      };

      // 5. attestation 응답 검증 및 사용자 등록 처리
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
