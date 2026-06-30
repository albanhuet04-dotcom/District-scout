'use client';
import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/useAuth';
import RequireAuth from '../../components/RequireAuth';
import Navbar from '../../components/Navbar';
import PageImage from '../../components/PageImage';

const EMPTY = { title: '', date: '', time: '', troupe: '', location: '', description: '', reminder_days_before: 3 };

function AgendaContent() {
  const supabase = createClient();
  const { isAdmin, profile } = useAuth();
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);

  async function load() {
    const { data } = await supabase.from('events').select('*').order('date');
    setEvents(data || []);
  }
  useEffect(() => { load(); }, []);

  function openNew() { setForm({ ...EMPTY }); setEditingId(null); }
  function openEdit(ev) { setForm({ ...ev }); setEditingId(ev.id); }
  function closeForm() { setForm(null); setEditingId(null); }

  async function save() {
    if (!form.title || !form.date) { alert('Titre et date sont requis.'); return; }
    if (editingId) {
      await supabase.from('events').update({ ...form, reminder_sent: false }).eq('id', editingId);
    } else {
      await supabase.from('events').insert({ ...form, created_by: profile?.id });
    }
    closeForm();
    load();
  }

  async function remove(id) {
    if (!confirm('Supprimer cet événement ?')) return;
    await supabase.from('events').delete().eq('id', id);
    load();
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter(e => e.date >= today);
  const past = events.filter(e => e.date < today);

  return (
    <>
      <Navbar />
      <div className="wrap">
        <PageImage pageKey="agenda" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ color: 'var(--green-dark)', margin: 0 }}>Agenda du district</h2>
          {isAdmin && !form && <button className="btn primary" onClick={openNew}>+ Ajouter un événement</button>}
        </div>

        {form && (
          <div className="form-card">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-row"><label>Titre</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Camp d'hiver" /></div>
              <div className="form-row"><label>Date</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
              <div className="form-row"><label>Heure (optionnel)</label><input type="time" value={form.time || ''} onChange={e => setForm({ ...form, time: e.target.value })} /></div>
              <div className="form-row"><label>Lieu</label><input value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Ex: Local du district" /></div>
              <div className="form-row"><label>Troupe concernée (vide = toutes)</label><input value={form.troupe || ''} onChange={e => setForm({ ...form, troupe: e.target.value })} placeholder="Ex: Troupe 3" /></div>
              <div className="form-row">
                <label>Rappel envoyé (jours avant)</label>
                <select value={form.reminder_days_before} onChange={e => setForm({ ...form, reminder_days_before: parseInt(e.target.value) })}>
                  <option value={1}>1 jour avant</option>
                  <option value={3}>3 jours avant</option>
                  <option value={7}>1 semaine avant</option>
                  <option value={14}>2 semaines avant</option>
                  <option value={0}>Pas de rappel</option>
                </select>
              </div>
            </div>
            <div className="form-row"><label>Description</label><textarea rows={3} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn primary" onClick={save}>Enregistrer</button>
              <button className="btn" onClick={closeForm}>Annuler</button>
            </div>
          </div>
        )}

        <h3 style={{ color: 'var(--green-dark)' }}>À venir</h3>
        {upcoming.length === 0 && <div className="empty">Aucun événement à venir.</div>}
        {upcoming.map(ev => <EventCard key={ev.id} ev={ev} isAdmin={isAdmin} onEdit={() => openEdit(ev)} onDelete={() => remove(ev.id)} />)}

        {past.length > 0 && (
          <>
            <h3 style={{ color: 'var(--green-dark)', marginTop: 24 }}>Passés</h3>
            {past.map(ev => <EventCard key={ev.id} ev={ev} isAdmin={isAdmin} onEdit={() => openEdit(ev)} onDelete={() => remove(ev.id)} muted />)}
          </>
        )}
      </div>
    </>
  );
}

function EventCard({ ev, isAdmin, onEdit, onDelete, muted }) {
  return (
    <div className="card" style={muted ? { opacity: 0.6 } : {}}>
      <div className="meta">
        {new Date(ev.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        {ev.time ? ` à ${ev.time}` : ''}
        {ev.location ? ` · ${ev.location}` : ''}
        {ev.troupe ? <span className="tag" style={{ marginLeft: 6 }}>{ev.troupe}</span> : null}
      </div>
      <h3>{ev.title}</h3>
      {ev.description && <p style={{ margin: '6px 0 0', fontSize: 14 }}>{ev.description}</p>}
      {isAdmin && (
        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          <button className="btn" onClick={onEdit}>Modifier</button>
          <button className="btn danger" onClick={onDelete}>Supprimer</button>
        </div>
      )}
    </div>
  );
}

export default function AgendaPage() {
  return <RequireAuth><AgendaContent /></RequireAuth>;
}
