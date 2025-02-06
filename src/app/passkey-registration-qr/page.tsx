// src/app/passkey-registration-qr/page.tsx
'use client';

import { QRCodeCanvas } from 'qrcode.react';
import { useEffect, useState } from 'react';

export default function PasskeyRegistrationQRPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/android|iPad|iPhone|iPod/i.test(ua)) {
      setIsMobile(true);
    }
  }, []);

  if (isMobile) {
    return <p>이 페이지는 데스크탑에서 열어 QR 코드를 스캔하세요.</p>;
  }

  const url =
    typeof window !== 'undefined'
      ? window.location.origin + '/passkey-registration'
      : '';

  return (
    <div>
      <h1>Scan this QR code with your iPhone for Registration</h1>
      <QRCodeCanvas value={url} size={256} />
    </div>
  );
}
