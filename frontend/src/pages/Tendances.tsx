import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function Tendances() {
  const [rows, setRows] = useState<any[]>([]);
  const [demo, setDemo] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [clicks, setClicks] = useState(0);

  useEffect(() => {
    api('/api/tendances').then(setRows).catch(console.error);
  }, []);

  // 5 clics rapides sur le titre → panneau FT (soutenance)
  useEffect(() => {
    if (clicks < 5) return;
    setOpen(true);
    setClicks(0);
    api('/api/tendances/pipeline-demo')
      .then(setDemo)
      .catch((e) => setDemo({ error: e.message }));
  }, [clicks]);

  function onTitleClick() {
    setClicks((c) => c + 1);
    window.setTimeout(() => setClicks(0), 2000);
  }

  return (
    <section>
      <div className="page-banner">
        <h1 onClick={onTitleClick} style={{ cursor: 'default' }} title="">
          Tendances marché BTP
        </h1>
      </div>
      <p className="meta">
        Agrégats issus des offres France Travail (intérim MIS) après nettoyage CLI — utiles pour
        cibler les métiers / zones en tension.
      </p>
      <table className="table">
        <thead>
          <tr>
            <th>Métier</th>
            <th>Zone (dept)</th>
            <th>Nb offres</th>
            <th>Salaire estimé</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id || i}>
              <td>{r.metier}</td>
              <td>{r.zone}</td>
              <td>{r.nbOffres}</td>
              <td>{r.salaireMed ? `${r.salaireMed} €` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p className="meta">Pas encore de tendances — lance la CLI clean sur un sample.</p>}

      {/* bouton quasi invisible — coin bas droit */}
      <button
        type="button"
        className="ft-secret-btn"
        aria-label="Pipeline France Travail"
        onClick={() => {
          setOpen(true);
          api('/api/tendances/pipeline-demo')
            .then(setDemo)
            .catch((e) => setDemo({ error: e.message }));
        }}
      >
        ·
      </button>

      {open && (
        <div className="ft-demo" role="dialog" aria-label="Démo pipeline France Travail">
          <div className="ft-demo__head">
            <h2>Pipeline France Travail (démo)</h2>
            <button type="button" className="btn ghost" onClick={() => setOpen(false)}>
              Fermer
            </button>
          </div>
          {!demo && <p className="meta">chargement…</p>}
          {demo?.error && <p className="err">{demo.error}</p>}
          {demo && !demo.error && (
            <div className="ft-demo__body">
              <p className="meta">{demo.titre}</p>
              <h3>Où c’est utilisé dans l’app</h3>
              <ul>
                {(demo.usageDansApp || []).map((u: string) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>

              <h3>1. Requête token</h3>
              <pre className="ft-code">{JSON.stringify(demo.requeteToken, null, 2)}</pre>

              <h3>2. Requête search (filtrée)</h3>
              <pre className="ft-code">{JSON.stringify(demo.requeteSearch, null, 2)}</pre>

              <h3>3. Nettoyage CLI</h3>
              <ul>
                {(demo.nettoyageCLI || []).map((u: string) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>

              <div className="ft-cols">
                <div>
                  <h3>Champs bruts (exemple)</h3>
                  <pre className="ft-code">{(demo.champsBrutsExemple || []).join('\n')}</pre>
                </div>
                <div>
                  <h3>Champs gardés</h3>
                  <pre className="ft-code">{(demo.champsGardesApresClean || []).join('\n')}</pre>
                </div>
                <div>
                  <h3>Non conservés</h3>
                  <pre className="ft-code">{(demo.champsNonConserves || []).join('\n')}</pre>
                </div>
              </div>

              <h3>Exemple offre brute (1 résultat)</h3>
              <pre className="ft-code">{JSON.stringify(demo.exempleBrut, null, 2)}</pre>

              <h3>Après clean</h3>
              <pre className="ft-code">{JSON.stringify(demo.exempleNettoye, null, 2)}</pre>

              <h3>Tendances dérivées (extrait)</h3>
              <pre className="ft-code">{JSON.stringify(demo.exempleTendances, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
