'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Sidebar } from '@/components/layout/Sidebar';
import { KeepAliveProvider } from '@/components/providers/KeepAliveProvider';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <KeepAliveProvider>
      <div className="flex h-screen overflow-hidden bg-[#F5F7F6]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-[#F5F7F6] p-6">{children}</main>
      </div>
    </KeepAliveProvider>
  );
}
