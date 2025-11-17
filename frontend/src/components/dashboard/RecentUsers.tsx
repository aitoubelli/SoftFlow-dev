import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { UserRoleBadge } from "./UserRoleBadge";
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/utils/roles';

interface User {
  _id: string;
  name: string;
  email: string;
  role: typeof ROLES.ADMIN | typeof ROLES.OWNER | typeof ROLES.DEVELOPER;
}

export function RecentUsers() {
  const { token } = useAuth();
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3001/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: User[] = await response.json();

        setRecentUsers(data.slice(-3)); // display the last 3 users
      } catch (err) {
        setError('Failed to fetch recent users.');
        console.error('Error fetching recent users:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchRecentUsers();
    }
  }, [token]);

  if (loading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Utilisateurs Récents</CardTitle>
          <p className="text-sm text-muted-foreground">
            Derniers utilisateurs enregistrés dans le système
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">Loading recent users...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Utilisateurs Récents</CardTitle>
          <p className="text-sm text-muted-foreground">
            Derniers utilisateurs enregistrés dans le système
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-8 text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Utilisateurs Récents</CardTitle>
        <p className="text-sm text-muted-foreground">
          Derniers utilisateurs enregistrés dans le système
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {recentUsers.length === 0 ? (
            <p>No recent users found.</p>
          ) : (
            recentUsers.map((user) => (
              <div key={user._id} className="flex items-center">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>{user.name ? user.name.substring(0, 2).toUpperCase() : 'UN'}</AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="ml-auto font-medium">
                  <UserRoleBadge role={user.role} />
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
