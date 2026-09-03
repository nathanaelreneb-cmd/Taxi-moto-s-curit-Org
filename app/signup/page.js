'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function Signup() {
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nom, telephone } },
    });
    setLoading(false);
    if (error) {
      setError(error.message.includes('already registered')
        ? 'Un compte existe déjà avec cet email.'
        : "Impossible de créer le compte. Vérifiez les informations.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="shell">
        <div className="topbar">
          <h1>Sécurité Taxis-Motos</h1>
        </div>
        <div className="card">
          <h2>Demande envoyée</h2>
          <p className="hint">
            Votre compte a été créé mais reste inactif. Un responsable du syndicat doit
            l'activer et vous assigner à une gare avant que vous puissiez enregistrer des
            chauffeurs ou des motos. Vous serez informé une fois activé.
          </p>
          <Link href="/login">Retour à la connexion</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="shell">
      <div className="topbar">
        <h1>Sécurité Taxis-Motos</h1>
      </div>
      <div className="card">
        <h2>Demander un accès</h2>
        <p className="hint">Votre compte sera activé par un responsable avant utilisation.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="nom">Nom complet</label>
          <input id="nom" required value={nom} onChange={(e) => setNom(e.target.value)} />
          <label htmlFor="telephone">Téléphone</label>
          <input id="telephone" required value={telephone} onChange={(e) => setTelephone(e.target.value)} />
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <label htmlFor="password">Mot de passe</label>
          <input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="error">{error}</p>}
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Envoi...' : 'Créer ma demande'}
          </button>
        </form>
      </div>
      <p className="hint">
        Déjà un compte ? <Link href="/login">Se connecter</Link>
      </p>
    </div>
  );
}
