'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const labels = {
  actif: 'En circulation',
  signale_chauffeur: 'Signalement en cours de vérification',
  volee: 'Volée / perdue — recherche en cours',
  recuperee: 'Récupérée',
  vendue: 'Vendue',
  hors_service: 'Hors service',
};

export default function MesMotos() {
  const [identite, setIdentite] = useState(null);
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [cni, setCni] = useState('');
  const [status, setStatus] = useState('idle');
  const [motos, setMotos] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [plaque, setPlaque] = useState('');
  const [marque, setMarque] = useState('');
  const [couleur, setCouleur] = useState('');
  const [chassis, setChassis] = useState('');

  async function loadMotos(ident) {
    const { data, error } = await supabase.rpc('mes_motos', {
      p_telephone: ident.telephone,
      p_nom: ident.nom,
      p_cni: ident.cni,
    });
    if (error || !data || data.length === 0) {
      setStatus('notfound');
      return;
    }
    setMotos(data);
    setIdentite(ident);
    setStatus('found');
  }

  async function handleVerify(e) {
    e.preventDefault();
    setStatus('loading');
    await loadMotos({ nom: nom.trim(), telephone: telephone.trim(), cni: cni.trim() });
  }

  async function handleAjouter(e) {
    e.preventDefault();
    const { data } = await supabase.rpc('ajouter_moto_personnelle', {
      p_telephone: identite.telephone,
      p_nom: identite.nom,
      p_cni: identite.cni,
      p_plaque: plaque.trim(),
      p_marque: marque.trim(),
      p_couleur: couleur.trim(),
      p_chassis: chassis.trim() || null,
    });
    if (data) {
      setPlaque(''); setMarque(''); setCouleur(''); setChassis('');
      setShowAdd(false);
      await loadMotos(identite);
    }
  }

  async function handleStatut(motoId, statut) {
    await supabase.rpc('maj_statut_moto_personnelle', {
      p_telephone: identite.telephone,
      p_nom: identite.nom,
      p_cni: identite.cni,
      p_moto_id: motoId,
      p_statut: statut,
    });
    await loadMotos(identite);
  }

  return (
    <div className="shell" style={{ maxWidth: 460 }}>
      <div className="topbar">
        <div>
          <h1>Mes motos</h1>
          <div className="who">Sécurité Taxis-Motos</div>
        </div>
      </div>

      {status !== 'found' && (
        <div className="card">
          <p className="hint">
            Entrez vos informations (les mêmes que celles enregistrées) pour voir vos motos.
          </p>
          <form onSubmit={handleVerify}>
            <label htmlFor="nom">Votre nom</label>
            <input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
            <label htmlFor="telephone">Votre numéro de téléphone</label>
            <input id="telephone" value={telephone} onChange={(e) => setTelephone(e.target.value)} required />
            <label htmlFor="cni">Numéro de votre pièce d&rsquo;identité (CNI)</label>
            <input id="cni" data-mono="true" value={cni} onChange={(e) => setCni(e.target.value)} required />
            {status === 'notfound' && (
              <p className="hint" style={{ color: 'var(--rejected)' }}>
                Aucune fiche ne correspond à ces informations.
              </p>
            )}
            <button className="btn-primary" type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Recherche…' : 'Voir mes motos'}
            </button>
          </form>
        </div>
      )}

      {status === 'found' && (
        <>
          {motos.map((m) => (
            <div className="card" key={m.id}>
              <div className="entry-head">
                <div>
                  <div className="entry-title">
                    {m.plaque_immatriculation}
                    {m.type_moto === 'personnel' ? ' · personnelle' : ' · taxi'}
                  </div>
                  <div className="entry-sub">{m.marque} {m.couleur ? `· ${m.couleur}` : ''}</div>
                </div>
              </div>
              <p className="hint" style={{ color: 'var(--text)', marginTop: 8 }}>
                <b>Statut : {labels[m.statut] || m.statut}</b>
              </p>
              {m.type_moto === 'personnel' && (
                <div className="row" style={{ marginTop: 10 }}>
                  {m.statut === 'volee' ? (
                    <button className="btn-verify" onClick={() => handleStatut(m.id, 'recuperee')}>
                      Marquer récupérée
                    </button>
                  ) : (
                    <button className="btn-reject" onClick={() => handleStatut(m.id, 'volee')}>
                      Signaler volée / perdue
                    </button>
                  )}
                </div>
              )}
              {m.type_moto === 'taxi' && (
                <p className="hint">
                  Pour signaler cette moto, utilisez « Signaler une moto perdue ou volée »
                  depuis l&rsquo;écran de connexion — un agent devra confirmer.
                </p>
              )}
            </div>
          ))}

          <div className="card">
            {!showAdd ? (
              <button className="btn-ghost" onClick={() => setShowAdd(true)}>
                + Ajouter une moto personnelle
              </button>
            ) : (
              <form onSubmit={handleAjouter}>
                <h2>Nouvelle moto personnelle</h2>
                <label htmlFor="plaque">Plaque d&rsquo;immatriculation</label>
                <input id="plaque" data-mono="true" value={plaque} onChange={(e) => setPlaque(e.target.value)} required />
                <label htmlFor="marque">Marque</label>
                <input id="marque" value={marque} onChange={(e) => setMarque(e.target.value)} />
                <label htmlFor="couleur">Couleur</label>
                <input id="couleur" value={couleur} onChange={(e) => setCouleur(e.target.value)} />
                <label htmlFor="chassis">Numéro de châssis (si connu)</label>
                <input id="chassis" data-mono="true" value={chassis} onChange={(e) => setChassis(e.target.value)} />
                <button className="btn-primary" type="submit">Ajouter cette moto</button>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
}
