// src/app/attendance-check/page.tsx
import { getAuthenticationOptions, verifyAuthentication } from '../../lib/actions';
import AttendanceForm from './attendanceform';

export default async function AttendanceCheckPage() {
  const authenticationOptions = await getAuthenticationOptions();
  return <AttendanceForm authenticationOptions={authenticationOptions} />;
}

// 서버 액션: 인증 응답 검증
export async function verifyAuthenticationAction(formData: FormData) {
  const authenticationResponse = formData.get('authenticationResponse') as string;
  if (!authenticationResponse) {
    throw new Error('No authentication response provided');
  }
  const parsed = JSON.parse(authenticationResponse);
  const verified = await verifyAuthentication(parsed);
  return verified;
}
