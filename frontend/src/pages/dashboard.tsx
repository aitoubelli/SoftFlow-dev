"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { RecentUsers } from "@/components/dashboard/RecentUsers";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { NavigationHeader } from "@/components/dashboard/NavigationHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, CircleUser, Users, Shield, Crown, Code, ArrowUpRight, LayoutDashboard, PanelLeftClose, PanelRightOpen, Home, Settings, Menu } from "lucide-react";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";
import AdminDashboardView from "@/components/dashboard/views/AdminDashboardView";
import OwnerDashboardView from "@/components/dashboard/views/OwnerDashboardView";
import DeveloperDashboardView from "@/components/dashboard/views/DeveloperDashboardView";
import { ROLES } from "@/utils/roles";

const Dashboard = () => {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const router = useRouter();
  const isMobile = useIsMobile();

  const [isCollapsed, setIsCollapsed] = useState(false);

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
        <NavigationHeader
          isMobile={isMobile}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          user={user}
          logout={logout}
        />
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
