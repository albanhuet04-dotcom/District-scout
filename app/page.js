'use client';
import { useEffect, useState } from 'react';
import { createClient } from '../lib/supabaseClient';
import { useAuth } from '../lib/useAuth';
import RequireAuth from '../components/RequireAuth';
import Navbar from '../components/Navbar';
import PageImage from '../components/PageImage';
import NotificationSetup from '../components/NotificationSetup';

function HomeContent() {
  const supabase = createClient();
  const { profile } = useAuth();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    supabase.from('events').select('*').gte('date', today).order('date').limit(3)
      .then(({ data }) => setEvents(data || []));
  }, []);

  return (
    <>
      <Navbar />
      <div className="wrap">
        <PageImage pageKey="home" />
        <h2 style={{ color: 'var(--green-dark)' }}>Bienvenue {profile ? profile.full_name.split(' ')[0] : ''}</h2>
        <div className="card">
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>
            Cet espace centralise tout ce dont les chefs de troupe ont besoin : agenda du district avec rappels,
            base documentaire, fiches d'accompagnement et organigramme du district.
          </p>
        </div>
        <NotificationSetup />
        <h3 style={{ color: 'var(--green-dark)', marginTop: 28 }}>Prochains événements</h3>
        {events.length === 0 && <div className="empty">Aucun événement à venir.</div>}
        {events.map(ev => (
          <div className="card" key={ev.id}>
            <div className="meta">
              {new Date(ev.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              {ev.time ? ` à ${ev.time}` : ''}
              {ev.troupe ? <span className="tag" style={{ marginLeft: 6 }}>{ev.troupe}</span> : null}
            </div>
            <h3>{ev.title}</h3>
          </div>
        ))}
      </div>
    </>
  );
}

export default function Home() {
  return <RequireAuth><HomeContent /></RequireAuth>;
}
