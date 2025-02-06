// app/passkey-registration/page.tsx
'use client';

import { handleRegistration } from '@/lib/actions';
import RegistrationForm from './registrationform';
import { useState } from 'react';
import type { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/typescript-types';
import { RegistrationError } from '@/lib/type';

export default function PasskeyRegistrationPage() {
  const [options, setOptions] = useState<PublicKeyCredentialCreationOptionsJSON | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startRegistration = async () => {
    try {
      setLoading(true);
      setError(null);
      const rpID = window.location.hostname;
      const origin = window.location.origin;
      const registrationOptions = await handleRegistration('test-user', rpID, origin);
      setOptions(registrationOptions);
    } catch (err) {
      const error = err as RegistrationError;
      setError(error.message || 'Failed to start registration');
      setOptions(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => setError(null)}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!options) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Passkey Registration</h1>
        <button 
          onClick={startRegistration}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Start Registration
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <RegistrationForm 
        registrationOptions={options}
        username="test-user" 
      />
    </div>
  );
}