'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, login } from '@/lib/auth';

// Kiosk default credentials - автомат нэвтрэлт
const KIOSK_CREDENTIALS = {
  corporate_id: '9915513',
  password: 'M0ng0l123',
};

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const checkAndLogin = async () => {
      if (!isAuthenticated()) {
        try {
          console.log('[AuthGuard] Автомат нэвтрэлт хийж байна...');
          await login(KIOSK_CREDENTIALS);
          console.log('[AuthGuard] Нэвтрэлт амжилттай');
          setIsReady(true);
        } catch (error) {
          console.error('[AuthGuard] Нэвтрэлт амжилтгүй:', error);
          setAuthError(error instanceof Error ? error.message : 'Нэвтрэлт амжилтгүй');
          // Fallback: redirect to login page
          router.push('/login');
        }
      } else {
        setIsReady(true);
      }
    };

    checkAndLogin();
  }, [router]);

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center p-8">
          <div className="text-red-500 text-xl mb-4">Нэвтрэлт амжилтгүй</div>
          <p className="text-zinc-600 mb-4">{authError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Дахин оролдох
          </button>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-zinc-500">Нэвтэрч байна...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
