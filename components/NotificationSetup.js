'use client';
import { useEffect, useState } from 'react';
import { createClient } from '../lib/supabaseClient';
import { useAuth } from '../lib/useAuth';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export default function NotificationSetup() {
  const supabase = createClient();
  const { session } = useAuth();
  const [status, setStatus] = useState('checking'); // checking | unsupported | off | on | denied

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported');
      return;
    }
    navigator.serviceWorker.register('/sw.js').then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      if (Notification.permission === 'denied') setStatus('denied');
      else setStatus(sub ? 'on' : 'off');
    });
  }, []);

  async function enable() {
    const reg = await navigator.serviceWorker.ready;
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') { setStatus('denied'); return; }
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
    });
    await supabase.from('push_subscriptions').insert({
      user_id: session.user.id,
      subscription: sub.toJSON()
    });
    setStatus('on');
  }

  if (status === 'checking' || status === 'unsupported' || status === 'on') return null;

  return (
    <div className="card" style={{ background: 'var(--green-light)', border: '1px solid var(--border)' }}>
      <h3>🔔 Active les rappels d'événements</h3>
      <p style={{ fontSize: 13, margin: '4px 0 10px' }}>
        {status === 'denied'
          ? "Les notifications sont bloquées dans ton navigateur. Autorise-les dans les réglages du site pour recevoir les rappels."
          : "Reçois une notification automatique avant chaque événement du district."}
      </p>
      {status === 'off' && <button className="btn primary" onClick={enable}>Activer les notifications</button>}
    </div>
  );
}
