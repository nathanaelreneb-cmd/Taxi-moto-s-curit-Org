'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function SignalerPerte() {
  const [telephone, setTelephone] = useState('');
  const [plaque, setPlaque] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | notfound | error

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    const { data, error } = await supabase.rpc('signaler_perte', {
      p_telephone: telephone.trim(),
      p_plaque: plaque.trim(),
    });
    if (error) {
      setStatus('error');
      return;
    }
    setStatus(data ? 'success' : 'notfound');
  }

  return (
    <div className="shell" style={{ maxWidth: 460 }}>
      <div className="topbar">
        <div>
          <h1>Signaler une moto perdue ou volée</h1>
          <div className="who">Sécurité Taxis-Motos</div>
        </div>
      </div>

      {status === 'success' ? (
        <div className="card">
          <h2>Signalement reçu</h2>
          <p className="hint">
            Un agent du syndicat va vérifier et confirmer votre signalement très prochainement.
            Rendez-vous à votre gare si possible pour accélérer la vérification.
          </p>
        </div>
      ) : (
        <div className="card">
          <p className="hint">
            Entrez votre numéro de téléphone (celui enregistré avec votre moto) et la plaque
            d&rsquo;immatriculation de la moto concernée.
          </p>
          <form onSubmit={handleSubmit}>
            <label htmlFor="telephone">Votre numéro de téléphone</label>
            <input
              id="telephone"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              required
            />
            <label htmlFor="plaque">Plaque d&rsquo;immatriculation de la moto</label>
            <input
              id="plaque"
              data-mono="true"
              value={plaque}
              onChange={(e) => setPlaque(e.target.value)}
              required
            />
            {status === 'notfound' && (
              <p className="hint" style={{ color: 'var(--rejected)' }}>
                Aucune fiche ne correspond à ces informations. Vérifiez le numéro de téléphone
                et la plaque, ou rendez-vous à votre gare.
              </p>
            )}
            {status === 'error' && (
              <p className="hint" style={{ color: 'var(--rejected)' }}>
                Une erreur est survenue. Réessayez, ou rendez-vous à votre gare.
              </p>
            )}
            <button className="btn-primary" type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Envoi…' : 'Signaler la perte'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
