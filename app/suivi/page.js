'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../../lib/supabaseClient';

const MotoMap = dynamic(() => import('../dashboard/MotoMap'), { ssr: false });

export default function SuiviMoto() {
  const [telephone, setTelephone] = useState('');
  const [nom, setNom] = useState('');
  const [cni, setCni] = useState('');
  const [status, setStatus] = useState('idle');
  const [resultat, setResultat] = useState(null);
  const [points, setPoints] = useState([]);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    const { data, error } = await supabase.rpc('consulter_statut_moto', {
      p_telephone: telephone.trim(),
      p_nom: nom.trim(),
      p_cni: cni.trim(),
    });
    if (error || !data || data.length === 0) {
      setStatus('notfound');
      return;
    }
    const r = data[0];
    setResultat(r);
    setStatus('found');

    if (r.statut === 'volee' && r.gps_boitier_id) {
      try {
        const res = await fetch('/api/traccar/status');
        const json = await res.json();
        const device = (json.devices || []).find((d) => d.uniqueId === r.gps_boitier_id);
        if (device && device.latitude != null) {
          setPoints([
            {
              uniqueId: device.uniqueId,
              label: r.plaque_immatriculation,
              latitude: device.latitude,
              longitude: device.longitude,
              speed: device.speed,
              fixTime: device.fixTime,
              accuracy: device.accuracy,
              stolen: true,
            },
          ]);
        }
      } catch (e) {
        // silencieux — le statut texte reste affiché même si la carte échoue
      }
    }
  }

  const labels = {
    actif: 'En circulation normale',
    signale_chauffeur: 'Votre signalement est en cours de vérification par un agent',
    volee: 'Signalée volée — recherche en cours',
    recuperee: 'Récupérée',
    vendue: 'Vendue',
    hors_service: 'Hors service',
  };

  return (
    <div className="shell" style={{ maxWidth: 460 }}>
      <div className="topbar">
        <div>
          <h1>Suivre ma moto</h1>
          <div className="who">Sécurité Taxis-Motos</div>
        </div>
      </div>

      <div className="card">
        {status !== 'found' && (
          <>
            <p className="hint">
              Entrez vos informations pour consulter le statut actuel de votre moto.
            </p>
            <form onSubmit={handleSubmit}>
              <label htmlFor="nom">Votre nom</label>
              <input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
              <label htmlFor="telephone">Votre numéro de téléphone</label>
              <input
                id="telephone"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                required
              />
              <label htmlFor="cni">Numéro de votre pièce d&rsquo;identité (CNI)</label>
              <input id="cni" data-mono="true" value={cni} onChange={(e) => setCni(e.target.value)} required />
              {status === 'notfound' && (
                <p className="hint" style={{ color: 'var(--rejected)' }}>
                  Aucune fiche ne correspond à ces informations.
                </p>
              )}
              <button className="btn-primary" type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? 'Recherche…' : 'Consulter'}
              </button>
            </form>
          </>
        )}

        {status === 'found' && resultat && (
          <div>
            <h2>{resultat.plaque_immatriculation}</h2>
            <p className="hint" style={{ fontSize: 15, color: 'var(--text)' }}>
              <b>Statut : {labels[resultat.statut] || resultat.statut}</b>
            </p>
            {resultat.mise_a_jour && (
              <p className="hint">
                Dernière mise à jour : {new Date(resultat.mise_a_jour).toLocaleString('fr-FR')}
              </p>
            )}
            {resultat.statut === 'volee' && points.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h2>Position en direct</h2>
                <MotoMap points={points} />
              </div>
            )}
            {resultat.statut === 'volee' && points.length === 0 && (
              <p className="hint" style={{ marginTop: 12 }}>
                Aucune position GPS disponible pour l&rsquo;instant. Les agents du syndicat
                peuvent aussi vous aider à suivre la recherche.
              </p>
            )}
            <p className="hint" style={{ marginTop: 16 }}>
              Pour toute question, rendez-vous à votre gare.
            </p>
            <button className="btn-ghost" onClick={() => setStatus('idle')}>
              Nouvelle recherche
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
