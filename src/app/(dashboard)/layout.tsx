import { Sidebar } from '@/components/dashboard/Sidebar';
import { AuthGate } from '@/components/auth/AuthGate';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="app-shell">
        <Sidebar />
        <main className="app-main">{children}</main>
      </div>
    </AuthGate>
  );
}
