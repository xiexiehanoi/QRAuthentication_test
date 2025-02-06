// src/app/attendance-check/page.tsx
import { getAuthenticationOptions } from '@/lib/actions';
import AttendanceForm from './attendanceform';

export default async function AttendanceCheckPage() {
  const authenticationOptions = await getAuthenticationOptions();
  return <AttendanceForm authenticationOptions={authenticationOptions} />;
}
