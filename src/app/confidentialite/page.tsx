import { LegalPage } from "@/components/legal-page";
import { getLegalConfig } from "@/lib/legal";

export default function ConfidentialitePage() {
  const legal = getLegalConfig();
  return (
    <LegalPage title="Politique de confidentialité">
      <p>Le responsable de traitement est {legal.companyName}. Pour toute demande relative aux données personnelles : {legal.dpoEmail}.</p>
      <h2>Données traitées</h2>
      <ul>
        <li>Données de compte : nom, email, mot de passe haché, vérification email.</li>
        <li>Profil organisme : coordonnées, SIRET/SIREN, NDA, statut Qualiopi, échéances.</li>
        <li>Programmes de formation, métadonnées de preuves, plans d'action et documents générés.</li>
        <li>Données de facturation gérées via Stripe.</li>
      </ul>
      <h2>Finalités</h2>
      <p>Fourniture du service, sécurisation de l'accès, gestion de l'abonnement, export utilisateur et support.</p>
      <h2>Droits</h2>
      <p>Vous pouvez demander l'accès, la rectification, la suppression et la portabilité de vos données via {legal.contactEmail}.</p>
    </LegalPage>
  );
}
