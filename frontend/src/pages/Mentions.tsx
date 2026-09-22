export default function Mentions() {
  return (
    <section>
      <h1>Mentions légales & RGPD</h1>

      <div className="panel">
        <h2>Éditeur</h2>
        <p>
          InteriMatch — plateforme de mise en relation intérim BTP.
          <br />
          Siège : Lyon, France.
          <br />
          Contact : contact@interimatch.fr
        </p>
        <p>
          Directeur de la publication : l’équipe InteriMatch.
          <br />
          Hébergement : Render (USA / UE selon région du service).
        </p>
      </div>

      <div className="panel">
        <h2>Décharge — travail déclaré uniquement</h2>
        <p>
          InteriMatch est une plateforme de <strong>mise en relation</strong> entre entreprises et
          intérimaires dans le cadre du <strong>travail temporaire déclaré</strong> (intérim),
          conformément au Code du travail français.
        </p>
        <p>
          La plateforme <strong>n’autorise pas</strong>, ne facilite pas et ne cautionne en aucune
          façon le travail dissimulé (« travail au noir »), le travail non déclaré, ni toute forme
          d’emploi irrégulier. Toute utilisation détournée à cette fin est strictement interdite et
          engage la responsabilité exclusive de l’utilisateur.
        </p>
        <ul>
          <li>
            Les entreprises restent responsables de la conformité de leurs missions (contrat de
            mission, déclarations sociales, durée maximale d’intérim, mentions obligatoires).
          </li>
          <li>
            Les intérimaires restent responsables de la sincérité de leur profil et de leurs droits
            à exercer une activité professionnelle déclarée.
          </li>
          <li>
            InteriMatch n’est pas une entreprise de travail temporaire (ETT) : la plateforme
            n’assure pas la paie, la facturation ni la rédaction du contrat de mission définitif,
            qui restent à la charge des parties et, le cas échéant, de l’ETT partenaire.
          </li>
        </ul>
        <p>
          En cas de suspicion d’usage illégal, le compte concerné pourra être suspendu ou fermé.
          Signalement : contact@interimatch.fr
        </p>
      </div>

      <div className="panel">
        <h2>Données personnelles (RGPD)</h2>
        <p>
          Responsable de traitement : InteriMatch. Base légale : exécution du contrat de mise en
          relation et consentement lors de l’inscription. Durée de conservation : 3 ans après la
          dernière activité du compte. Droits d’accès, rectification, opposition, portabilité et
          suppression : via la page Profil ou par email à contact@interimatch.fr. Réclamation
          possible auprès de la CNIL.
        </p>
        <p>
          Les données (identité, compétences, coordonnées, historiques de matching) sont traitées
          uniquement pour le fonctionnement du service et ne sont pas revendues. Les données
          sensibles éventuellement renseignées (ex. IBAN, pièce d’identité) sont chiffrées au repos.
        </p>
      </div>

      <div className="panel">
        <h2>Intérim — rappels Code du travail</h2>
        <p>
          Les missions publiées doivent respecter la durée maximale applicable au travail temporaire
          et comporter les mentions essentielles (poste, dates, lieu, rémunération, EPI le cas
          échéant). InteriMatch affiche des contrôles et rappels techniques ; ces informations ne
          se substituent pas à un conseil juridique ou à l’accompagnement d’une ETT.
        </p>
      </div>

      <div className="panel">
        <h2>Limitation de responsabilité</h2>
        <p>
          InteriMatch met tout en œuvre pour assurer la disponibilité et la fiabilité du service.
          Toutefois, la plateforme ne saurait garantir l’exactitude absolue des scores de matching,
          la conclusion d’un engagement, ni l’absence totale d’interruption technique. L’usage du
          service s’effectue sous la responsabilité des utilisateurs. InteriMatch ne pourra être
          tenue responsable des dommages indirects résultant de l’utilisation ou de
          l’impossibilité d’utiliser le service.
        </p>
      </div>

      <div className="panel">
        <h2>Cookies & mesure d’audience</h2>
        <p>
          Le service utilise un jeton d’authentification stocké localement (session). Aucun cookie
          publicitaire tiers n’est déposé. Les logs techniques (matching, automatisations) servent
          au fonctionnement et à l’amélioration du produit.
        </p>
      </div>

      <div className="panel">
        <h2>Éco-conception</h2>
        <ul>
          <li>Images compressées et chargement différé (lazy-loading).</li>
          <li>Limitation du volume de données échangées (listes paginées).</li>
        </ul>
      </div>
    </section>
  );
}
