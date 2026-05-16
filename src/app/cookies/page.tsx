import { LegalPage } from "@/components/legal-page";
import { getLegalConfig } from "@/lib/legal";

export default function CookiesPage() {
  const legal = getLegalConfig();
  return (
    <LegalPage title="Politique cookies">
      <p>QualiPilot utilise un cookie de session nécessaire à l'authentification. Aucun cookie marketing n'est prévu dans cette version locale.</p>
      <h2>Cookies nécessaires</h2>
      <p>Le cookie <strong>qualipilot_session</strong> permet de maintenir la session utilisateur de manière sécurisée.</p>
      <h2>Évolution</h2>
      <p>Si des outils de mesure d'audience ou de support sont ajoutés, cette page sera mise à jour et les consentements adaptés. Contact : {legal.contactEmail}.</p>
    </LegalPage>
  );
}
