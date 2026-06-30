'use client';
import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/useAuth';
import RequireAuth from '../../components/RequireAuth';
import Navbar from '../../components/Navbar';
import PageImage from '../../components/PageImage';

const EMPTY = { title: '', content: '' };

function SupportContent() {
  const supabase = createClient();
  const { isAdmin } = useAuth();
  const [sections, setSections] = useState([]);
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);

  async function load() {
    const { data } = await supabase.from('support_sections').select('*').order('order_index').order('created_at');
    setSections(data || []);
  }
  useEffect(() => { load(); }, []);

  function openNew() { setForm({ ...EMPTY }); setEditingId(null); }
  function openEdit(s) { setForm({ ...s }); setEditingId(s.id); }
  function closeForm() { setForm(null); setEditingId(null); }

  async function save() {
    if (!form.title) { alert('Le titre est requis.'); return; }
    if (editingId) await supabase.from('support_sections').update(form).eq('id', editingId);
    else await supabase.from('support_sections').insert(form);
    closeForm(); load();
  }
  async function remove(id) {
    if (!confirm('Supprimer cette fiche ?')) return;
    await supabase.from('support_sections').delete().eq('id', id);
    load();
  }

  return (
    <>
      <Navbar />
      <div className="wrap">
        <PageImage pageKey="support" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ color: 'var(--green-dark)', margin: 0 }}>Support chef de troupe</h2>
          {isAdmin && !form && <button className="btn primary" onClick={openNew}>+ Ajouter une fiche</button>}
        </div>

        {form && (
          <div className="form-card">
            <div className="form-row"><label>Titre</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Avant la rentrée scoute" /></div>
            <div className="form-row"><label>Contenu</label><textarea rows={6} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} /></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn primary" onClick={save}>Enregistrer</button>
              <button className="btn" onClick={closeForm}>Annuler</button>
            </div>
          </div>
        )}

        {sections.length === 0 && <div className="empty">Aucune fiche pour le moment.</div>}
        {sections.map(s => (
          <div className="card" key={s.id}>
            <h3>{s.title}</h3>
            <p style={{ fontSize: 14, whiteSpace: 'pre-wrap', margin: '6px 0 0' }}>{s.content}</p>
            {isAdmin && (
              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                <button className="btn" onClick={() => openEdit(s)}>Modifier</button>
                <button className="btn danger" onClick={() => remove(s.id)}>Supprimer</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export default function SupportPage() {
  return <RequireAuth><SupportContent /></RequireAuth>;
}
