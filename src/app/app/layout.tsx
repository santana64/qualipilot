import { NavSidebar } from "@/components/nav-sidebar";
import { requireUser } from "@/lib/auth/session";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-screen bg-background">
      <NavSidebar
        userName={user.name ?? ""}
        userEmail={user.email}
        emailVerified={true}
      />
      {/* Desktop: offset for sidebar width. Mobile: offset for topbar height */}
      <div className="pt-14 lg:pl-60 lg:pt-0">
        <main className="mx-auto max-w-6xl px-4 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
