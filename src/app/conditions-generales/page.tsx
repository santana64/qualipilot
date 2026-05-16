import { LegalPage } from "@/components/legal-page";
import { getLegalConfig } from "@/lib/legal";

export default function ConditionsGeneralesPage() {
  const legal = getLegalConfig();
  return (
    <LegalPage title="Conditions générales">
      <p>Les présentes conditions encadrent l'utilisation de QualiPilot, édité par {legal.companyName}. Contact : {legal.contactEmail}.</p>
      <h2>Objet</h2>
      <p>QualiPilot fournit un outil d'organisation documentaire et de pilotage qualité pour la préparation et le suivi de démarches Qualiopi/RNQ.</p>
      <h2>Responsabilité</h2>
      <p>L'utilisateur reste responsable de ses informations, de ses preuves et de la vérification des exigences applicables auprès des sources compétentes.</p>
      <h2>Abonnements</h2>
      <p>Les paiements récurrents sont opérés par Stripe lorsque la configuration Stripe est activée.</p>
      <h2>Limitation</h2>
      <p>L'utilisation de QualiPilot ne garantit pas l'obtention ou le maintien de la certification Qualiopi.</p>
    </LegalPage>
  );
}
