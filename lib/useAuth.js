'use client';
import { useEffect, useState } from 'react';
import { createClient } from './supabaseClient';

export function useAuth() {
  const supabase = createClient();
  const [session, setSession] = useState(undefined); // undefined = chargement
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return; // session pas encore connue
    if (session === null) { setProfile(null); setProfileLoading(false); return; }
    setProfileLoading(true);
    supabase.from('profiles').select('*').eq('id', session.user.id).single()
      .then(({ data }) => { setProfile(data); setProfileLoading(false); });
  }, [session]);

  return {
    loading: session === undefined || (session && profileLoading),
    session,
    profile,
    isAdmin: profile?.role === 'admin',
    signOut: () => supabase.auth.signOut(),
  };
}
