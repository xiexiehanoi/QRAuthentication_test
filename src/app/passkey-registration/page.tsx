// src/app/passkey-registration/page.tsx
'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// 클라이언트 전용 RegistrationForm을 동적 import합니다.
const RegistrationForm = dynamic(() => import('./registrationform'), { ssr: false });

export default function PasskeyRegistrationPage() {
  const [registrationOptions, setRegistrationOptions] = useState<any>(null);

  useEffect(() => {
    fetch('/api/getRegistrationOptions')
      .then((res) => res.json())
      .then((data) => {
        console.log('Registration options:', data);
        setRegistrationOptions(data);
      })
      .catch((err) => console.error(err));
  }, []);

  if (!registrationOptions) return <p>Loading...</p>;

  return <RegistrationForm registrationOptions={registrationOptions} />;
}