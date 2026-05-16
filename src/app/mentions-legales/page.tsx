import { LegalPage } from "@/components/legal-page";
import { getLegalConfig } from "@/lib/legal";

export default function MentionsLegalesPage() {
  const legal = getLegalConfig();
  return (
    <LegalPage title="Mentions légales">
      <h2>Éditeur</h2>
      <p>QualiPilot est édité par {legal.companyName}, {legal.legalForm}, au capital de {legal.capital}, SIREN {legal.siren}, SIRET {legal.siret}, dont le siège est situé {legal.address}.</p>
      <h2>Directeur de publication</h2>
      <p>{legal.publisherName}.</p>
      <h2>Hébergement</h2>
      <p>{legal.hostName}, {legal.hostAddress}.</p>
      <h2>Contact</h2>
      <p>{legal.contactEmail}.</p>
    </LegalPage>
  );
}
