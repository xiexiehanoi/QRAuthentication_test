// src/app/passkey-registration/page.tsx
import { getRegistrationOptions, verifyRegistration } from '../../lib/actions';
import RegistrationForm from './registrationform';

export default async function PasskeyRegistrationPage() {
  const registrationOptions = await getRegistrationOptions();
  return <RegistrationForm registrationOptions={registrationOptions} />;
}

// 서버 액션: 등록 응답 검증
export async function verifyRegistrationAction(formData: FormData) {
  const registrationResponse = formData.get('registrationResponse') as string;
  if (!registrationResponse) {
    throw new Error('No registration response provided');
  }
  const parsed = JSON.parse(registrationResponse);
  const verified = await verifyRegistration(parsed);
  return verified;
}
