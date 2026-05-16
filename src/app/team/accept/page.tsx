import Link from "next/link";
import { Notice, PageHeader, SectionCard, SubmitButton } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/session";
import { acceptTeamInviteAction } from "@/server/actions/team";

export default async function AcceptTeamInvitePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const token = typeof params.token === "string" ? params.token : "";
  const user = await getCurrentUser();

  return (
    <main className="mx-auto grid min-h-screen max-w-xl place-items-center px-6 py-12">
      <div className="w-full">
        <PageHeader
          title="Invitation QualiPilot"
          description="Connectez-vous avec l'adresse email invitee pour rejoindre l'espace qualite."
        />
        <div className="mt-6 grid gap-4">
          <Notice message={params.error} type="error" />
          <SectionCard>
            {user ? (
              <form action={acceptTeamInviteAction} className="grid gap-4">
                <input type="hidden" name="token" value={token} />
                <p className="text-sm leading-6 text-foreground-muted">
                  Vous etes connecte avec {user.email}. Si cette adresse correspond a l'invitation, confirmez
                  l'acceptation.
                </p>
                <SubmitButton>Accepter l'invitation</SubmitButton>
              </form>
            ) : (
              <div className="grid gap-3 text-sm text-foreground-muted">
                <p>Vous devez vous connecter avant d'accepter cette invitation.</p>
                <Link className="font-semibold text-brand hover:underline" href={`/login?next=/team/accept?token=${encodeURIComponent(token)}`}>
                  Se connecter
                </Link>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </main>
  );
}
