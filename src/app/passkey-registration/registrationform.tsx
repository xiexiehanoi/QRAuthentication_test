'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */


import { useRef, useState, FormEvent } from 'react';

export default function RegistrationForm({ registrationOptions }: { registrationOptions: any }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState('');

  const handleRegister = async () => {
    try {
      const credential = (await navigator.credentials.create({
        publicKey: registrationOptions,
      })) as PublicKeyCredential;
      // toJSON()는 브라우저에 따라 구현되어 있을 수 있음. 없다면 직접 헬퍼 함수를 사용하세요.
      const credentialJson = (credential as any).toJSON();
      if (formRef.current) {
        const input = formRef.current.elements.namedItem('registrationResponse') as HTMLInputElement;
        input.value = JSON.stringify(credentialJson);
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
      const response = await fetch('/api/verifyRegistration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData)),
      });
      const result = await response.json();
      setMessage(result.verified ? 'Registration successful!' : 'Registration failed.');
    } catch (err: any) {
      console.error(err);
      setMessage('Error during registration.');
    }
  };

  return (
    <div>
      <h1>Passkey Registration</h1>
      <form ref={formRef} onSubmit={onSubmit}>
        <input type="hidden" name="registrationResponse" />
      </form>
      <button onClick={handleRegister}>Register using Face ID</button>
      {message && <p>{message}</p>}
    </div>
  );
}
