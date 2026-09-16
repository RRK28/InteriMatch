import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Home() {
  const { user } = useAuth();
  return (
    <section className="hero">
      <p className="sr-only">InteriMatch</p>
      <h1>
        Le bon intérimaire,
        <br />
        sur le bon chantier.
      </h1>
      <p className="lead">
        Plateforme d’intérim spécialisée BTP : missions créées par les entreprises, profils
        ouvriers, matching sur métier, compétences, zone et dispo.
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
    </section>
  );
}
