// app/passkey-registration-qr/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { v4 as uuidv4 } from 'uuid';

export default function PasskeyRegistrationQRPage() {
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    setSessionId(uuidv4());
  }, []);

  if (!sessionId) return <p>로딩중...</p>;

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Passkey 등록 QR 코드</h1>
      <p>Session ID: {sessionId}</p>
      <QRCodeCanvas
        value={`${window.location.origin}/passkey-registration?sessionId=${sessionId}`}
        size={300}
      />
    </div>
  );
}
