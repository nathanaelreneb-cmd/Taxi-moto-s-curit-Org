'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

function SignupForm() {
  const searchParams = useSearchParams();
  const syndicatId = searchParams.get('syndicat');

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

    if (!syndicatId) {
      setError(
        "Ce lien d'inscription est incomplet. Demandez le bon lien à l'administrateur de votre syndicat."
      );
      return;
    }

    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nom, telephone } },
    });

    if (signUpError) {
      setLoading(false);
      setError(
        signUpError.message.includes('already registered')
          ? 'Un compte existe déjà avec cet email.'
          : 'Impossible de créer le compte. Vérifiez les informations.'
      );
      return;
    }

    await supabase.rpc('rejoindre_syndicat', { p_syndicat_id: syndicatId });
    setLoading(false);
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
            Votre compte a été créé mais reste inactif. Un responsable de votre syndicat doit
            l&rsquo;activer et vous assigner à une gare avant que vous puissiez enregistrer des
            chauffeurs ou des motos.
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
        {!syndicatId && (
          <p className="hint" style={{ color: 'var(--rejected)' }}>
            Ce lien est incomplet — demandez le lien d&rsquo;inscription exact à votre syndicat.
          </p>
        )}
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

export default function Signup() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
