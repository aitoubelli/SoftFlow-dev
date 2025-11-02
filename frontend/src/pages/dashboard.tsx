"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
}

const Dashboard = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    if (user) {
      setCurrentUser(JSON.parse(user));
    } else {
      router.push("/auth");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    router.push("/auth");
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center bg-gradient-hero bg-clip-text text-transparent">
            Welcome, {currentUser.name || currentUser.email}!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-lg">You are logged in as a {currentUser.role}.</p>
          <Button onClick={handleLogout} className="mt-4" variant="destructive">
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
