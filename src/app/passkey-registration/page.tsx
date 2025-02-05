// app/passkey-registration/page.tsx
import PasskeyRegistrationClient from './passkey-registration-client';

export default function PasskeyRegistrationPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Passkey 등록하기</h1>
      <PasskeyRegistrationClient />
    </div>
  );
}
