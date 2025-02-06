// app/attendance-check/page.tsx
'use client';

import { getAuthenticationOptions } from '@/lib/actions';
import AttendanceForm from './attendanceform';
import { useEffect, useState } from 'react';
import type { PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/typescript-types';

export default function AttendanceCheckPage() {
  const [options, setOptions] = useState<PublicKeyCredentialRequestOptionsJSON | null>(null);

  useEffect(() => {
    const initAuthentication = async () => {
      const rpID = window.location.hostname;
      const authenticationOptions = await getAuthenticationOptions(rpID);
      setOptions(authenticationOptions);
    };

    initAuthentication();
  }, []);

  if (!options) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <AttendanceForm authenticationOptions={options} />
    </div>
  );
}