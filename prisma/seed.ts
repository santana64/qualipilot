import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEFAULT_RNQ_CRITERIA, DEFAULT_RNQ_INDICATORS } from "../src/domain/rnq/default-referential";
import {
  generateAccessibilityProcedure,
  generateAuditSummary,
  generateContinuousImprovementPlan,
  generateLearnerWelcomeProcedure,
} from "../src/domain/documents/templates";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL ?? "postgresql://qualipilot:qualipilot@localhost:5432/qualipilot?schema=public",
  }),
});

async function seedReferential() {
  for (const criterion of DEFAULT_RNQ_CRITERIA) {
    await prisma.rnqCriterion.upsert({
      where: { number: criterion.number },
      update: criterion,
      create: criterion,
    });
  }
  const criteria = await prisma.rnqCriterion.findMany();
  const criterionIdByNumber = new Map(criteria.map((criterion) => [criterion.number, criterion.id]));
  for (const indicator of DEFAULT_RNQ_INDICATORS) {
    const criterionId = criterionIdByNumber.get(indicator.criterionNumber);
    if (!criterionId) continue;
    await prisma.rnqIndicator.upsert({
      where: { number: indicator.number },
      update: {
        criterionId,
        title: indicator.title,
        shortDescription: indicator.shortDescription,
        expectedLevel: indicator.expectedLevel,
        evidenceExamples: indicator.evidenceExamples,
        applicableTo: indicator.applicableTo,
        riskLevel: indicator.riskLevel,
      },
      create: {
        number: indicator.number,
        criterionId,
        title: indicator.title,
        shortDescription: indicator.shortDescription,
        expectedLevel: indicator.expectedLevel,
        evidenceExamples: indicator.evidenceExamples,
        applicableTo: indicator.applicableTo,
        riskLevel: indicator.riskLevel,
      },
    });
  }
}

async function main() {
  await seedReferential();
  const email = "demo@qualipilot.fr";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.delete({ where: { id: existing.id } });
  }

  const passwordHash = await bcrypt.hash("QualiPilotDemo2026!", 12);
  const user = await prisma.user.create({
    data: {
      email,
      name: "Camille Martin",
      passwordHash,
      emailVerifiedAt: new Date(),
      organizationProfile: {
        create: {
          organizationName: "Atelier Formation Durable",
          legalForm: "SASU",
          siret: "12345678900018",
          siren: "123456789",
          ndaNumber: "11990000099",
          address: "12 rue des Métiers",
          postalCode: "75011",
          city: "Paris",
          email: "contact@atelier-formation.example",
          phone: "01 42 00 00 00",
          website: "https://atelier-formation.example",
          contactPerson: "Camille Martin",
          activityTypes: ["training actions", "skills assessment", "subcontracting"],
          qualiopiStatus: "SURVEILLANCE_PLANNED",
          certifierName: "Certificateur exemple",
          certificateDate: new Date("2025-03-15"),
          certificateExpiryDate: new Date("2028-03-14"),
          nextAuditDate: new Date("2026-09-20"),
          defaultSignature: "Camille Martin\nResponsable qualité",
          documentFooterText: "Document interne préparatoire - Atelier Formation Durable",
        },
      },
      subscription: {
        create: {
          plan: "CABINET",
          status: "active",
          currentPeriodEnd: new Date("2026-12-31"),
        },
      },
    },
    include: { organizationProfile: true },
  });

  const clients = await Promise.all([
    prisma.cabinetClient.create({
      data: {
        userId: user.id,
        organizationName: "OF Client Alpha",
        contactName: "Nadia Leroy",
        email: "nadia.alpha@example.com",
        phone: "01 55 00 00 01",
        siret: "11122233300011",
        ndaNumber: "11750000175",
        address: "8 avenue des Audits, 69002 Lyon",
        notes: "Client en préparation de renouvellement.",
      },
    }),
    prisma.cabinetClient.create({
      data: {
        userId: user.id,
        organizationName: "Consulting Beta Formation",
        contactName: "Marc Dubois",
        email: "marc.beta@example.com",
        phone: "01 55 00 00 02",
        siret: "44455566600022",
        ndaNumber: "11910000291",
        address: "22 rue Qualité, 31000 Toulouse",
        notes: "Client sous-traitant avec preuves à consolider.",
      },
    }),
  ]);

  const indicators = await prisma.rnqIndicator.findMany({ orderBy: { number: "asc" } });
  for (const indicator of indicators) {
    const status = indicator.number % 7 === 0 ? "NEEDS_REVIEW" : indicator.number % 5 === 0 ? "IN_PROGRESS" : indicator.number % 11 === 0 ? "NOT_APPLICABLE" : "READY";
    const score = status === "READY" ? 85 : status === "NEEDS_REVIEW" ? 60 : status === "IN_PROGRESS" ? 40 : status === "NOT_APPLICABLE" ? 0 : 0;
    await prisma.indicatorProgress.create({
      data: {
        userId: user.id,
        indicatorId: indicator.id,
        status,
        readinessScore: score,
        notes: indicator.number % 4 === 0 ? "Point à vérifier lors de la prochaine revue qualité." : null,
        lastReviewedAt: new Date("2026-04-20"),
      },
    });
  }

  const trainings = await Promise.all([
    prisma.trainingProgram.create({
      data: {
        userId: user.id,
        clientId: clients[0].id,
        title: "Animer une formation professionnelle",
        category: "Pédagogie",
        publicTarget: "Formateurs indépendants et consultants souhaitant structurer leurs interventions.",
        prerequisites: "Avoir une expertise métier à transmettre.",
        objectives: "Concevoir une séquence, animer un groupe et évaluer les acquis.",
        duration: "14 heures",
        accessDelay: "14 jours",
        priceCents: 120000,
        modalities: "Présentiel ou classe virtuelle synchrone.",
        teachingMethods: "Apports courts, mises en situation, études de cas.",
        evaluationMethods: "Quiz, observation en situation, grille d'évaluation.",
        accessibilityInfo: "Besoin d'adaptation étudié avec le référent handicap.",
        contactInfo: "contact@atelier-formation.example",
        resultIndicators: "92 % de satisfaction en 2025.",
        status: "PUBLISHED",
        notes: "Formation prioritaire pour l'audit.",
      },
    }),
    prisma.trainingProgram.create({
      data: {
        userId: user.id,
        clientId: clients[0].id,
        title: "Créer son offre de consultant",
        category: "Entrepreneuriat",
        publicTarget: "Consultants et experts métier en lancement d'activité.",
        prerequisites: "Projet professionnel identifié.",
        objectives: "Formaliser une offre, fixer un tarif et préparer un plan de prospection.",
        duration: "21 heures",
        accessDelay: "10 jours",
        priceCents: 180000,
        modalities: "À distance avec ateliers collectifs.",
        teachingMethods: "Ateliers guidés, retours pairs, supports téléchargeables.",
        evaluationMethods: "Dossier de positionnement et présentation finale.",
        accessibilityInfo: "Adaptations étudiées sur demande.",
        contactInfo: "camille@atelier-formation.example",
        resultIndicators: "85 % des participants finalisent une offre.",
        status: "PUBLISHED",
      },
    }),
    prisma.trainingProgram.create({
      data: {
        userId: user.id,
        clientId: clients[1].id,
        title: "Bilan de compétences entrepreneurial",
        category: "Bilan de compétences",
        publicTarget: "Professionnels en réflexion sur une transition indépendante.",
        prerequisites: "Entretien préalable obligatoire.",
        objectives: "Identifier les compétences, motivations et pistes réalistes.",
        duration: "24 heures",
        accessDelay: "21 jours",
        priceCents: 220000,
        modalities: "Entretiens individuels et travail personnel guidé.",
        teachingMethods: "Entretiens, tests, analyse de parcours.",
        evaluationMethods: "Synthèse finale remise au bénéficiaire.",
        accessibilityInfo: "Modalités adaptées selon besoins individuels.",
        contactInfo: "bilan@atelier-formation.example",
        resultIndicators: "Indicateurs en cours de consolidation.",
        status: "DRAFT",
      },
    }),
  ]);

  const evidenceTypes = [
    "PROCEDURE",
    "PROGRAM",
    "ATTENDANCE_SHEET",
    "SATISFACTION_SURVEY",
    "EVALUATION_RESULT",
    "TRAINER_CV",
    "ACCESSIBILITY_DOCUMENT",
    "CONTRACT",
    "FUNDER_DOCUMENT",
    "IMPROVEMENT_ACTION",
    "PUBLIC_INFORMATION_PROOF",
    "SUBCONTRACTOR_PROOF",
    "OTHER",
  ] as const;

  for (let index = 1; index <= 30; index += 1) {
    const indicator = indicators[(index - 1) % indicators.length];
    const training = trainings[(index - 1) % trainings.length];
    const evidence = await prisma.evidence.create({
      data: {
        userId: user.id,
        clientId: clients[index % clients.length].id,
        title: `Preuve ${index.toString().padStart(2, "0")} - ${indicator.title}`,
        type: evidenceTypes[(index - 1) % evidenceTypes.length],
        description: `Élément de preuve associé à l'indicateur ${indicator.number}.`,
        externalUrl: `https://documents.example/preuves/${index}`,
        validityDate: index % 9 === 0 ? new Date("2026-01-15") : new Date("2027-12-31"),
        responsible: index % 2 === 0 ? "Camille Martin" : "Responsable pédagogique",
        status: index % 9 === 0 ? "TO_REVIEW" : "ACTIVE",
        notes: index % 6 === 0 ? "À valider selon la situation du bénéficiaire." : null,
      },
    });
    await prisma.evidenceIndicator.create({
      data: {
        evidenceId: evidence.id,
        indicatorId: indicator.id,
      },
    });
    if (index <= 12) {
      await prisma.evidenceTrainingProgram.create({
        data: {
          evidenceId: evidence.id,
          trainingProgramId: training.id,
        },
      });
    }
  }

  for (let index = 1; index <= 10; index += 1) {
    const indicator = indicators[(index * 3) % indicators.length];
    await prisma.actionPlanItem.create({
      data: {
        userId: user.id,
        clientId: clients[index % clients.length].id,
        title: [
          "Mettre à jour la procédure handicap",
          "Compléter les résultats publics",
          "Archiver les questionnaires satisfaction",
          "Relancer le sous-traitant sur sa charte qualité",
          "Revoir la grille d'évaluation finale",
          "Formaliser la veille réglementaire",
          "Ajouter la preuve de coordination intervenant",
          "Contrôler les liens programmes publiés",
          "Préparer la revue qualité trimestrielle",
          "Clôturer l'action issue de réclamation",
        ][index - 1],
        description: "Action issue de la revue qualité de démonstration.",
        priority: index % 4 === 0 ? "CRITICAL" : index % 3 === 0 ? "HIGH" : "MEDIUM",
        status: index % 5 === 0 ? "DONE" : index % 2 === 0 ? "IN_PROGRESS" : "TODO",
        dueDate: index <= 3 ? new Date("2026-04-15") : new Date(`2026-0${Math.min(index, 9)}-25`),
        responsible: index % 2 === 0 ? "Camille Martin" : "Équipe pédagogique",
        indicatorId: indicator.id,
        trainingProgramId: trainings[index % trainings.length].id,
        completionNote: index % 5 === 0 ? "Action clôturée avec preuve associée." : null,
        completedAt: index % 5 === 0 ? new Date("2026-04-18") : null,
      },
    });
  }

  await prisma.auditRecord.create({
    data: {
        userId: user.id,
        clientId: clients[0].id,
      type: "SURVEILLANCE",
      scheduledDate: new Date("2026-09-20"),
      certifierName: "Certificateur exemple",
      status: "PLANNED",
      readinessScore: 78,
      notes: "Préparer les preuves des indicateurs critiques et la revue d'amélioration continue.",
    },
  });

  const documentInput = {
    organization: user.organizationProfile!,
    audit: { type: "SURVEILLANCE", scheduledDate: new Date("2026-09-20"), readinessScore: 78 },
    actions: [
      { title: "Mettre à jour la procédure handicap", status: "IN_PROGRESS", dueDate: new Date("2026-05-25") },
      { title: "Préparer la revue qualité trimestrielle", status: "TODO", dueDate: new Date("2026-06-25") },
    ],
    missingPoints: ["Indicateur 26 : preuve handicap à vérifier.", "Indicateur 32 : plan d'amélioration à compléter."],
  };
  const generated = [
    generateLearnerWelcomeProcedure(documentInput),
    generateAccessibilityProcedure(documentInput),
    generateContinuousImprovementPlan(documentInput),
    generateAuditSummary(documentInput),
  ];
  for (const doc of generated) {
    await prisma.generatedDocument.create({
      data: {
        userId: user.id,
        clientId: clients[0].id,
        type: doc.title.includes("handicap") ? "ACCESSIBILITY_PROCEDURE" : doc.title.includes("Plan") ? "CONTINUOUS_IMPROVEMENT_PLAN" : doc.title.includes("Synthèse") ? "AUDIT_SUMMARY" : "LEARNER_WELCOME_PROCEDURE",
        title: doc.title,
        contentHtml: doc.contentHtml,
        contentText: doc.contentText,
      },
    });
  }

  await prisma.emailReminder.createMany({
    data: [
      {
        userId: user.id,
        clientId: clients[0].id,
        type: "AUDIT_PREPARATION",
        subject: "Préparer le dossier audit Client Alpha",
        message: "Vérifier les preuves critiques et générer le dossier préparatoire avant l'audit.",
        scheduledFor: new Date("2026-08-20T09:00:00"),
      },
      {
        userId: user.id,
        clientId: clients[1].id,
        type: "EVIDENCE_EXPIRY",
        subject: "Contrôler les preuves Beta",
        message: "Plusieurs preuves arrivent à échéance et doivent être revues.",
        scheduledFor: new Date("2026-05-20T09:00:00"),
      },
    ],
  });

  console.log("Seed terminé : demo@qualipilot.fr / QualiPilotDemo2026!");
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
