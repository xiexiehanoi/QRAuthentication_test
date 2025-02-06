// app/attendance-check/page.tsx
'use client';

import { getAuthenticationOptions } from '@/lib/actions';
import AttendanceForm from './attendanceform';
import { useEffect, useState } from 'react';

export default function AttendanceCheckPage() {
  const [options, setOptions] = useState<any>(null);

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