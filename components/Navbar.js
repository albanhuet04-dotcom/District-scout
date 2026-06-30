'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/useAuth';

const TABS = [
  { href: '/', label: 'Accueil' },
  { href: '/agenda', label: 'Agenda' },
  { href: '/documents', label: 'Documents' },
  { href: '/support', label: 'Support chef' },
  { href: '/contacts', label: 'Organigramme' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { profile, isAdmin, signOut } = useAuth();

  return (
    <div className="wrap">
      <header className="topbar">
        <Link href="/" className="brand">🌲 District Scout</Link>
        <div className="right">
          {profile && <span>{profile.full_name}</span>}
          {isAdmin && <span className="tag">Admin</span>}
          <button className="btn" onClick={signOut}>Déconnexion</button>
        </div>
      </header>
      <nav className="tabs">
        {TABS.map(t => (
          <Link key={t.href} href={t.href} className={pathname === t.href ? 'active' : ''}>{t.label}</Link>
        ))}
        {isAdmin && <Link href="/parametres" className={pathname === '/parametres' ? 'active' : ''}>Paramètres</Link>}
      </nav>
    </div>
  );
}
