'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

const statutLabels = {
  actif: { texte: 'Moto en règle', couleur: 'var(--verified)', alerte: false },
  volee: { texte: 'ATTENTION — Signalée volée', couleur: 'var(--rejected)', alerte: true },
  signale_chauffeur: { texte: 'Signalement en cours de vérification', couleur: 'var(--pending)', alerte: true },
  recuperee: { texte: 'Récupérée', couleur: 'var(--verified)', alerte: false },
  vendue: { texte: 'Vendue', couleur: 'var(--text-muted)', alerte: false },
  hors_service: { texte: 'Hors service', couleur: 'var(--text-muted)', alerte: false },
};

function VerifierForm() {
  const searchParams = useSearchParams();
  const codeUrl = searchParams.get('code');
  const [code, setCode] = useState(codeUrl || '');
  const [resultat, setResultat] = useState(null);
  const [status, setStatus] = useState('idle');

  async function verifier(c) {
    setStatus('loading');
    const { data, error } = await supabase.rpc('verifier_moto', { p_code: c.trim() });
    if (error || !data || data.length === 0) {
      setStatus('notfound');
      return;
    }
    setResultat(data[0]);
    setStatus('found');
  }

  useEffect(() => {
    if (codeUrl) verifier(codeUrl);
  }, [codeUrl]);

  function handleSubmit(e) {
    e.preventDefault();
    verifier(code);
  }

  return (
    <div className="shell" style={{ maxWidth: 460 }}>
      <div className="topbar">
        <div>
          <h1>Vérifier une moto</h1>
          <div className="who">Sécurité Taxis-Motos</div>
        </div>
      </div>

      <div className="card">
        {status !== 'found' && (
          <>
            <p className="hint">
              Entrez le code trouvé sur la moto pour vérifier si elle est en règle.
            </p>
            <form onSubmit={handleSubmit}>
              <label htmlFor="code">Code de la moto</label>
              <input id="code" data-mono="true" value={code} onChange={(e) => setCode(e.target.value)} required />
              {status === 'notfound' && (
                <p className="hint" style={{ color: 'var(--rejected)' }}>
                  Ce code n&rsquo;est pas reconnu.
                </p>
              )}
              <button className="btn-primary" type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? 'Vérification…' : 'Vérifier'}
              </button>
            </form>
          </>
        )}

        {status === 'found' && resultat && (
          <div>
            <h2>{resultat.plaque_immatriculation}</h2>
            <p style={{ fontSize: 17, fontWeight: 'bold', color: statutLabels[resultat.statut]?.couleur || 'var(--text)' }}>
              {statutLabels[resultat.statut]?.alerte ? '🚨 ' : '✅ '}
              {statutLabels[resultat.statut]?.texte || resultat.statut}
            </p>
            <p className="hint">{resultat.nom_syndicat}</p>
            {statutLabels[resultat.statut]?.alerte && (
              <div style={{ marginTop: 16 }}>
                <p className="hint" style={{ color: 'var(--text)' }}>
                  Si vous avez retrouvé cette moto, merci de contacter :
                </p>
                <p className="hint" data-mono="true" style={{ color: 'var(--text)', fontSize: 16 }}>
                  {resultat.contact_gare || 'Rendez-vous au commissariat le plus proche'}
                </p>
              </div>
            )}
            <button className="btn-ghost" style={{ marginTop: 16 }} onClick={() => setStatus('idle')}>
              Nouvelle vérification
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Verifier() {
  return (
    <Suspense fallback={null}>
      <VerifierForm />
    </Suspense>
  );
}
