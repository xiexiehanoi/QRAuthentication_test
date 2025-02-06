// src/app/attendance-check/AttendanceForm.tsx
'use client';

import { useRef, useState, FormEvent } from 'react';
import { verifyAuthenticationAction } from './page';

interface AttendanceFormProps {
  authenticationOptions: any; // 필요에 따라 타입 지정
}

export default function AttendanceForm({ authenticationOptions }: AttendanceFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState('');

  const handleAuthenticate = async () => {
    try {
      const assertion = (await navigator.credentials.get({
        publicKey: authenticationOptions,
      })) as PublicKeyCredential;
      const assertionJson = (assertion as any).toJSON();
      if (formRef.current) {
        const input = formRef.current.elements.namedItem('authenticationResponse') as HTMLInputElement;
        input.value = JSON.stringify(assertionJson);
        formRef.current.requestSubmit();
      }
    } catch (err) {
      console.error(err);
      setMessage('Error during authentication.');
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(formRef.current!);
    try {
      const result = await verifyAuthenticationAction(formData);
      setMessage(result ? 'Authentication successful!' : 'Authentication failed.');
    } catch (err: any) {
      console.error(err);
      setMessage('Error during authentication.');
    }
  };

  return (
    <div>
      <h1>Attendance Check</h1>
      <form ref={formRef} method="post" onSubmit={onSubmit}>
        <input type="hidden" name="authenticationResponse" />
      </form>
      <button onClick={handleAuthenticate}>Authenticate using Face ID</button>
      {message && <p>{message}</p>}
    </div>
  );
}
