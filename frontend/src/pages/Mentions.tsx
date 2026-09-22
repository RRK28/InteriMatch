export default function Mentions() {
  return (
    <section>
      <h1>Mentions légales & RGPD</h1>

      <div className="panel">
        <h2>Éditeur</h2>
        <p>
          InteriMatch — projet étudiant Epitech MSC Pro (D-WEB-901). Contact :
          contact@interimatch.local
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
            Les intérimaires restent responsables de la sincérité de leur profil et de leurs
            droits à exercer une activité professionnelle déclarée.
          </li>
          <li>
            InteriMatch n’est pas une entreprise de travail temporaire (ETT) : le POC ne gère pas
            la paie, la facturation ni la contractualisation définitive.
          </li>
        </ul>
        <p>
          En cas de suspicion d’usage illégal, le compte concerné pourra être suspendu. Signalement
          possible via contact@interimatch.local.
        </p>
      </div>

      <div className="panel">
        <h2>Données personnelles (RGPD)</h2>
        <p>
          Base légale : exécution du contrat de mise en relation et consentement à l’inscription.
          Durée de conservation : 3 ans après la dernière activité du compte. Droits d’accès,
          rectification, suppression : via la page Profil ou par email.
        </p>
        <p>
          Les données (identité, compétences, coordonnées, logs de matching) sont traitées
          uniquement pour le fonctionnement du service et ne sont pas revendues. Chiffrement des
          données sensibles au repos (ex. IBAN / pièce d’identité) lorsque renseignées.
        </p>
      </div>

      <div className="panel">
        <h2>Intérim — rappels Code du travail</h2>
        <p>
          Les missions publiées doivent respecter la durée maximale applicable au travail temporaire
          et comporter les mentions essentielles (poste, dates, lieu, rémunération, EPI le cas
          échéant). Ce POC rappelle la durée max côté API ; ce n’est pas un conseil juridique.
        </p>
      </div>

      <div className="panel">
        <h2>Limitation de responsabilité</h2>
        <p>
          InteriMatch est un POC pédagogique. Aucune garantie n’est donnée quant à l’exactitude
          des scores de matching, à la conclusion d’un contrat, ni à l’absence d’erreur technique.
          L’usage de la plateforme se fait sous la seule responsabilité des utilisateurs.
        </p>
      </div>

      <div className="panel">
        <h2>Éco-conception (RGESN)</h2>
        <ul>
          <li>Images compressées / lazy-loading ; pas de médias inutiles.</li>
          <li>Endpoints paginés (take 50) pour limiter les requêtes.</li>
        </ul>
      </div>
    </section>
  );
}
