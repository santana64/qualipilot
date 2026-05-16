import { NavSidebar } from "@/components/nav-sidebar";
import { requireUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (!user.emailVerifiedAt) {
    redirect(`/verify-email?email=${encodeURIComponent(user.email)}&error=${encodeURIComponent("Veuillez verifier votre email avant d'acceder a l'application.")}`);
  }
  return (
    <div className="min-h-screen bg-background">
      <NavSidebar
        userName={user.name ?? ""}
        userEmail={user.email}
        emailVerified={!!user.emailVerifiedAt}
      />
      {/* Desktop: offset for sidebar width. Mobile: offset for topbar height */}
      <div className="pt-14 lg:pl-60 lg:pt-0">
        <main className="mx-auto max-w-6xl px-4 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
