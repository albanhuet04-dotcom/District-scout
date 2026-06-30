'use client';
import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/useAuth';
import RequireAuth from '../../components/RequireAuth';
import Navbar from '../../components/Navbar';
import PageImage from '../../components/PageImage';

const EMPTY = { name: '', role: '', troupe: '', level: 1, email: '', phone: '', photo_url: '' };

function ContactsContent() {
  const supabase = createClient();
  const { isAdmin } = useAuth();
  const [people, setPeople] = useState([]);
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);

  async function load() {
    const { data } = await supabase.from('org_chart').select('*').order('level').order('troupe').order('order_index');
    setPeople(data || []);
  }
  useEffect(() => { load(); }, []);

  function openNew() { setForm({ ...EMPTY }); setEditingId(null); }
  function openEdit(p) { setForm({ ...p }); setEditingId(p.id); }
  function closeForm() { setForm(null); setEditingId(null); }

  async function save() {
    if (!form.name || !form.role) { alert('Nom et rôle sont requis.'); return; }
    if (editingId) await supabase.from('org_chart').update(form).eq('id', editingId);
    else await supabase.from('org_chart').insert(form);
    closeForm(); load();
  }
  async function remove(id) {
    if (!confirm('Supprimer cette personne ?')) return;
    await supabase.from('org_chart').delete().eq('id', id);
    load();
  }

  const district = people.filter(p => p.level === 0);
  const byTroupe = {};
  people.filter(p => p.level === 1).forEach(p => { (byTroupe[p.troupe || 'Sans troupe'] ||= []).push(p); });

  return (
    <>
      <Navbar />
      <div className="wrap">
        <PageImage pageKey="contacts" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ color: 'var(--green-dark)', margin: 0 }}>Organigramme du district</h2>
          {isAdmin && !form && <button className="btn primary" onClick={openNew}>+ Ajouter une personne</button>}
        </div>

        {form && (
          <div className="form-card">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-row"><label>Nom</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="form-row"><label>Rôle</label><input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="Chef de district, Chef de troupe, Adjoint..." /></div>
              <div className="form-row">
                <label>Niveau</label>
                <select value={form.level} onChange={e => setForm({ ...form, level: parseInt(e.target.value) })}>
                  <option value={0}>District (sommet)</option>
                  <option value={1}>Troupe</option>
                </select>
              </div>
              <div className="form-row"><label>Troupe (si niveau Troupe)</label><input value={form.troupe || ''} onChange={e => setForm({ ...form, troupe: e.target.value })} placeholder="Ex: Troupe 3" /></div>
              <div className="form-row"><label>Email</label><input value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div className="form-row"><label>Téléphone</label><input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div className="form-row"><label>URL photo (optionnel)</label><input value={form.photo_url || ''} onChange={e => setForm({ ...form, photo_url: e.target.value })} placeholder="https://..." /></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn primary" onClick={save}>Enregistrer</button>
              <button className="btn" onClick={closeForm}>Annuler</button>
            </div>
          </div>
        )}

        {people.length === 0 && <div className="empty">L'organigramme est vide pour le moment.</div>}

        {district.length > 0 && (
          <div className="org-level">
            {district.map(p => <PersonCard key={p.id} p={p} isAdmin={isAdmin} onEdit={() => openEdit(p)} onDelete={() => remove(p.id)} />)}
          </div>
        )}

        {Object.keys(byTroupe).sort().map(troupe => (
          <div className="org-troupe-block" key={troupe}>
            <div className="org-troupe-title">{troupe}</div>
            <div className="org-level" style={{ marginBottom: 0 }}>
              {byTroupe[troupe].map(p => <PersonCard key={p.id} p={p} isAdmin={isAdmin} onEdit={() => openEdit(p)} onDelete={() => remove(p.id)} />)}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function PersonCard({ p, isAdmin, onEdit, onDelete }) {
  return (
    <div className="org-card">
      {p.photo_url ? <img src={p.photo_url} alt={p.name} /> : (
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--green-light)', color: 'var(--green-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', fontWeight: 600 }}>
          {p.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
        </div>
      )}
      <div style={{ fontWeight: 500, fontSize: 14 }}>{p.name}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.role}</div>
      {p.email && <div style={{ fontSize: 11, marginTop: 4 }}><a href={`mailto:${p.email}`}>{p.email}</a></div>}
      {p.phone && <div style={{ fontSize: 11 }}>{p.phone}</div>}
      {isAdmin && (
        <div style={{ marginTop: 8, display: 'flex', gap: 6, justifyContent: 'center' }}>
          <button className="btn" style={{ padding: '4px 8px', fontSize: 11 }} onClick={onEdit}>Modifier</button>
          <button className="btn danger" style={{ padding: '4px 8px', fontSize: 11 }} onClick={onDelete}>Suppr.</button>
        </div>
      )}
    </div>
  );
}

export default function ContactsPage() {
  return <RequireAuth><ContactsContent /></RequireAuth>;
}
