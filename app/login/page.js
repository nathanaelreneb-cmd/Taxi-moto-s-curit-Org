'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("Connexion impossible. Vérifiez l'email et le mot de passe.");
      return;
    }
    router.replace('/dashboard');
  }

  return (
    <div className="shell">
      <div className="topbar">
        <h1>Sécurité Taxis-Motos</h1>
      </div>
      <div className="card">
        <h2>Connexion</h2>
        <p className="hint">Accès réservé aux agents et responsables du syndicat.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <label htmlFor="password">Mot de passe</label>
          <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="error">{error}</p>}
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
      <p className="hint">
        Pas encore de compte ? <Link href="/signup">Demander un accès</Link>
      </p>
    </div>
  );
}
