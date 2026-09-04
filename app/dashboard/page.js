'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../lib/supabaseClient';

const MotoMap = dynamic(() => import('./MotoMap'), { ssr: false });

function shortCode(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [gares, setGares] = useState([]);
  const [tab, setTab] = useState('enregistrer');
  const [mesFiches, setMesFiches] = useState([]);
  const [aValider, setAValider] = useState([]);
  const [registre, setRegistre] = useState([]);
  const [alertes, setAlertes] = useState([]);
  const [profils, setProfils] = useState([]);
  const [msg, setMsg] = useState('');
  const [traccarConfigured, setTraccarConfigured] = useState(null);
  const [traccarDevices, setTraccarDevices] = useState([]);
  const [traccarError, setTraccarError] = useState('');

  const loadEverything = useCallback(async (currentUser, currentProfile) => {
    const { data: garesData } = await supabase.from('gares').select('*').order('nom');
    setGares(garesData || []);

    if (currentProfile.role === 'agent') {
      const { data } = await supabase
        .from('motos')
        .select('*, chauffeurs(nom, prenom, telephone)')
        .eq('saisi_par', currentUser.id)
        .order('created_at', { ascending: false });
      setMesFiches(data || []);

      let agentRegistreQuery = supabase
        .from('motos')
        .select('*, chauffeurs(nom, prenom, telephone), gares(nom)')
        .order('created_at', { ascending: false });
      if (currentProfile.gare_id) {
        agentRegistreQuery = agentRegistreQuery.eq('gare_id', currentProfile.gare_id);
      }
      const { data: agentRegistreData } = await agentRegistreQuery;
      setRegistre(agentRegistreData || []);
    }

    if (currentProfile.role === 'responsable' || currentProfile.role === 'admin') {
      let query = supabase
        .from('motos')
        .select('*, chauffeurs(nom, prenom, telephone), gares(nom)')
        .eq('statut_verification', 'en_attente')
        .order('created_at', { ascending: true });
      if (currentProfile.role === 'responsable') {
        query = query.eq('gare_id', currentProfile.gare_id);
      }
      const { data } = await query;
      setAValider(data || []);

      let registreQuery = supabase
        .from('motos')
        .select('*, chauffeurs(nom, prenom, telephone), gares(nom)')
        .order('created_at', { ascending: false });
      if (currentProfile.role === 'responsable') {
        registreQuery = registreQuery.eq('gare_id', currentProfile.gare_id);
      }
      const { data: registreData } = await registreQuery;
      setRegistre(registreData || []);
    }

    const { data: alertesData } = await supabase
      .from('motos')
      .select('*, chauffeurs(nom, prenom, telephone), gares(nom)')
      .in('statut', ['volee', 'signale_chauffeur'])
      .order('updated_at', { ascending: false });
    setAlertes(alertesData || []);

    if (currentProfile.role === 'admin') {
      const { data } = await supabase.from('profiles').select('*, gares(nom)').order('created_at');
      setProfils(data || []);
    }
  }, []);

  useEffect(() => {
    async function init() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace('/login');
        return;
      }
      const currentUser = sessionData.session.user;
      setUser(currentUser);
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*, gares(nom)')
        .eq('id', currentUser.id)
        .single();
      setProfile(profileData);
      if (profileData?.actif) {
        await loadEverything(currentUser, profileData);
      }
      setLoading(false);
    }
    init();
  }, [router, loadEverything]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  async function uploadPhoto(file, folder) {
    if (!file || file.size === 0) return null;
    const ext = file.name.split('.').pop();
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('fiches-photos').upload(path, file);
    if (error) throw new Error(`Upload photo (${folder}) : ${error.message}`);
    const { data } = supabase.storage.from('fiches-photos').getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleRegister(e) {
    e.preventDefault();
    setMsg('');
    const form = e.target;
    const gareId = profile.role === 'admin' ? form.gare_id.value : profile.gare_id;

    if (!gareId) {
      setMsg("Impossible d'enregistrer : aucune gare assignée à votre compte. Contactez un admin.");
      return;
    }

    setMsg('Envoi en cours...');

    let photoChauffeurUrl = null;
    let photoMotoUrl = null;
    try {
      photoChauffeurUrl = await uploadPhoto(form.photo_chauffeur.files[0], 'chauffeurs');
      photoMotoUrl = await uploadPhoto(form.photo_moto.files[0], 'motos');
    } catch (err) {
      setMsg(err.message);
      return;
    }

    const { data: chauffeur, error: errChauffeur } = await supabase
      .from('chauffeurs')
      .insert({
        nom: form.nom.value,
        prenom: form.prenom.value,
        telephone: form.telephone.value,
        cni_numero: form.cni.value || null,
        permis_numero: form.permis.value || null,
        contact_urgence_nom: form.urgence_nom.value || null,
        contact_urgence_telephone: form.urgence_tel.value || null,
        photo_url: photoChauffeurUrl,
        gare_id: gareId,
        qr_code: shortCode('CH'),
        saisi_par: user.id,
      })
      .select()
      .single();

    if (errChauffeur) {
      setMsg("Erreur lors de l'enregistrement du chauffeur : " + errChauffeur.message);
      return;
    }

    const { error: errMoto } = await supabase.from('motos').insert({
      chauffeur_id: chauffeur.id,
      plaque_immatriculation: form.plaque.value,
      numero_chassis: form.chassis.value || null,
      marque: form.marque.value || null,
      modele: form.modele.value || null,
      couleur: form.couleur.value || null,
      photo_url: photoMotoUrl,
      gare_id: gareId,
      qr_code: shortCode('MT'),
      saisi_par: user.id,
    });

    if (errMoto) {
      setMsg("Chauffeur enregistré, mais erreur sur la moto : " + errMoto.message);
      return;
    }

    setMsg('Fiche enregistrée — en attente de vérification.');
    form.reset();
    loadEverything(user, profile);
  }

  async function handleDecision(moto, decision) {
    const now = new Date().toISOString();
    await supabase
      .from('motos')
      .update({ statut_verification: decision, verifie_par: user.id, verifie_le: now })
      .eq('id', moto.id);
    await supabase
      .from('chauffeurs')
      .update({ statut_verification: decision, verifie_par: user.id, verifie_le: now })
      .eq('id', moto.chauffeur_id);
    loadEverything(user, profile);
  }

  async function handleCreateGare(e) {
    e.preventDefault();
    const form = e.target;
    await supabase.from('gares').insert({
      nom: form.gare_nom.value,
      zone: form.gare_zone.value || null,
      responsable_nom: form.gare_resp.value || null,
      responsable_telephone: form.gare_resp_tel.value || null,
    });
    form.reset();
    loadEverything(user, profile);
  }

  async function handleUpdateProfil(profilId, fields) {
    await supabase.from('profiles').update(fields).eq('id', profilId);
    loadEverything(user, profile);
  }

  async function handleSetBoitier(motoId, value) {
    await supabase.from('motos').update({ gps_boitier_id: value || null }).eq('id', motoId);
    loadEverything(user, profile);
  }

  async function handleSetStatut(motoId, statut) {
    await supabase.from('motos').update({ statut }).eq('id', motoId);
    loadEverything(user, profile);
  }

  const loadTraccar = useCallback(async () => {
    try {
      const res = await fetch('/api/traccar/status');
      const data = await res.json();
      setTraccarConfigured(data.configured);
      setTraccarDevices(data.devices || []);
      setTraccarError(data.error || '');
    } catch (e) {
      setTraccarError("Impossible de contacter l'app pour les données GPS.");
    }
  }, []);

  useEffect(() => {
    if (tab !== 'carte') return;
    loadTraccar();
    const interval = setInterval(loadTraccar, 20000);
    return () => clearInterval(interval);
  }, [tab, loadTraccar]);

  if (loading) return null;

  if (!profile) {
    return (
      <div className="shell">
        <div className="card">
          <h2>Profil introuvable</h2>
          <p className="hint">Contactez un administrateur.</p>
        </div>
      </div>
    );
  }

  if (!profile.actif) {
    return (
      <div className="shell">
        <div className="topbar">
          <h1>Sécurité Taxis-Motos</h1>
          <button className="btn-ghost" onClick={handleLogout}>Déconnexion</button>
        </div>
        <div className="card">
          <h2>Compte en attente d&rsquo;activation</h2>
          <p className="hint">
            Un responsable du syndicat doit activer votre compte et vous assigner à une gare
            avant que vous puissiez commencer.
          </p>
        </div>
      </div>
    );
  }

  const tabs = ['enregistrer'];
  if (profile.role === 'agent') tabs.push('mes-fiches', 'registre');
  if (profile.role === 'responsable' || profile.role === 'admin') tabs.push('valider', 'registre', 'carte');
  tabs.push('alertes');
  if (profile.role === 'admin') tabs.push('gares', 'agents');

  return (
    <div className="shell">
      <div className="topbar">
        <div>
          <h1>Sécurité Taxis-Motos</h1>
          <div className="who">{profile.nom} · {profile.role}{profile.gares ? ` · ${profile.gares.nom}` : ''}</div>
        </div>
        <button className="btn-ghost" onClick={handleLogout}>Déconnexion</button>
      </div>

      <div className="tabs">
        {tabs.map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {{
              enregistrer: 'Enregistrer',
              'mes-fiches': 'Mes fiches',
              valider: `Valider${aValider.length ? ` (${aValider.length})` : ''}`,
              registre: 'Registre',
              carte: 'Carte',
              alertes: `Alertes${alertes.length ? ` (${alertes.length})` : ''}`,
              gares: 'Gares',
              agents: 'Agents',
            }[t]}
          </button>
        ))}
      </div>

      {tab === 'enregistrer' && (
        <div className="card">
          <h2>Nouveau chauffeur & moto</h2>
          <p className="hint">La fiche sera marquée "en attente" jusqu&rsquo;à vérification.</p>
          <form onSubmit={handleRegister}>
            {profile.role === 'admin' && (
              <>
                <label htmlFor="gare_id">Gare</label>
                <select id="gare_id" name="gare_id" required>
                  {gares.map((g) => (
                    <option key={g.id} value={g.id}>{g.nom}</option>
                  ))}
                </select>
              </>
            )}
            <label htmlFor="nom">Nom du chauffeur</label>
            <input id="nom" name="nom" required />
            <label htmlFor="prenom">Prénom</label>
            <input id="prenom" name="prenom" required />
            <label htmlFor="telephone">Téléphone</label>
            <input id="telephone" name="telephone" required />
            <label htmlFor="cni">Numéro CNI</label>
            <input id="cni" name="cni" data-mono="true" />
            <label htmlFor="permis">Numéro permis</label>
            <input id="permis" name="permis" data-mono="true" />
            <label htmlFor="urgence_nom">Contact d&rsquo;urgence — nom</label>
            <input id="urgence_nom" name="urgence_nom" />
            <label htmlFor="urgence_tel">Contact d&rsquo;urgence — téléphone</label>
            <input id="urgence_tel" name="urgence_tel" />
            <label htmlFor="photo_chauffeur">Photo du chauffeur</label>
            <input id="photo_chauffeur" name="photo_chauffeur" type="file" accept="image/*" capture="environment" />

            <label htmlFor="plaque">Plaque d&rsquo;immatriculation</label>
            <input id="plaque" name="plaque" data-mono="true" required />
            <label htmlFor="chassis">Numéro de châssis</label>
            <input id="chassis" name="chassis" data-mono="true" />
            <div className="row">
              <div style={{ flex: 1 }}>
                <label htmlFor="marque">Marque</label>
                <input id="marque" name="marque" />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="modele">Modèle</label>
                <input id="modele" name="modele" />
              </div>
            </div>
            <label htmlFor="couleur">Couleur</label>
            <input id="couleur" name="couleur" />
            <label htmlFor="photo_moto">Photo de la moto</label>
            <input id="photo_moto" name="photo_moto" type="file" accept="image/*" capture="environment" />

            {msg && <p className="hint" style={{ color: 'var(--accent)' }}>{msg}</p>}
            <button className="btn-primary" type="submit">Enregistrer la fiche</button>
          </form>
        </div>
      )}

      {tab === 'mes-fiches' && (
        <div className="card">
          <h2>Mes fiches</h2>
          {mesFiches.length === 0 && <p className="empty">Aucune fiche enregistrée pour l&rsquo;instant.</p>}
          {mesFiches.map((m) => (
            <div className="entry" key={m.id}>
              <div className="entry-head">
                <div>
                  <div className="entry-title">{m.chauffeurs?.nom} {m.chauffeurs?.prenom}</div>
                  <div className="entry-sub">{m.plaque_immatriculation}</div>
                </div>
                <span className={`status status-${m.statut_verification}`}>{m.statut_verification}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'valider' && (
        <div className="card">
          <h2>Fiches en attente</h2>
          {aValider.length === 0 && <p className="empty">Rien à valider pour le moment.</p>}
          {aValider.map((m) => (
            <div className="entry" key={m.id}>
              <div className="entry-head">
                <div>
                  <div className="entry-title">{m.chauffeurs?.nom} {m.chauffeurs?.prenom}</div>
                  <div className="entry-sub">
                    {m.plaque_immatriculation} · {m.chauffeurs?.telephone}
                    {m.gares ? ` · ${m.gares.nom}` : ''}
                  </div>
                </div>
                <QRCodeSVG value={m.qr_code} size={44} bgColor="transparent" fgColor="#f2ede1" />
              </div>
              {(m.chauffeurs?.photo_url || m.photo_url) && (
                <div className="row" style={{ marginTop: 10 }}>
                  {m.chauffeurs?.photo_url && (
                    <img src={m.chauffeurs.photo_url} alt="Chauffeur" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border)' }} />
                  )}
                  {m.photo_url && (
                    <img src={m.photo_url} alt="Moto" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border)' }} />
                  )}
                </div>
              )}
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn-verify" onClick={() => handleDecision(m, 'verifie')}>Valider</button>
                <button className="btn-reject" onClick={() => handleDecision(m, 'rejete')}>Rejeter</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'registre' && (
        <div className="card">
          <h2>Toutes les fiches</h2>
          {registre.length === 0 && <p className="empty">Aucune fiche enregistrée pour l&rsquo;instant.</p>}
          {registre.map((m) => (
            <div className="entry" key={m.id}>
              <div className="entry-head">
                <div>
                  <div className="entry-title">{m.chauffeurs?.nom} {m.chauffeurs?.prenom}</div>
                  <div className="entry-sub">
                    {m.plaque_immatriculation} · {m.chauffeurs?.telephone}
                    {m.gares ? ` · ${m.gares.nom}` : ''}
                  </div>
                </div>
                <span className={`status status-${m.statut_verification}`}>{m.statut_verification}</span>
              </div>
              {profile.role === 'admin' && (
                <div className="row" style={{ marginTop: 10 }}>
                  <input
                    placeholder="ID boîtier GPS (IMEI)"
                    defaultValue={m.gps_boitier_id || ''}
                    data-mono="true"
                    id={`boitier-${m.id}`}
                  />
                  <button
                    className="btn-ghost"
                    onClick={() => handleSetBoitier(m.id, document.getElementById(`boitier-${m.id}`).value)}
                  >
                    Associer
                  </button>
                </div>
              )}
              {m.statut_verification !== 'en_attente' && (
                <div className="row" style={{ marginTop: 10 }}>
                  <button className="btn-ghost" onClick={() => handleDecision(m, 'en_attente')}>
                    Remettre en attente
                  </button>
                </div>
              )}
              <div className="row" style={{ marginTop: 10 }}>
                {m.statut === 'volee' ? (
                  <button className="btn-verify" onClick={() => handleSetStatut(m.id, 'recuperee')}>
                    Marquer récupérée
                  </button>
                ) : (
                  <button className="btn-reject" onClick={() => handleSetStatut(m.id, 'volee')}>
                    Signaler volée / perdue
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'alertes' && (
        <div className="card">
          <h2>Motos signalées volées ou perdues</h2>
          {alertes.length === 0 && (
            <p className="empty">Aucune moto signalée pour l&rsquo;instant — tout est en ordre.</p>
          )}
          {alertes.map((m) => (
            <div className="entry" key={m.id}>
              <div className="entry-head">
                <div>
                  <div className="entry-title">{m.chauffeurs?.nom} {m.chauffeurs?.prenom}</div>
                  <div className="entry-sub">
                    {m.plaque_immatriculation} · {m.chauffeurs?.telephone}
                    {m.gares ? ` · ${m.gares.nom}` : ''}
                    {m.gps_boitier_id ? ' · GPS disponible' : ' · pas de GPS'}
                  </div>
                </div>
                <span className={`status ${m.statut === 'volee' ? 'status-rejete' : 'status-en_attente'}`}>
                  {m.statut === 'volee' ? 'volée confirmée' : 'signalée par le chauffeur'}
                </span>
              </div>
              <div className="row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
                {m.statut === 'signale_chauffeur' && (
                  <button className="btn-reject" onClick={() => handleSetStatut(m.id, 'volee')}>
                    Confirmer le vol
                  </button>
                )}
                <button className="btn-verify" onClick={() => handleSetStatut(m.id, 'recuperee')}>
                  Marquer récupérée
                </button>
                {m.gps_boitier_id && (
                  <button className="btn-ghost" onClick={() => setTab('carte')}>
                    Voir sur la carte
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'carte' && (
        <div className="card">
          <h2>Localisation en direct</h2>
          {traccarConfigured === false && (
            <p className="hint">
              Traccar n&rsquo;est pas encore connecté. Ajoutez <code>TRACCAR_URL</code>,{' '}
              <code>TRACCAR_EMAIL</code> et <code>TRACCAR_PASSWORD</code> dans les variables
              d&rsquo;environnement Vercel, puis redéployez.
            </p>
          )}
          {traccarError && <p className="error">{traccarError}</p>}
          {traccarConfigured && (() => {
            const points = registre
              .filter((m) => m.gps_boitier_id)
              .map((m) => {
                const device = traccarDevices.find((d) => d.uniqueId === m.gps_boitier_id);
                if (!device || device.latitude == null) return null;
                return {
                  uniqueId: m.gps_boitier_id,
                  label: `${m.statut === 'volee' ? '🚨 VOLÉE — ' : ''}${m.chauffeurs?.nom || ''} ${m.chauffeurs?.prenom || ''} · ${m.plaque_immatriculation}`,
                  latitude: device.latitude,
                  longitude: device.longitude,
                  speed: device.speed,
                  fixTime: device.fixTime,
                  accuracy: device.accuracy,
                  stolen: m.statut === 'volee',
                };
              })
              .filter(Boolean);

            if (points.length === 0) {
              return (
                <p className="empty">
                  Aucune moto équipée et positionnée pour l&rsquo;instant. Associez un ID de boîtier
                  GPS à une moto depuis l&rsquo;onglet Registre une fois le traceur installé.
                </p>
              );
            }
            return <MotoMap points={points} />;
          })()}
        </div>
      )}

      {tab === 'gares' && (
        <>
          <div className="card">
            <h2>Nouvelle gare</h2>
            <form onSubmit={handleCreateGare}>
              <label htmlFor="gare_nom">Nom</label>
              <input id="gare_nom" name="gare_nom" required />
              <label htmlFor="gare_zone">Zone</label>
              <input id="gare_zone" name="gare_zone" />
              <label htmlFor="gare_resp">Responsable — nom</label>
              <input id="gare_resp" name="gare_resp" />
              <label htmlFor="gare_resp_tel">Responsable — téléphone</label>
              <input id="gare_resp_tel" name="gare_resp_tel" />
              <button className="btn-primary" type="submit">Créer la gare</button>
            </form>
          </div>
          <div className="card">
            <h2>Gares existantes</h2>
            {gares.length === 0 && <p className="empty">Aucune gare pour l&rsquo;instant.</p>}
            {gares.map((g) => (
              <div className="entry" key={g.id}>
                <div className="entry-title">{g.nom}</div>
                <div className="entry-sub">{g.zone || '—'} {g.responsable_nom ? `· ${g.responsable_nom}` : ''}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'agents' && (
        <div className="card">
          <h2>Comptes agents & responsables</h2>
          {profils.length === 0 && <p className="empty">Aucun compte pour l&rsquo;instant.</p>}
          {profils.map((p) => (
            <div className="entry" key={p.id}>
              <div className="entry-head">
                <div>
                  <div className="entry-title">{p.nom}</div>
                  <div className="entry-sub">{p.telephone || '—'} · {p.gares?.nom || 'aucune gare'}</div>
                </div>
                <span className={`status ${p.actif ? 'status-verifie' : 'status-en_attente'}`}>
                  {p.actif ? 'actif' : 'en attente'}
                </span>
              </div>
              <div className="row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
                <select defaultValue={p.role} onChange={(e) => handleUpdateProfil(p.id, { role: e.target.value })}>
                  <option value="agent">agent</option>
                  <option value="responsable">responsable</option>
                  <option value="admin">admin</option>
                </select>
                <select
                  defaultValue={p.gare_id || ''}
                  onChange={(e) => handleUpdateProfil(p.id, { gare_id: e.target.value || null })}
                >
                  <option value="">Aucune gare</option>
                  {gares.map((g) => (
                    <option key={g.id} value={g.id}>{g.nom}</option>
                  ))}
                </select>
                {!p.actif ? (
                  <button className="btn-verify" onClick={() => handleUpdateProfil(p.id, { actif: true })}>Activer</button>
                ) : (
                  <button className="btn-reject" onClick={() => handleUpdateProfil(p.id, { actif: false })}>Désactiver</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
