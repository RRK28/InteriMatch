import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Home() {
  const { user } = useAuth();
  return (
    <>
      <section className="hero hero--photo" aria-label="Accueil InteriMatch">
        <div className="hero__veil" aria-hidden="true" />
        <div className="hero__content">
          <p className="brand-mark">InteriMatch</p>
          <h1>
            Le bon intérimaire,
            <br />
            sur le bon chantier.
          </h1>
          <p className="lead">
            Intérim BTP sans blabla : publie une mission, trouve un profil dispo, matche sur métier,
            zone et compétences.
          </p>
          <div className="cta-row">
            {!user && (
              <>
                <Link className="btn" to="/register">
                  Créer un compte
                </Link>
                <Link className="btn secondary" to="/missions">
                  Voir les missions
                </Link>
              </>
            )}
            {user && (
              <Link className="btn" to="/dashboard">
                Aller au dashboard
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="split-human" aria-labelledby="pour-qui">
        <h2 id="pour-qui">Fait pour le terrain</h2>
        <p className="meta section-intro">
          Deux côtés du chantier, un même outil — rapide à prendre en main.
        </p>
        <div className="split-human__grid">
          <article className="human-block">
            <img
                  src="/images/entreprise-chantier.jpg"
              alt="Cheffe de chantier avec casque et tablette sur un site BTP"
              width={900}
              height={675}
              loading="lazy"
            />
            <h3>Entreprises</h3>
            <p>
              Crée une mission en 2 minutes, vois qui matche, accepte le bon profil. EPI et durée
              de mission rappelés automatiquement.
            </p>
            {!user && (
              <Link to="/register" className="text-link">
                Recruter →
              </Link>
            )}
          </article>
          <article className="human-block">
            <img
                  src="/images/interim-macon.jpg"
              alt="Ouvrier maçon souriant avec casque jaune sur un chantier"
              width={900}
              height={675}
              loading="lazy"
            />
            <h3>Intérimaires</h3>
            <p>
              Profil compétences + dispo, missions classées par score, candidature en un clic.
              Tendances marché issues des offres France Travail.
            </p>
            {!user && (
              <Link to="/missions" className="text-link">
                Trouver une mission →
              </Link>
            )}
          </article>
        </div>
      </section>
    </>
  );
}
