'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectToCrmWa() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/crm-wa');
  }, [router]);

  return null;
}
