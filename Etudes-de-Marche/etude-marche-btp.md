# Étude de marché — InteriMatch (BTP)

## Secteur
Intérim BTP (gros œuvre / second œuvre). Choix motivé par :
- volume d’offres MIS côté France Travail (tests 11/09 : milliers d’offres BTP, ~4700 MIS maçon)
- acteurs historiques peu digitaux sur le matching chantier
- concurrence récente type Bilhalp (BTP) → place pour un outil plus léger / local

## Concurrence (aperçu)
| Acteur | Positionnement | Limite pour nous |
|---|---|---|
| Adecco / Randstad / Manpower | généraliste | UX datée, peu spécialisée chantier |
| Bilhalp | BTP | référence, plus mature |
| Staffmatch | event / logistique | hors BTP |
| Brigad | restauration | hors scope |

## Douleurs
**Entreprises** : délais pour trouver un coffreur/maçon dispo, turnover, besoin de EPI / matos clair.
**Intérimaires** : missions mal ciblées, déplacement inutile, manque de visibilité sur le taux horaire réel.

## Proposition de valeur
> InteriMatch connecte en quelques minutes une entreprise BTP à un intérimaire dispo, via un matching métier / compétences / zone / disponibilité, enrichi par les tendances d’offres France Travail.

## Données publiques
API Offres d’emploi France Travail v2 (filtre MIS + mots-clés métier). Nettoyage via CLI `im-ft` (normalisation intitulés, dédoublonnage, agrégats tendances).
