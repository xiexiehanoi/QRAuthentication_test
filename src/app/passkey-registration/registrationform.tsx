// src/app/passkey-registration/RegistrationForm.tsx
'use client';

import { useRef, useState, FormEvent } from 'react';
// 서버 액션은 서버 컴포넌트(page.tsx)에서 내보낸 것을 가져옵니다.
import { verifyRegistrationAction } from './page';

interface RegistrationFormProps {
  registrationOptions: any; // 필요에 따라 타입 지정
}

export default function RegistrationForm({ registrationOptions }: RegistrationFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState('');

  const handleRegister = async () => {
    try {
      const credential = (await navigator.credentials.create({
        publicKey: registrationOptions,
      })) as PublicKeyCredential;
      const credentialJson = (credential as any).toJSON();
      if (formRef.current) {
        const input = formRef.current.elements.namedItem('registrationResponse') as HTMLInputElement;
        input.value = JSON.stringify(credentialJson);
        // 직접 서버 액션을 호출 via form submission
        formRef.current.requestSubmit();
      }
    } catch (err) {
      console.error(err);
      setMessage('Error during registration.');
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(formRef.current!);
    try {
      // 서버 액션 호출
      const result = await verifyRegistrationAction(formData);
      setMessage(result ? 'Registration successful!' : 'Registration failed.');
    } catch (err: any) {
      console.error(err);
      setMessage('Error during registration.');
    }
  };

  return (
    <div>
      <h1>Passkey Registration</h1>
      <form ref={formRef} method="post" onSubmit={onSubmit}>
        <input type="hidden" name="registrationResponse" />
      </form>
      <button onClick={handleRegister}>Register using Face ID</button>
      {message && <p>{message}</p>}
    </div>
  );
}
