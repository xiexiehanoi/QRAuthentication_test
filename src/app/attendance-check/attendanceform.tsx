// app/attendance-check/attendanceform.tsx
'use client';

import { useState } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';
import { verifyAuthentication } from '@/lib/actions';
import type { AuthenticationResponseJSON } from '@simplewebauthn/typescript-types';
import { AttendanceFormProps, AuthenticationError } from '@/lib/type';

export default function AttendanceForm({ authenticationOptions }: AttendanceFormProps) {
  const [message, setMessage] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const handleAuthenticate = async () => {
    try {
      setIsChecking(true);
      setMessage('Starting authentication...');
      
      const assertion = await startAuthentication(authenticationOptions);
      const rpID = window.location.hostname;
      const origin = window.location.origin;
      const verified = await verifyAuthentication(
        assertion as AuthenticationResponseJSON,
        rpID,
        origin
      );
      
      setMessage(verified ? 'Attendance checked successfully!' : 'Authentication failed.');
    } catch (err) {
      console.error(err);
      const error = err as AuthenticationError;
      setMessage(`Error: ${error.message || 'Authentication failed'}`);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6">
      <h1 className="text-2xl font-bold mb-4">Attendance Check</h1>
      <button 
        onClick={handleAuthenticate}
        disabled={isChecking}
        className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {isChecking ? 'Checking...' : 'Check Attendance using Face ID'}
      </button>
      {message && (
        <p className={`mt-4 p-2 rounded ${
          message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </p>
      )}
    </div>
  );
}