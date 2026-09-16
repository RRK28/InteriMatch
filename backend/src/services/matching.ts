// matching simple compétences / zone / dispo — pas de ML on est sur un POC

export type MissionInput = {
  metier: string;
  competences: string[];
  ville: string;
  codePostal: string;
  dateDebut: Date;
  dateFin: Date;
};

export type ProfileInput = {
  metiers: string[];
  competences: string[];
  ville?: string | null;
  codePostal?: string | null;
  rayonKm?: number;
  dispoDebut?: Date | null;
  dispoFin?: Date | null;
};

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function dept(cp?: string | null) {
  if (!cp || cp.length < 2) return null;
  return cp.slice(0, 2);
}

export function scoreMatch(mission: MissionInput, profil: ProfileInput) {
  let score = 0;
  const details: Record<string, number> = {};

  // métier (40)
  const mMetier = norm(mission.metier);
  const metierOk = profil.metiers.some((m) => {
    const n = norm(m);
    return n === mMetier || n.includes(mMetier) || mMetier.includes(n);
  });
  details.metier = metierOk ? 40 : 0;
  score += details.metier;

  // compétences (35)
  if (mission.competences.length === 0) {
    details.competences = 20;
  } else {
    const pSet = new Set(profil.competences.map(norm));
    const hits = mission.competences.filter((c) => pSet.has(norm(c))).length;
    details.competences = Math.round((hits / mission.competences.length) * 35);
  }
  score += details.competences;

  // zone (15) — même dept = ok pour le POC
  const dM = dept(mission.codePostal);
  const dP = dept(profil.codePostal);
  if (dM && dP && dM === dP) {
    details.zone = 15;
  } else if (profil.ville && norm(profil.ville) === norm(mission.ville)) {
    details.zone = 12;
  } else {
    details.zone = 3; // un peu de base sinon tout le monde est à 0
  }
  score += details.zone;

  // dispo (10)
  if (!profil.dispoDebut || !profil.dispoFin) {
    details.dispo = 5;
  } else if (profil.dispoDebut <= mission.dateDebut && profil.dispoFin >= mission.dateFin) {
    details.dispo = 10;
  } else if (profil.dispoFin >= mission.dateDebut && profil.dispoDebut <= mission.dateFin) {
    details.dispo = 6;
  } else {
    details.dispo = 0;
  }
  score += details.dispo;

  return { score, details };
}
