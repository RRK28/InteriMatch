Notes API France Travail
11/09/2026
secteur cible : BTP

API Offres d'emploi v2
compte francetravail.io + abo API obligatoire (sinon invalid_client)
clés : Ressources/.env.france-travail (pas de commit)


Token
POST https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire
grant_type=client_credentials
scope=api_offresdemploiv2 o2dsoffre


Search
GET .../offresdemploi/v2/offres/search
Authorization: Bearer ...

Requêtes qui marchent bien pour nous :
motsCles=BTP
motsCles=macon  (ou maçon)
motsCles=gros oeuvre
+ typeContrat=MIS pour filtrer intérim

Tests du jour (après bascule BTP) :
BTP -> milliers d'offres, beaucoup de MIS
macon + MIS -> ~4700 MIS côté agrégats, résultats cohérents (maçons, coffreurs...)
gros oeuvre -> volume plus petit mais pertinent

Attention 429 si on enchaine trop vite -> sleep dans la CLI


Samples
Ressources/samples/offres-btp-sample.json
Ressources/samples/offres-btp-MIS-sample.json
Ressources/samples/offres-macon-sample.json

(champs utiles, sans contacts)


CLI plus tard
normaliser intitulés (maçon/macon/coffreur...)
dédoublonner id
clean lieux
alimenter tendances ou suggestions dans l'app

plan B : samples locaux / data.gouv / DARES
