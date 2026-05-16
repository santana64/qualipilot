export type LegalConfig = {
  companyName: string;
  legalForm: string;
  capital: string;
  siren: string;
  siret: string;
  address: string;
  publisherName: string;
  hostName: string;
  hostAddress: string;
  contactEmail: string;
  dpoEmail: string;
};

function env(name: string, fallback = "Non configuré") {
  return process.env[name] || fallback;
}

export function getLegalConfig(): LegalConfig {
  return {
    companyName: env("LEGAL_COMPANY_NAME"),
    legalForm: env("LEGAL_COMPANY_FORM"),
    capital: env("LEGAL_COMPANY_CAPITAL"),
    siren: env("LEGAL_COMPANY_SIREN"),
    siret: env("LEGAL_COMPANY_SIRET"),
    address: env("LEGAL_COMPANY_ADDRESS"),
    publisherName: env("LEGAL_PUBLISHER_NAME"),
    hostName: env("LEGAL_HOST_NAME", "Hébergeur à configurer"),
    hostAddress: env("LEGAL_HOST_ADDRESS"),
    contactEmail: env("LEGAL_CONTACT_EMAIL", process.env.EMAIL_FROM || "contact à configurer"),
    dpoEmail: env("LEGAL_DPO_EMAIL", env("LEGAL_CONTACT_EMAIL", "dpo à configurer")),
  };
}
