import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Menu, CircleUser, Home, Settings, Code, Users } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { hasPermission, PERMISSIONS } from "@/utils/roles";

interface NavigationHeaderProps {
  isMobile: boolean;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  user: any;
  logout: () => void;
}

export function NavigationHeader({
  isMobile,
  isCollapsed,
  setIsCollapsed,
  user,
  logout,
}: NavigationHeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      {isMobile ? (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0 sm:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SheetDescription className="sr-only">Navigation menu for mobile users</SheetDescription>
            <nav className="grid gap-2 text-lg font-medium">
              <Link href="#" className="flex items-center gap-2 text-lg font-semibold">
                <LayoutDashboard className="h-6 w-6 text-[#0e1595]" />
                <span className="sr-only">SoftFlow</span>
              </Link>
              <Link
                href="/dashboard"
                className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-6 py-3 text-muted-foreground bg-primary/10 border-b border-border/50 hover:bg-muted/50 hover:text-foreground"
              >
                <Home className="h-5 w-5" />
                Accueil Dashboard
              </Link>
              <Link
                href="#"
                className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-6 py-3 text-muted-foreground border-b border-border/50 hover:bg-muted/50 hover:text-foreground"
              >
                <Settings className="h-5 w-5" />
                Mon Profil
              </Link>
              {hasPermission(user?.role, PERMISSIONS.CAN_MANAGE_PROJECTS) && (
                <Link
                  href="/addProject"
                  className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-6 py-3 text-muted-foreground border-b border-border/50 hover:bg-muted/50 hover:text-foreground"
                >
                  <Code className="h-5 w-5" />
                  Créer un Projet
                </Link>
              )}
              {hasPermission(user?.role, PERMISSIONS.CAN_VIEW_ASSIGNED_PROJECTS) && (
                <Link
                  href="/projects"
                  className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-6 py-3 text-muted-foreground border-b border-border/50 hover:bg-muted/50 hover:text-foreground"
                >
                  <Code className="h-5 w-5" />
                  Mes Projets
                </Link>
              )}
              {hasPermission(user?.role, PERMISSIONS.CAN_MANAGE_USERS) && (
                <Link
                  href="/users"
                  className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-6 py-3 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                >
                  <Users className="h-5 w-5" />
                  Gestion des Utilisateurs
                </Link>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      ) : (
        <Button
          variant="outline"
          size="icon"
          className="shrink-0 sm:hidden"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      )}
      <div className="w-full flex-1 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <LayoutDashboard className="h-6 w-6 text-[#0e1595]" />
          <span className="text-[#0e1595]">SoftFlow</span>
        </Link>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <CircleUser className="h-5 w-5" />
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Paramètres</DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>Déconnexion</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
