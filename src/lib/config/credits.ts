export const appCredits = {
  project: "Absensi CN",
  team: "RBAR Team",
  leadCreator: "Randhu Paksi Membumi",
  leadCreatorShortRole: "Creator & Lead Fullstack Developer",
  leadCreatorFullRole:
    "Creator, Lead Fullstack Developer, System Analyst, UI/UX Designer, Frontend Engineer, Backend Engineer",
  contributors: [
    {
      name: "Ilham Rae Utomo",
      role: "Backend Developer, Hosting & Deployment Engineer",
    },
    {
      name: "Abiansyah Putra",
      role: "Backend Developer, Hosting & Deployment Engineer",
    },
    {
      name: "Fabian Nanday Ghanian",
      role: "UI/UX Designer",
    },
  ],
  copyright: "Copyright 2026 RBAR Team. All rights reserved.",
  statement:
    "Absensi CN dibuat oleh RBAR Team dan dipimpin oleh Randhu Paksi Membumi sebagai Creator, Lead Fullstack Developer, System Analyst, UI/UX Designer, Frontend Engineer, dan Backend Engineer.",
};

export const appCreditSummary = `${appCredits.leadCreator} - ${appCredits.leadCreatorShortRole}`;

export const appCreditLongStatement = `${appCredits.statement} Project roles: ${appCredits.contributors
  .map((contributor) => `${contributor.name} sebagai ${contributor.role}`)
  .join("; ")}.`;
