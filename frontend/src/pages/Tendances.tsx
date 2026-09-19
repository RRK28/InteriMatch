import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function Tendances() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    api('/api/tendances').then(setRows).catch(console.error);
  }, []);

  return (
    <section>
      <h1>Tendances marché BTP</h1>
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
    </section>
  );
}
