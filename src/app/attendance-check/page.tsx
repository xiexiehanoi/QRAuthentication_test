// app/attendance-check/page.tsx
'use client';

import { getAuthenticationOptions } from '@/lib/actions';
import AttendanceForm from './attendanceform';
import { useEffect, useState } from 'react';
import type { PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/typescript-types';

export default function AttendanceCheckPage() {
  const [options, setOptions] = useState<PublicKeyCredentialRequestOptionsJSON | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuthentication = async () => {
      try {
        const rpID = window.location.hostname;
        const authenticationOptions = await getAuthenticationOptions(rpID);
        setOptions(authenticationOptions);
      } catch (err) {
        console.log("err message: ", err)
        setError('Failed to initialize authentication');
      } finally {
        setLoading(false);
      }
    };

    initAuthentication();
  }, []);

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-600">{error}</div>;
  }

  if (!options) {
    return <div className="p-4 text-center">Failed to load authentication options</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <AttendanceForm authenticationOptions={options} />
    </div>
  );
}