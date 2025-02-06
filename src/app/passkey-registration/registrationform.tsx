'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useRef, useState, FormEvent } from 'react';
import { credentialToJSON } from './credentialutils'; // 헬퍼 함수 import

export default function RegistrationForm({ registrationOptions }: { registrationOptions: any }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState('');

  const handleRegister = async () => {
    try {
      const credential = (await navigator.credentials.create({
        publicKey: registrationOptions,
      })) as PublicKeyCredential;
      // 헬퍼 함수를 사용하여 credential을 JSON으로 직렬화
      const credentialJson = credentialToJSON(credential);
      console.log("credential: ", credential)
      console.log("credentialJson: ", credentialJson)
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
      const response = await fetch('/api/verifyregistration', {
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
