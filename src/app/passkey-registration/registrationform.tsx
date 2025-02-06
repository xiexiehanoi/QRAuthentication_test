// app/passkey-registration/RegistrationForm.tsx
'use client';

import { useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import { verifyAndSaveRegistration } from '@/lib/actions';

interface RegistrationFormProps {
  registrationOptions: any;
  username: string;
}

export default function RegistrationForm({ registrationOptions, username }: RegistrationFormProps) {
  const [message, setMessage] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegister = async () => {
    try {
      setIsRegistering(true);
      setMessage('Starting registration...');
      
      const attestation = await startRegistration(registrationOptions);
      const rpID = window.location.hostname;
      const origin = window.location.origin;
      const verified = await verifyAndSaveRegistration(username, attestation, rpID, origin);
      
      setMessage(verified ? 'Registration successful!' : 'Registration failed.');
    } catch (err: any) {
      console.error(err);
      setMessage(`Error: ${err.message || 'Registration failed'}`);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6">
      <h1 className="text-2xl font-bold mb-4">Passkey Registration</h1>
      <button 
        onClick={handleRegister}
        disabled={isRegistering}
        className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {isRegistering ? 'Registering...' : 'Register using Face ID'}
      </button>
      {message && (
        <p className={`mt-4 p-2 rounded ${
          message.includes('successful') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </p>
      )}
    </div>
  );
}