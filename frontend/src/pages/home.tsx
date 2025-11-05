"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell, CircleUser, LayoutDashboard, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export default function Home() {
  const { user, token, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth");
    }
  }, [isAuthenticated, router]);

  const fetchProjects = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:8000/api/projects", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch projects");
      }
      const projects = await res.json();
      return projects;
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchProjects().then((data) => {
        if (data) {
          setProjects(data);
          console.log("Fetched projects:", data);
        }
      });
    }
  }, [user, token]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        Loading...
      </div>
    );
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
              <DropdownMenuItem onClick={() => logout()}>Déconnexion</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto pb-20 lg:pb-[60px]">
          <div className="flex items-center justify-between">
            <Breadcrumbs items={[{ label: "Accueil", href: "/home" }, { label: "Mes Projets", href: "/home" }]} />
            {user && (user.role === 'admin' || user.role === 'owner') && (
                <button className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-md text-sm" onClick={() => router.push("/addProject")}>
                    Ajouter un Projet
                </button>
            )}
          </div>
          <h1 className="font-semibold text-lg md:text-2xl">Mes Projets</h1>
          <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
            {projects.map((project: any) => (
              <div
                key={project._id}
                className="bg-white p-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow duration-300"
                onClick={() => router.push(`/project/${project._id}`)}
              >
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="text-sm font-medium">{project.name}</h3>
                </div>
                <div>
                  <p className="text-xs text-gray-500">
                    {project.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </main>
        <DashboardFooter isCollapsed={isCollapsed} />
      </div>
    </div>
  );
}
