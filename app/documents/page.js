'use client';
import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/useAuth';
import RequireAuth from '../../components/RequireAuth';
import Navbar from '../../components/Navbar';
import PageImage from '../../components/PageImage';

const EMPTY = { title: '', category: '', link: '', description: '' };

function DocumentsContent() {
  const supabase = createClient();
  const { isAdmin } = useAuth();
  const [docs, setDocs] = useState([]);
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);

  async function load() {
    const { data } = await supabase.from('documents').select('*').order('category');
    setDocs(data || []);
  }
  useEffect(() => { load(); }, []);

  function openNew() { setForm({ ...EMPTY }); setEditingId(null); }
  function openEdit(d) { setForm({ ...d }); setEditingId(d.id); }
  function closeForm() { setForm(null); setEditingId(null); }

  async function save() {
    if (!form.title) { alert('Le titre est requis.'); return; }
    const payload = { ...form, category: form.category || 'Autre' };
    if (editingId) await supabase.from('documents').update(payload).eq('id', editingId);
    else await supabase.from('documents').insert(payload);
    closeForm(); load();
  }
  async function remove(id) {
    if (!confirm('Supprimer ce document ?')) return;
    await supabase.from('documents').delete().eq('id', id);
    load();
  }

  const byCat = {};
  docs.forEach(d => { (byCat[d.category] ||= []).push(d); });

  return (
    <>
      <Navbar />
      <div className="wrap">
        <PageImage pageKey="documents" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ color: 'var(--green-dark)', margin: 0 }}>Base documentaire</h2>
          {isAdmin && !form && <button className="btn primary" onClick={openNew}>+ Ajouter un document</button>}
        </div>

        {form && (
          <div className="form-card">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-row"><label>Titre</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div className="form-row"><label>Catégorie</label><input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Sécurité, Pédagogie, Camp..." /></div>
            </div>
            <div className="form-row"><label>Lien (Drive, PDF...)</label><input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="https://..." /></div>
            <div className="form-row"><label>Description</label><textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn primary" onClick={save}>Enregistrer</button>
              <button className="btn" onClick={closeForm}>Annuler</button>
            </div>
          </div>
        )}

        {Object.keys(byCat).length === 0 && <div className="empty">Aucun document pour le moment.</div>}
        {Object.keys(byCat).sort().map(cat => (
          <div key={cat}>
            <h3 style={{ color: 'var(--green-dark)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '.03em', marginTop: 22 }}>{cat}</h3>
            {byCat[cat].map(doc => (
              <div className="card" key={doc.id}>
                <h3>{doc.title}</h3>
                {doc.description && <p style={{ fontSize: 14, margin: '4px 0 0' }}>{doc.description}</p>}
                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                  {doc.link && <a className="btn primary" href={doc.link} target="_blank" rel="noopener">Ouvrir</a>}
                  {isAdmin && <button className="btn" onClick={() => openEdit(doc)}>Modifier</button>}
                  {isAdmin && <button className="btn danger" onClick={() => remove(doc.id)}>Supprimer</button>}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

export default function DocumentsPage() {
  return <RequireAuth><DocumentsContent /></RequireAuth>;
}
