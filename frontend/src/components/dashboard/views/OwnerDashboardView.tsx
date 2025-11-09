import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, GitBranch, Users, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ProjectCounts {
  totalProjects: number;
  inProgressProjects?: number; // Optional, as per backend controller comment
  completedProjects?: number; // Optional
  teamMembers: number; // This will remain 0 for now as per backend
}

const OwnerDashboardView = () => {
  const { token } = useAuth();
  const [projectCounts, setProjectCounts] = useState<ProjectCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjectCounts = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8000/api/projects/counts', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: ProjectCounts = await response.json();
        setProjectCounts(data);
      } catch (err) {
        setError('Failed to fetch project counts.');
        console.error('Error fetching project counts:', err);
        toast.error('Failed to fetch project counts.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchProjectCounts();
    }
  }, [token]);

  if (loading) {
    return <div className="p-4">Loading project data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto pb-20 lg:pb-[60px]">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Tableau de bord Propriétaire</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card x-chunk="dashboard-01-chunk-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Projets Totaux
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectCounts?.totalProjects ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              <ArrowUpRight className="h-3 w-3 inline" /> Tous les projets actifs
            </p>
          </CardContent>
        </Card>
        <Card x-chunk="dashboard-01-chunk-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Projets en Cours
            </CardTitle>
            <GitBranch className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectCounts?.inProgressProjects ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Projets en développement
            </p>
          </CardContent>
        </Card>
        <Card x-chunk="dashboard-01-chunk-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membres de l'Équipe</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectCounts?.teamMembers ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Collaborateurs actifs
            </p>
          </CardContent>
        </Card>
        <Card x-chunk="dashboard-01-chunk-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projets Terminés</CardTitle>
            <Package className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectCounts?.completedProjects ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Projets livrés
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <h2 className="text-xl font-semibold mb-4">Gestion des Projets</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Créer un Nouveau Projet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Démarrer un nouveau projet à partir de zéro.</p>
              <Link href="/addProject">
                <button className="mt-4 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                  Créer Projet
                </button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Gérer les Projets Existants</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Modifier ou supprimer des projets existants.</p>
              <Link href="/home">
                <button className="mt-4 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2">
                  Gérer Projets
                </button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboardView;
