export default function Mentions() {
  return (
    <section>
      <h1>Mentions légales & RGPD</h1>
      <div className="panel">
        <h2>Éditeur</h2>
        <p>InteriMatch — projet étudiant Epitech MSC Pro (D-WEB-901). Contact : contact@interimatch.local</p>
      </div>
      <div className="panel">
        <h2>Données personnelles</h2>
        <p>
          Base légale : exécution du contrat de mise en relation et consentement à l’inscription.
          Durée de conservation : 3 ans après la dernière activité du compte. Droits d’accès,
          rectification, suppression : via la page Profil ou par email.
        </p>
      </div>
      <div className="panel">
        <h2>Intérim — rappels Code du travail</h2>
        <p>
          Les missions publiées doivent respecter la durée maximale applicable au travail temporaire
          et comporter les mentions essentielles (poste, dates, lieu, rémunération). Ce POC rappelle
          la durée max côté API ; ce n’est pas un conseil juridique.
        </p>
      </div>
      <div className="panel">
        <h2>Éco-conception (RGESN)</h2>
        <ul>
          <li>Pas d’images lourdes / hero media — fond CSS léger.</li>
          <li>Proxy Vite + endpoints paginés (take 50) pour limiter les requêtes.</li>
        </ul>
      </div>
    </section>
  );
}
