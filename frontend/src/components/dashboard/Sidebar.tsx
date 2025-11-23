"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  Settings,
  Code,
  PanelLeftClose,
  PanelRightOpen,
  Users,
} from "lucide-react";
import { UserRoleBadge } from "./UserRoleBadge";
import Dashboard from '../../pages/dashboard';
import { hasPermission, ROLES, PERMISSIONS } from "@/utils/roles";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/auth");
  };

  if (!user) {
    return null;
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`hidden border-r bg-background md:block fixed inset-y-0 z-50 transition-all duration-300 ${isCollapsed ? 'w-[60px]' : 'w-[220px] lg:w-[280px]'}`}>
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 justify-center">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <PanelRightOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          </div>
          {/* User Avatar Section */}
          <div className={`flex flex-col items-center gap-2 p-4 ${isCollapsed ? 'hidden' : ''}`}>
            <Avatar className="h-16 w-16">
              <AvatarImage src="/avatar-placeholder.jpg" alt="Avatar" />
              <AvatarFallback>{user.name ? user.name.charAt(0) : 'A'}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="font-semibold">{user.name || 'Admin User'}</p>
              <UserRoleBadge role={user.role} />
            </div>
          </div>
          <div className="flex-1">
            <nav className="grid items-start text-sm font-medium">
              <Link
                href="/dashboard"
                className={`flex items-center gap-3 rounded-lg ${isCollapsed ? 'px-3' : 'px-6'} py-3 text-primary bg-primary/10 border-b border-border/50 transition-all hover:bg-muted/50 hover:text-primary ${isCollapsed ? 'justify-center' : ''}`}
              >
              <Home className="h-4 w-4" />
              {!isCollapsed && "Accueil Dashboard"}
            </Link>
            <Link
              href="#"
              className={`flex items-center gap-3 rounded-lg ${isCollapsed ? 'px-3' : 'px-6'} py-3 text-muted-foreground border-b border-border/50 transition-all hover:bg-muted/50 hover:text-primary ${isCollapsed ? 'justify-center' : ''}`}
            >
              <Settings className="h-4 w-4" />
              {!isCollapsed && "Mon Profil"}
            </Link>
            {hasPermission(user.role, PERMISSIONS.CAN_MANAGE_PROJECTS) && (
              <Link
                href="/addProject"
                className={`flex items-center gap-3 rounded-lg ${isCollapsed ? 'px-3' : 'px-6'} py-3 text-muted-foreground border-b border-border/50 transition-all hover:bg-muted/50 hover:text-primary ${isCollapsed ? 'justify-center' : ''}`}
              >
                <Code className="h-4 w-4" />
                {!isCollapsed && "Créer un Projet"}
              </Link>
            )}
            {hasPermission(user.role, PERMISSIONS.CAN_VIEW_ASSIGNED_PROJECTS) && (
              <Link
                href="/projects"
                className={`flex items-center gap-3 rounded-lg ${isCollapsed ? 'px-3' : 'px-6'} py-3 text-muted-foreground border-b border-border/50 transition-all hover:bg-muted/50 hover:text-primary ${isCollapsed ? 'justify-center' : ''}`}
              >
                <Code className="h-4 w-4" />
                {!isCollapsed && "Mes Projets"}
              </Link>
            )}
            {hasPermission(user.role, PERMISSIONS.CAN_MANAGE_USERS) && (
              <Link
                href="/users"
                className={`flex items-center gap-3 rounded-lg ${isCollapsed ? 'px-3' : 'px-6'} py-3 text-muted-foreground transition-all hover:bg-muted/50 hover:text-primary ${isCollapsed ? 'justify-center' : ''}`}
              >
                <Users className="h-4 w-4" />
                {!isCollapsed && "Gestion des Utilisateurs"}
              </Link>
            )}
          </nav>
          </div>
          <div className="mt-auto p-4">
            {/* Logout button removed as per user request */}
          </div>
        </div>
      </div>

    </>
  );
}
