'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabaseClient';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setInfo(''); setBusy(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/');
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName } }
        });
        if (error) throw error;
        setInfo("Compte créé. Si la confirmation par email est activée sur le projet Supabase, vérifie ta boîte mail avant de te connecter.");
        setMode('login');
      }
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 360, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🌲</div>
        <h1 style={{ color: 'var(--green-dark)', marginBottom: 4 }}>District Scout</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 14 }}>
          Espace réservé aux chefs de troupe et à l'équipe d'animation.
        </p>
        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          {mode === 'signup' && (
            <div className="form-row">
              <label>Nom complet</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Ex: Alban Huet" />
            </div>
          )}
          <div className="form-row">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="prenom@example.com" />
          </div>
          <div className="form-row">
            <label>Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>
          {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
          {info && <p style={{ color: 'var(--green-dark)', fontSize: 13 }}>{info}</p>}
          <button className="btn primary" type="submit" disabled={busy} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
            {busy ? 'Patiente...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>
        <button className="btn" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setInfo(''); }}>
          {mode === 'login' ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
        </button>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>
          Première inscription ? Un admin doit ensuite valider ton rôle dans Supabase
          (par défaut tout nouveau compte est "chef").
        </p>
      </div>
    </div>
  );
}
