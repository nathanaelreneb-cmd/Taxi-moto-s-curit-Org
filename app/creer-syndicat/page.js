'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function CreerSyndicat() {
  const [nomSyndicat, setNomSyndicat] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nom } },
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

    const { error: rpcError } = await supabase.rpc('creer_syndicat', {
      p_nom_syndicat: nomSyndicat,
      p_nom_utilisateur: nom,
    });

    setLoading(false);
    if (rpcError) {
      setError("Le compte a été créé, mais la création du syndicat a échoué. Contactez le support.");
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
          <h2>Syndicat créé !</h2>
          <p className="hint">
            Votre syndicat « {nomSyndicat} » est prêt. Connectez-vous pour commencer à ajouter
            vos gares et vos agents.
          </p>
          <Link href="/login">Se connecter</Link>
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
        <h2>Créer le compte de mon syndicat</h2>
        <p className="hint">
          Vous devenez automatiquement l&rsquo;administrateur de ce syndicat — vous pourrez
          ensuite ajouter vos gares et inviter vos agents.
        </p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="nomSyndicat">Nom du syndicat</label>
          <input id="nomSyndicat" required value={nomSyndicat} onChange={(e) => setNomSyndicat(e.target.value)} />
          <label htmlFor="nom">Votre nom complet</label>
          <input id="nom" required value={nom} onChange={(e) => setNom(e.target.value)} />
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <label htmlFor="password">Mot de passe</label>
          <input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="error">{error}</p>}
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Création...' : 'Créer mon syndicat'}
          </button>
        </form>
      </div>
      <p className="hint">
        Déjà un compte ? <Link href="/login">Se connecter</Link>
      </p>
    </div>
  );
}
