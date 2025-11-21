import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, GitBranch, Bug, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface DeveloperDashboardCounts {
  assignedProjectsCount: number;
  inProgressTasksCount: number;
  reportedBugsCount: number;
  completedTasksCount: number;
}

const DeveloperDashboardView = () => {
  const { token } = useAuth();
  const [counts, setCounts] = useState<DeveloperDashboardCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeveloperCounts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tasks/counts`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: DeveloperDashboardCounts = await response.json();
        setCounts(data);
      } catch (err) {
        setError('Failed to fetch developer dashboard counts.');
        console.error('Error fetching developer dashboard counts:', err);
        toast.error('Failed to fetch developer dashboard counts.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDeveloperCounts();
    }
  }, [token]);

  if (loading) {
    return <div className="p-4">Loading developer dashboard data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto pb-20 lg:pb-[60px]">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Tableau de bord Développeur</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card x-chunk="dashboard-01-chunk-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Projets Affectés
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts?.assignedProjectsCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Projets qui vous sont assignés
            </p>
          </CardContent>
        </Card>
        <Card x-chunk="dashboard-01-chunk-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tâches en Cours
            </CardTitle>
            <GitBranch className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts?.inProgressTasksCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Tâches actives sur vos projets
            </p>
          </CardContent>
        </Card>
        <Card x-chunk="dashboard-01-chunk-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bugs Signalés</CardTitle>
            <Bug className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts?.reportedBugsCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Bugs à corriger
            </p>
          </CardContent>
        </Card>
        <Card x-chunk="dashboard-01-chunk-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tâches Terminées</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts?.completedTasksCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Tâches complétées ce mois-ci
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <h2 className="text-xl font-semibold mb-4">Mes Projets</h2>
        <Card>
          <CardHeader>
            <CardTitle>Liste des Projets Affectés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Voici la liste des projets qui vous sont actuellement affectés.
              Vous pouvez cliquer sur un projet pour voir ses détails et les tâches associées.
            </p>
            <Link href="/projects">
              <button className="mt-4 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                Voir Mes Projets
              </button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeveloperDashboardView;
