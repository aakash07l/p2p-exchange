import { Sidebar } from '@/components/dashboard/Sidebar';
import { AuthGate } from '@/components/auth/AuthGate';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="app-shell">
        <Sidebar />
        <main className="flex-1 w-full min-w-0 px-6 pt-5 pb-36">{children}</main>
      </div>
    </AuthGate>
  );
}
