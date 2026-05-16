import nodemailer from "nodemailer";
import { Resend } from "resend";
import { EmailError } from "@/lib/errors";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
  unsubscribeUrl?: string;
};

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getFromAddress() {
  return process.env.EMAIL_FROM || "QualiPilot <no-reply@qualipilot.fr>";
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function buildButton(label: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
    <tr>
      <td style="background:#16a34a;border-radius:6px;">
        <a href="${url}" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.2px;">${label}</a>
      </td>
    </tr>
  </table>`;
}

function buildEmailHtml(bodyHtml: string, footerExtra?: string): string {
  const appUrl = getAppUrl();
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:Arial,Helvetica,sans-serif;color:#1c1917;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f5f5f4;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <a href="${appUrl}" style="text-decoration:none;">
                <span style="font-size:22px;font-weight:700;color:#16a34a;letter-spacing:-0.5px;">&#10003;&nbsp;QualiPilot</span>
              </a>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border-radius:10px;padding:40px 40px 32px;border:1px solid #e7e5e4;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:28px 0 0;font-size:12px;color:#78716c;line-height:1.7;">
              ${footerExtra ? `<p style="margin:0 0 8px;">${footerExtra}</p>` : ""}
              <p style="margin:0;">QualiPilot &mdash; Logiciel de conformit&eacute; Qualiopi</p>
              <p style="margin:4px 0 0;">
                <a href="${appUrl}" style="color:#78716c;">Mon espace</a>
                &nbsp;&bull;&nbsp;
                <a href="${appUrl}/conditions-generales" style="color:#78716c;">CGU</a>
                &nbsp;&bull;&nbsp;
                <a href="${appUrl}/confidentialite" style="color:#78716c;">Confidentialit&eacute;</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY ||
      (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD),
  );
}

export async function sendEmail(payload: EmailPayload) {
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: getFromAddress(),
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      headers: payload.unsubscribeUrl
        ? {
            "List-Unsubscribe": `<${payload.unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          }
        : undefined,
    });
    return;
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    await transporter.sendMail({
      from: getFromAddress(),
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      headers: payload.unsubscribeUrl
        ? {
            "List-Unsubscribe": `<${payload.unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          }
        : undefined,
    });
    return;
  }

  throw new EmailError();
}

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${getAppUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  const safeUrl = escapeHtml(url);

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1c1917;letter-spacing:-0.5px;">V&eacute;rifiez votre adresse email</h1>
    <p style="margin:0 0 20px;font-size:15px;color:#57534e;line-height:1.6;">Bienvenue sur QualiPilot&nbsp;! Confirmez votre adresse email pour acc&eacute;der &agrave; votre espace de conformit&eacute; Qualiopi.</p>
    ${buildButton("Vérifier mon email", safeUrl)}
    <p style="margin:20px 0 0;font-size:13px;color:#78716c;">Ce lien expire dans <strong>24 heures</strong>. Si vous n'avez pas cr&eacute;&eacute; de compte QualiPilot, ignorez ce message.</p>
    <hr style="margin:28px 0;border:none;border-top:1px solid #e7e5e4;">
    <p style="margin:0;font-size:12px;color:#a8a29e;">Ou copiez ce lien dans votre navigateur&nbsp;:<br><span style="word-break:break-all;color:#57534e;">${safeUrl}</span></p>
  `;

  await sendEmail({
    to: email,
    subject: "Vérifiez votre email — QualiPilot",
    html: buildEmailHtml(body),
    text: `Bienvenue sur QualiPilot !\n\nConfirmez votre adresse email pour accéder à votre espace :\n${url}\n\nCe lien expire dans 24 heures.`,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${getAppUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const safeUrl = escapeHtml(url);

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1c1917;letter-spacing:-0.5px;">R&eacute;initialisation du mot de passe</h1>
    <p style="margin:0 0 20px;font-size:15px;color:#57534e;line-height:1.6;">Vous avez demand&eacute; &agrave; r&eacute;initialiser le mot de passe de votre compte QualiPilot. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.</p>
    ${buildButton("Réinitialiser mon mot de passe", safeUrl)}
    <p style="margin:20px 0 0;font-size:13px;color:#78716c;">Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas fait cette demande, ignorez ce message &mdash; votre mot de passe reste inchang&eacute;.</p>
    <hr style="margin:28px 0;border:none;border-top:1px solid #e7e5e4;">
    <p style="margin:0;font-size:12px;color:#a8a29e;">Ou copiez ce lien dans votre navigateur&nbsp;:<br><span style="word-break:break-all;color:#57534e;">${safeUrl}</span></p>
  `;

  await sendEmail({
    to: email,
    subject: "Réinitialisation de votre mot de passe — QualiPilot",
    html: buildEmailHtml(body),
    text: `Réinitialisez votre mot de passe QualiPilot :\n${url}\n\nCe lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez ce message.`,
  });
}

export async function sendWelcomeEmail(email: string, name: string) {
  const appUrl = getAppUrl();
  const safeName = escapeHtml(name);

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1c1917;letter-spacing:-0.5px;">Bienvenue sur QualiPilot, ${safeName}&nbsp;!</h1>
    <p style="margin:0 0 20px;font-size:15px;color:#57534e;line-height:1.6;">Votre espace de conformit&eacute; Qualiopi est pr&ecirc;t. Voici comment d&eacute;marrer&nbsp;:</p>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f5f5f4;font-size:14px;color:#57534e;">
          <span style="font-weight:700;color:#16a34a;">1.</span>&nbsp; Compl&eacute;tez le profil de votre organisme dans <strong>Param&egrave;tres</strong>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f5f5f4;font-size:14px;color:#57534e;">
          <span style="font-weight:700;color:#16a34a;">2.</span>&nbsp; Ajoutez vos formations dans <strong>Formations</strong>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f5f5f4;font-size:14px;color:#57534e;">
          <span style="font-weight:700;color:#16a34a;">3.</span>&nbsp; Importez vos preuves qualit&eacute; dans <strong>Preuves</strong>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 0;font-size:14px;color:#57534e;">
          <span style="font-weight:700;color:#16a34a;">4.</span>&nbsp; Consultez votre score de pr&eacute;paration dans le <strong>Tableau de bord</strong>
        </td>
      </tr>
    </table>
    ${buildButton("Accéder à mon espace", escapeHtml(appUrl + "/app"))}
    <p style="margin:20px 0 0;font-size:13px;color:#78716c;">Des questions&nbsp;? R&eacute;pondez directement &agrave; cet email, nous vous r&eacute;pondons sous 24h.</p>
  `;

  await sendEmail({
    to: email,
    subject: `Bienvenue sur QualiPilot, ${name} !`,
    html: buildEmailHtml(body),
    text: `Bienvenue sur QualiPilot, ${name} !\n\nVotre espace est prêt. Pour démarrer :\n1. Complétez le profil de votre organisme\n2. Ajoutez vos formations\n3. Importez vos preuves qualité\n4. Consultez votre score de préparation\n\nAccédez à votre espace : ${appUrl}/app`,
  });
}

export async function sendTeamInviteEmail(input: {
  to: string;
  inviterName: string;
  organizationName: string;
  role: string;
  inviteUrl: string;
}) {
  const safeInviter = escapeHtml(input.inviterName);
  const safeOrg = escapeHtml(input.organizationName);
  const safeUrl = escapeHtml(input.inviteUrl);
  const roleLabels: Record<string, string> = {
    ADMIN: "Administrateur",
    QUALITY_MANAGER: "Responsable qualité",
    TRAINER: "Formateur",
    VIEWER: "Observateur",
  };
  const roleLabel = escapeHtml(roleLabels[input.role] ?? input.role);

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1c1917;letter-spacing:-0.5px;">Invitation &agrave; rejoindre QualiPilot</h1>
    <p style="margin:0 0 20px;font-size:15px;color:#57534e;line-height:1.6;"><strong>${safeInviter}</strong> vous invite &agrave; rejoindre l'espace <strong>${safeOrg}</strong> sur QualiPilot en tant que <strong>${roleLabel}</strong>.</p>
    <table cellpadding="0" cellspacing="0" style="width:100%;background:#f5f5f4;border-radius:6px;margin-bottom:24px;">
      <tr>
        <td style="padding:16px 20px;font-size:14px;color:#57534e;line-height:1.6;">
          QualiPilot est un logiciel de gestion de la conformit&eacute; Qualiopi. Il vous permettra de suivre les indicateurs RNQ, g&eacute;rer les preuves qualit&eacute; et pr&eacute;parer les audits de certification.
        </td>
      </tr>
    </table>
    ${buildButton("Accepter l'invitation", safeUrl)}
    <p style="margin:20px 0 0;font-size:13px;color:#78716c;">Cette invitation expire dans <strong>14 jours</strong>. Si vous ne souhaitez pas rejoindre cet espace, ignorez ce message.</p>
    <hr style="margin:28px 0;border:none;border-top:1px solid #e7e5e4;">
    <p style="margin:0;font-size:12px;color:#a8a29e;">Ou copiez ce lien dans votre navigateur&nbsp;:<br><span style="word-break:break-all;color:#57534e;">${safeUrl}</span></p>
  `;

  await sendEmail({
    to: input.to,
    subject: `${input.inviterName} vous invite sur QualiPilot`,
    html: buildEmailHtml(body),
    text: `${input.inviterName} vous invite à rejoindre ${input.organizationName} sur QualiPilot en tant que ${roleLabel}.\n\nAcceptez l'invitation : ${input.inviteUrl}\n\nCette invitation expire dans 14 jours.`,
  });
}

export async function sendReminderEmail(input: {
  to: string;
  name: string;
  subject: string;
  message: string;
  clientName?: string;
  type: "ACTION_DUE" | "EVIDENCE_EXPIRY" | "AUDIT_PREPARATION";
  unsubscribeUrl: string;
}) {
  const appUrl = getAppUrl();
  const safeName = escapeHtml(input.name);
  const safeMessage = escapeHtml(input.message);

  const typeConfig = {
    ACTION_DUE: {
      icon: "&#9888;",
      color: "#d97706",
      bg: "#fffbeb",
      border: "#fde68a",
      label: "Action qualit&eacute; &agrave; traiter",
    },
    EVIDENCE_EXPIRY: {
      icon: "&#128196;",
      color: "#dc2626",
      bg: "#fef2f2",
      border: "#fecaca",
      label: "Preuve &agrave; renouveler",
    },
    AUDIT_PREPARATION: {
      icon: "&#128203;",
      color: "#16a34a",
      bg: "#f0fdf4",
      border: "#bbf7d0",
      label: "Pr&eacute;paration d&apos;audit",
    },
  }[input.type];

  const clientBlock = input.clientName
    ? `<p style="margin:0 0 4px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#78716c;">Client</p>
       <p style="margin:0 0 16px;font-size:14px;color:#1c1917;">${escapeHtml(input.clientName)}</p>`
    : "";

  const body = `
    <table cellpadding="0" cellspacing="0" style="width:100%;background:${typeConfig.bg};border:1px solid ${typeConfig.border};border-radius:6px;margin-bottom:24px;">
      <tr>
        <td style="padding:14px 18px;">
          <span style="font-size:13px;font-weight:700;color:${typeConfig.color};">${typeConfig.icon}&nbsp; ${typeConfig.label}</span>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 20px;font-size:15px;color:#57534e;line-height:1.6;">Bonjour <strong>${safeName}</strong>,</p>
    ${clientBlock}
    <p style="margin:0 0 24px;font-size:15px;color:#1c1917;line-height:1.6;">${safeMessage}</p>
    ${buildButton("Mettre à jour mon dossier", escapeHtml(appUrl + "/app"))}
    <hr style="margin:28px 0;border:none;border-top:1px solid #e7e5e4;">
    <p style="margin:0;font-size:12px;color:#a8a29e;">Vous recevez cet email car vous avez un rappel actif sur QualiPilot.<br>
    <a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#a8a29e;">Se d&eacute;sinscrire des rappels email</a></p>
  `;

  await sendEmail({
    to: input.to,
    subject: input.subject,
    html: buildEmailHtml(body),
    text: `${input.clientName ? `Client : ${input.clientName}\n` : ""}${input.message}\n\nConnectez-vous à QualiPilot pour mettre à jour votre dossier : ${appUrl}/app`,
    unsubscribeUrl: input.unsubscribeUrl,
  });
}
