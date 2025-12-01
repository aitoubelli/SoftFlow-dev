"use client";

import { Badge } from "@/components/ui/badge";
import { Shield, Crown, Code } from "lucide-react";
import { ROLES } from '@/utils/roles';

interface UserRoleBadgeProps {
  role: typeof ROLES.ADMIN | typeof ROLES.OWNER | typeof ROLES.DEVELOPER;
}

export function UserRoleBadge({ role }: UserRoleBadgeProps) {
  const getRoleIcon = (userRole: string) => {
    switch (userRole) {
      case 'admin':
        return <Shield data-testid="shield-icon" className="h-4 w-4 text-red-500" />;
      case 'owner':
        return <Crown data-testid="crown-icon" className="h-4 w-4 text-blue-600" />;
      case 'dev':
        return <Code data-testid="code-icon" className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getBadgeVariant = (userRole: string) => {
    switch (userRole) {
      case 'admin':
        return 'destructive';
      case 'owner':
        return 'default';
      case 'dev':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getBadgeClassName = (userRole: string) => {
    if (userRole === 'owner') {
      return 'bg-blue-600 text-white hover:bg-blue-500';
    }
    if (userRole === 'admin') {
      return 'text-white';
    }
    return '';
  };

  return (
    <div className="flex items-center gap-1 justify-center">
      {getRoleIcon(role)}
      <Badge
        variant={getBadgeVariant(role)}
        className={getBadgeClassName(role)}
      >
        {role}
      </Badge>
    </div>
  );
}
