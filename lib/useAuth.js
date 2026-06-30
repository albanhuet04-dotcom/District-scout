'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/useAuth';

export default function RequireAuth({ children, adminOnly = false }) {
  const { loading, session, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // attend que session + profil soient chargés
    if (!session) router.replace('/login');
    else if (adminOnly && !isAdmin) router.replace('/');
  }, [loading, session, isAdmin]);

  if (loading || !session || (adminOnly && !isAdmin)) {
    return <div className="wrap" style={{ paddingTop: 60, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement...</div>;
  }
  return children;
}
