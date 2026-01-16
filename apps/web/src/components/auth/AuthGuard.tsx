'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      if (!isAuthenticated()) {
        // Нэвтрээгүй бол login хуудас руу шилжүүлнэ
        router.push('/login');
      } else {
        setIsReady(true);
      }
    };

    checkAuth();
  }, [router]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-zinc-500">Ачаалж байна...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
