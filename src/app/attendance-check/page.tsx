// app/attendance-check/page.tsx
import PasskeyAuthenticationClient from './passkey-authentication-client';

interface AttendanceCheckPageProps {
  searchParams: {
    sessionId: string;
  };
}

export default function AttendanceCheckPage({ searchParams }: AttendanceCheckPageProps) {
  const { sessionId } = searchParams;
  return (
    <div style={{ padding: '2rem' }}>
      <h1>출석 체크</h1>
      <p>Session ID: {sessionId}</p>
      <PasskeyAuthenticationClient sessionId={sessionId} />
    </div>
  );
}
