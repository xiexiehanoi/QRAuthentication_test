// app/passkey-registration/page.tsx
'use client';

import { handleRegistration } from '@/lib/actions';
import RegistrationForm from './RegistrationForm';
import { useEffect, useState } from 'react';

export default function PasskeyRegistrationPage() {
  const [options, setOptions] = useState<any>(null);

  useEffect(() => {
    const initRegistration = async () => {
      const rpID = window.location.hostname;
      const origin = window.location.origin;
      const registrationOptions = await handleRegistration('test-user', rpID, origin);
      setOptions(registrationOptions);
    };

    initRegistration();
  }, []);

  if (!options) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <RegistrationForm 
        registrationOptions={options}
        username="test-user" 
      />
    </div>
  );
}