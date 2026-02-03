import Link from "next/link";
import { Stethoscope, Mic, FileText, Users, Calendar, Home } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">HealthSnap</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/" icon={<Home className="w-4 h-4" />}>
              Home
            </NavLink>
            <NavLink href="/record" icon={<Mic className="w-4 h-4" />}>
              Record
            </NavLink>
            <NavLink href="/reports" icon={<FileText className="w-4 h-4" />}>
              Reports
            </NavLink>
            <NavLink href="/doctors" icon={<Users className="w-4 h-4" />}>
              Doctors
            </NavLink>
            <NavLink href="/appointments" icon={<Calendar className="w-4 h-4" />}>
              Appointments
            </NavLink>
          </nav>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:block">
              Demo Patient
            </span>
            <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-medium">
              D
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
        <div className="flex justify-around py-2">
          <MobileNavLink href="/record" icon={<Mic className="w-5 h-5" />} label="Record" />
          <MobileNavLink href="/reports" icon={<FileText className="w-5 h-5" />} label="Reports" />
          <MobileNavLink href="/doctors" icon={<Users className="w-5 h-5" />} label="Doctors" />
          <MobileNavLink href="/appointments" icon={<Calendar className="w-5 h-5" />} label="Appointments" />
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>
    </div>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
    >
      {icon}
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1 px-4 py-1 text-muted-foreground hover:text-primary transition-colors"
    >
      {icon}
      <span className="text-xs">{label}</span>
    </Link>
  );
}
