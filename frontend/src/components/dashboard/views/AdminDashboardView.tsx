import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, Crown, Code, ArrowUpRight } from "lucide-react";
import { RecentUsers } from "@/components/dashboard/RecentUsers";
import { UserManagementTable } from "@/components/dashboard/UserManagementTable";
import { useAuth } from '@/hooks/useAuth';

interface UserCounts {
  totalUsers: number;
  adminCount: number;
  ownerCount: number;
  devCount: number;
}

const AdminDashboardView = () => {
  const { token } = useAuth();
  const [userCounts, setUserCounts] = useState<UserCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserCounts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/counts`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: UserCounts = await response.json();
        setUserCounts(data);
      } catch (err) {
        setError('Failed to fetch user counts.');
        console.error('Error fetching user counts:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchUserCounts();
    }
  }, [token]);

  if (loading) {
    return <div className="p-4">Loading user counts...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto pb-20 lg:pb-[60px]">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Tableau de bord Administrateur</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card x-chunk="dashboard-01-chunk-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Utilisateurs Totaux
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCounts?.totalUsers ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              <ArrowUpRight className="h-3 w-3 inline" /> Tous les utilisateurs enregistrés
            </p>
          </CardContent>
        </Card>
        <Card x-chunk="dashboard-01-chunk-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Administrateurs
            </CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCounts?.adminCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Administrateurs système
            </p>
          </CardContent>
        </Card>
        <Card x-chunk="dashboard-01-chunk-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chefs de Projet</CardTitle>
            <Crown className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCounts?.ownerCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Chefs de projet
            </p>
          </CardContent>
        </Card>
        <Card x-chunk="dashboard-01-chunk-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Développeurs</CardTitle>
            <Code className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCounts?.devCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Équipe de développement
            </p>
          </CardContent>
        </Card>
      </div>

      <RecentUsers />
      <UserManagementTable />
    </div>
  );
};

export default AdminDashboardView;
