import { Link } from 'react-router-dom';

/** Schéma visuel du scoring (soutenance) */
export default function MatchingSchema() {
  return (
    <section className="schema-page">
      <p className="meta">
        <Link to="/dashboard">← Dashboard</Link>
      </p>
      <h1>Schéma du matching</h1>
      <p className="lede">
        Score sur 100, sans machine learning : métier, compétences, zone, disponibilités.
      </p>

      <div className="schema-flow" role="img" aria-label="Flux de matching InteriMatch">
        <div className="schema-col">
          <article className="schema-card">
            <h2>Mission</h2>
            <ul>
              <li>Métier / ROME</li>
              <li>Compétences</li>
              <li>Lieu + CP</li>
              <li>Dates</li>
            </ul>
          </article>
          <article className="schema-card">
            <h2>Profil intérimaire</h2>
            <ul>
              <li>Métiers</li>
              <li>Compétences / habilitations</li>
              <li>Zone + rayon km</li>
              <li>Disponibilités</li>
            </ul>
          </article>
        </div>

        <div className="schema-arrow" aria-hidden="true">
          →
        </div>

        <article className="schema-card schema-card--accent">
          <h2>scoreMatch()</h2>
          <ol className="schema-weights">
            <li>
              <span>Métier</span>
              <strong>40 pts</strong>
            </li>
            <li>
              <span>Compétences</span>
              <strong>35 pts</strong>
            </li>
            <li>
              <span>Zone (dept / ville / rayon)</span>
              <strong>15 pts</strong>
            </li>
            <li>
              <span>Disponibilités</span>
              <strong>10 pts</strong>
            </li>
          </ol>
          <p className="meta">Total = 100</p>
        </article>

        <div className="schema-arrow" aria-hidden="true">
          →
        </div>

        <div className="schema-col">
          <article className="schema-card">
            <h2>Classement</h2>
            <p className="meta">Tri décroissant des scores</p>
          </article>
          <article className="schema-card">
            <h2>Mongo</h2>
            <p className="meta">Logs matching_logs</p>
          </article>
          <article className="schema-card schema-card--warn">
            <h2>Si score ≥ 80</h2>
            <p className="meta">Webhook n8n → mail Brevo</p>
          </article>
        </div>
      </div>

      <h2 className="schema-formula-title">Exemple</h2>
      <pre className="schema-formula">{`Maçon + coffrage/béton + même dept + dispo OK
→ 40 + 35 + 15 + 10 = 100`}</pre>
    </section>
  );
}
