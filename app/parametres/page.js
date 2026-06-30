'use client';
import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabaseClient';
import RequireAuth from '../../components/RequireAuth';
import Navbar from '../../components/Navbar';

const PAGES = [
  { key: 'home', label: "Accueil" },
  { key: 'agenda', label: "Agenda" },
  { key: 'documents', label: "Documents" },
  { key: 'support', label: "Support chef" },
  { key: 'contacts', label: "Organigramme" },
];

function ParametresContent() {
  const supabase = createClient();
  const [agseUrl, setAgseUrl] = useState('');
  const [images, setImages] = useState({});
  const [uploading, setUploading] = useState('');
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    supabase.from('settings').select('*').eq('key', 'agse_url').single()
      .then(({ data }) => setAgseUrl(data?.value || ''));
    loadImages();
    supabase.from('profiles').select('*').order('full_name').then(({ data }) => setProfiles(data || []));
  }, []);

  async function loadImages() {
    const { data } = await supabase.from('page_images').select('*');
    const map = {};
    (data || []).forEach(img => { map[img.page_key] = img; });
    setImages(map);
  }

  async function saveAgseUrl() {
    await supabase.from('settings').upsert({ key: 'agse_url', value: agseUrl });
    alert('Lien AGSE mis à jour.');
  }

  async function uploadImage(pageKey, file) {
    setUploading(pageKey);
    const ext = file.name.split('.').pop();
    const path = `${pageKey}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('images').upload(path, file, { upsert: true });
    if (upErr) { alert("Erreur d'upload: " + upErr.message); setUploading(''); return; }
    const { data: urlData } = supabase.storage.from('images').getPublicUrl(path);
    await supabase.from('page_images').delete().eq('page_key', pageKey);
    await supabase.from('page_images').insert({ page_key: pageKey, url: urlData.publicUrl });
    await loadImages();
    setUploading('');
  }

  async function removeImage(pageKey) {
    await supabase.from('page_images').delete().eq('page_key', pageKey);
    loadImages();
  }

  async function toggleRole(p) {
    const newRole = p.role === 'admin' ? 'chef' : 'admin';
    if (!confirm(`Passer ${p.full_name} en ${newRole} ?`)) return;
    await supabase.from('profiles').update({ role: newRole }).eq('id', p.id);
    setProfiles(profiles.map(x => x.id === p.id ? { ...x, role: newRole } : x));
  }

  return (
    <>
      <Navbar />
      <div className="wrap">
        <h2 style={{ color: 'var(--green-dark)' }}>Paramètres</h2>

        <div className="card">
          <h3>Lien AGSE</h3>
          <div className="form-row">
            <label>URL du site Scouts d'Europe</label>
            <input value={agseUrl} onChange={e => setAgseUrl(e.target.value)} />
          </div>
          <button className="btn primary" onClick={saveAgseUrl}>Enregistrer</button>
        </div>

        <div className="card">
          <h3>Photos d'illustration par page</h3>
          <p className="meta">Une image par page, affichée en haut. Format paysage recommandé.</p>
          {PAGES.map(pg => (
            <div key={pg.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: '1px solid var(--border)' }}>
              {images[pg.key] && <img src={images[pg.key].url} style={{ width: 70, height: 44, objectFit: 'cover', borderRadius: 6 }} />}
              <div style={{ flex: 1, fontSize: 14 }}>{pg.label}</div>
              <label className="btn" style={{ cursor: 'pointer' }}>
                {uploading === pg.key ? 'Envoi...' : (images[pg.key] ? 'Remplacer' : 'Ajouter une photo')}
                <input type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => e.target.files[0] && uploadImage(pg.key, e.target.files[0])} />
              </label>
              {images[pg.key] && <button className="btn danger" onClick={() => removeImage(pg.key)}>Retirer</button>}
            </div>
          ))}
        </div>

        <div className="card">
          <h3>Comptes</h3>
          <p className="meta">Donne le rôle "admin" aux personnes qui doivent pouvoir tout modifier.</p>
          {profiles.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderTop: '1px solid var(--border)' }}>
              <div style={{ flex: 1, fontSize: 14 }}>{p.full_name} <span className="meta">({p.email})</span></div>
              <span className="tag">{p.role}</span>
              <button className="btn" onClick={() => toggleRole(p)}>
                {p.role === 'admin' ? 'Rétrograder en chef' : 'Promouvoir admin'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function ParametresPage() {
  return <RequireAuth adminOnly><ParametresContent /></RequireAuth>;
}
