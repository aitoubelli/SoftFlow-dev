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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  CircleUser,
  LayoutDashboard,
  Menu,
  Plus,
  FolderOpen,
  Calendar,
  Users,
  TrendingUp,
  Clock
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import ProjectForm from "@/components/form/projectForm";

export default function Home() {
  const { user, token, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth");
    }
  }, [isAuthenticated, router]);

  const refreshProjects = () => {
    fetchProjects().then((data) => {
      if (data) {
        setProjects(data);
      }
    });
  };

  const fetchProjects = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/projects`, {
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

  const getProjectStatus = (project: any) => {
    // You can customize this logic based on your project data
    if (project.status === 'active') return { label: 'Actif', variant: 'default' as const };
    if (project.status === 'completed') return { label: 'Terminé', variant: 'secondary' as const };
    return { label: 'En cours', variant: 'outline' as const };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex flex-col flex-1 transition-all duration-300 ${isCollapsed ? 'md:ml-[60px]' : 'md:ml-[220px] lg:ml-[280px]'}`}>
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden border-primary/20 hover:bg-primary/5"
              >
                <Menu className="h-5 w-5 text-primary" />
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
              <span className="text-[#0e1595] font-bold">SoftFlow</span>
            </Link>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full border-primary/20 hover:bg-primary/5">
                <CircleUser className="h-5 w-5 text-primary" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-primary/20">
              <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="hover:bg-primary/5">Paramètres</DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-primary/5">Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()} className="hover:bg-destructive/5">Déconnexion</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-4 lg:gap-8 lg:p-8 overflow-auto pb-20 lg:pb-[60px] bg-gradient-to-br from-background via-background to-primary/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Breadcrumbs items={[{ label: "Accueil", href: "/projects" }, { label: "Mes Projets", href: "/projects" }]} />
            {user && (user.role === 'admin' || user.role === 'owner') && (
              <Button
                onClick={() => setIsProjectModalOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un Projet
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Mes Projets
            </h1>
            <p className="text-muted-foreground text-lg">
              Gérez et suivez vos projets en cours
            </p>
          </div>

          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="rounded-full bg-primary/10 p-6">
                <FolderOpen className="h-12 w-12 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">Aucun projet trouvé</h3>
                <p className="text-muted-foreground max-w-md">
                  Vous n'avez pas encore de projets. Commencez par créer votre premier projet.
                </p>
              </div>
              {user && (user.role === 'admin' || user.role === 'owner') && (
                <Button
                  onClick={() => setIsProjectModalOpen(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer votre premier projet
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {projects.map((project: any) => {
                const status = getProjectStatus(project);
                return (
                  <Card
                    key={project._id}
                    className="group cursor-pointer transition-all duration-300 hover:shadow-elegant hover:-translate-y-1 border-primary/10 hover:border-primary/20 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm"
                    onClick={() => router.push(`/project/${project._id}`)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-2">
                            {project.name}
                          </CardTitle>
                          <Badge variant={status.variant} className="w-fit text-xs">
                            {status.label}
                          </Badge>
                        </div>
                        <div className="rounded-lg bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors">
                          <FolderOpen className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {project.description || "Aucune description disponible"}
                      </CardDescription>

                      <div className="space-y-2 text-xs text-muted-foreground">
                        {project.createdAt && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            <span>Créé le {formatDate(project.createdAt)}</span>
                          </div>
                        )}
                        {project.teamSize && (
                          <div className="flex items-center gap-2">
                            <Users className="h-3 w-3" />
                            <span>{project.teamSize} membre{project.teamSize > 1 ? 's' : ''}</span>
                          </div>
                        )}
                        {project.progress && (
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-3 w-3" />
                            <span>{project.progress}% complété</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
        <DashboardFooter isCollapsed={isCollapsed} />

        {/* Create Project Modal */}
        <Sheet open={isProjectModalOpen} onOpenChange={setIsProjectModalOpen}>
          <SheetContent side="right" className="w-full sm:max-w-lg">
            <ProjectForm
              onSuccess={() => {
                setIsProjectModalOpen(false);
                refreshProjects();
              }}
              onCancel={() => setIsProjectModalOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
