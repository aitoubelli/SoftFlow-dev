"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { RecentUsers } from "@/components/dashboard/RecentUsers";
import { Sidebar } from "@/components/dashboard/Sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell, CircleUser, Users, Shield, Crown, Code, ArrowUpRight, LayoutDashboard, PanelLeftClose, PanelRightOpen } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";
import AdminDashboardView from "@/components/dashboard/views/AdminDashboardView";
import OwnerDashboardView from "@/components/dashboard/views/OwnerDashboardView";
import DeveloperDashboardView from "@/components/dashboard/views/DeveloperDashboardView";
import { ROLES } from "@/utils/roles";

const Dashboard = () => {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const router = useRouter();

  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/"); // Redirect to home page after logout
  };

  // Redirect unauthenticated users to the home page
  if (!loading && !isAuthenticated) {
    router.push("/");
    return null; // Prevent rendering the dashboard content
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        Loading...
      </div>
    );
  }

  // If user is null but not loading and isAuthenticated is true, it's an unexpected state,
  // but the redirect above should handle unauthenticated users.
  // This check ensures `user` is available for rendering the dashboard.
  if (!user) {
    // This case should ideally not be reached if the above redirect works,
    // but as a fallback, we can show a generic error or redirect again.
    router.push("/");
    return null;
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex flex-col flex-1 transition-all duration-300 ${isCollapsed ? 'md:ml-[60px]' : 'md:ml-[220px] lg:ml-[280px]'}`}>
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Basculer le menu de navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                {/* Mobile navigation items will be handled by the Sidebar component */}
              </nav>
            </SheetContent>
          </Sheet>
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
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto pb-20 lg:pb-[60px]">
          {user.role === ROLES.ADMIN && <AdminDashboardView />}
          {user.role === ROLES.OWNER && <OwnerDashboardView />}
          {user.role === ROLES.DEVELOPER && <DeveloperDashboardView />}
        </main>
        <DashboardFooter isCollapsed={isCollapsed} />
      </div>
    </div>
  );
};

export default Dashboard;
