'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

function randomName(file) {
  const ext = file.name.split('.').pop();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

function SignalerPerteForm() {
  const searchParams = useSearchParams();
  const [type, setType] = useState('moto'); // 'moto' | 'cni'
  const [telephone, setTelephone] = useState('');
  const [nom, setNom] = useState('');
  const [cni, setCni] = useState('');
  const [plaque, setPlaque] = useState('');
  const [chassis, setChassis] = useState('');
  const [photo, setPhoto] = useState(null);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    const n = searchParams.get('nom');
    const t = searchParams.get('telephone');
    const c = searchParams.get('cni');
    const p = searchParams.get('plaque');
    const ch = searchParams.get('chassis');
    if (n) setNom(n);
    if (t) setTelephone(t);
    if (c) setCni(c);
    if (p) setPlaque(p);
    if (ch) setChassis(ch);
  }, [searchParams]);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');

    if (type === 'cni') {
      const { data, error } = await supabase.rpc('signaler_cni_perdue', {
        p_telephone: telephone.trim(),
        p_nom: nom.trim(),
        p_cni: cni.trim(),
      });
      if (error) {
        setStatus('error');
        return;
      }
      setStatus(data ? 'success' : 'notfound');
      return;
    }

    let photoUrl = null;
    if (photo) {
      const path = randomName(photo);
      const { error: uploadError } = await supabase.storage
        .from('signalement-photos')
        .upload(path, photo);
      if (!uploadError) {
        const { data } = supabase.storage.from('signalement-photos').getPublicUrl(path);
        photoUrl = data.publicUrl;
      }
    }

    const { data, error } = await supabase.rpc('signaler_perte', {
      p_telephone: telephone.trim(),
      p_plaque: plaque.trim(),
      p_nom: nom.trim(),
      p_cni: cni.trim(),
      p_chassis: chassis.trim() || null,
      p_photo_url: photoUrl,
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
          <h1>Signaler un problème</h1>
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
          <label htmlFor="type">Que voulez-vous signaler ?</label>
          <select id="type" value={type} onChange={(e) => { setType(e.target.value); setStatus('idle'); }}>
            <option value="moto">Ma moto est volée ou perdue</option>
            <option value="cni">J&rsquo;ai perdu ma pièce d&rsquo;identité (CNI)</option>
          </select>

          <p className="hint" style={{ marginTop: 14 }}>
            {type === 'moto'
              ? 'Ces informations doivent correspondre à celles données lors de votre enregistrement.'
              : 'Cela permet aux agents de savoir que votre pièce est perdue, même si votre moto va bien.'}
          </p>

          <form onSubmit={handleSubmit}>
            <label htmlFor="nom">Votre nom (tel qu&rsquo;enregistré)</label>
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

            {type === 'moto' && (
              <>
                <label htmlFor="plaque">Plaque d&rsquo;immatriculation de la moto</label>
                <input
                  id="plaque"
                  data-mono="true"
                  value={plaque}
                  onChange={(e) => setPlaque(e.target.value)}
                  required
                />
                <label htmlFor="chassis">Numéro de châssis (si vous le connaissez)</label>
                <input
                  id="chassis"
                  data-mono="true"
                  value={chassis}
                  onChange={(e) => setChassis(e.target.value)}
                />
                <label htmlFor="photo">Votre photo (facultatif, mais recommandé)</label>
                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                />
              </>
            )}

            {status === 'notfound' && (
              <p className="hint" style={{ color: 'var(--rejected)' }}>
                Aucune fiche ne correspond exactement à ces informations. Vérifiez chaque champ,
                ou rendez-vous à votre gare.
              </p>
            )}
            {status === 'error' && (
              <p className="hint" style={{ color: 'var(--rejected)' }}>
                Une erreur est survenue. Réessayez, ou rendez-vous à votre gare.
              </p>
            )}
            <button className="btn-primary" type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Envoi…' : 'Envoyer le signalement'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function SignalerPerte() {
  return (
    <Suspense fallback={null}>
      <SignalerPerteForm />
    </Suspense>
  );
}
