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
import { Bell, CircleUser, LayoutDashboard, Menu, Users as UsersIcon } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserRoleBadge } from "@/components/dashboard/UserRoleBadge";

// Placeholder for toast function - replace with actual toast implementation (e.g., from useToast hook)
const toast = ({ title, description, variant }: { title: string; description: string; variant?: string }) => {
  console.log("Toast:", title, description, variant);
};

interface User {
  name: string;
  email: string;
  role: "admin" | "owner" | "dev";
}

export default function Users() {
  const { user: currentUser, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [users, setUsers] = useState<User[]>([
    { name: "Admin User", email: "admin@example.com", role: "admin" },
    { name: "Project Owner", email: "owner@example.com", role: "owner" },
    { name: "Developer One", email: "dev1@example.com", role: "dev" },
    { name: "Developer Two", email: "dev2@example.com", role: "dev" },
  ]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth");
    }
  }, [isAuthenticated, router]);

  const updateUserRole = (email: string, newRole: "admin" | "owner" | "dev") => {
    // Prevent admin from downgrading themselves
    if (currentUser && currentUser.email === email && currentUser.role === "admin" && newRole !== "admin") {
      toast({
        title: "Error",
        description: "You cannot downgrade your own admin role",
        variant: "destructive",
      });
      return;
    }

    setUsers((prevUsers) =>
      prevUsers.map((u) => (u.email === email ? { ...u, role: newRole } : u))
    );

    // In a real application, you would update the backend here.
    // For now, we're just updating local state.

    toast({
      title: "Success",
      description: `User role updated to ${newRole}`,
    });
  };

  // Removed getRoleBadgeVariant as UserRoleBadge will handle it

  if (!currentUser) {
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
                <span className="sr-only">Toggle navigation menu</span>
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
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto pb-20 lg:pb-[60px]">
          <div className="flex items-center justify-between">
            <Breadcrumbs items={[{ label: "Home", href: "/home" }, { label: "User Management", href: "/users" }]} />
          </div>
          <h1 className="font-semibold text-lg md:text-2xl">User Management</h1>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5 text-primary" />
                <CardTitle>User Management</CardTitle>
              </div>
              <CardDescription>Manage user roles and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.email}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <UserRoleBadge role={user.role} />
                      </TableCell>
                      <TableCell>
                        {currentUser && currentUser.email === user.email && currentUser.role === "admin" ? (
                          <Badge variant="outline" className="w-32 justify-center">
                            Cannot modify own role
                          </Badge>
                        ) : (
                          <Select
                            value={user.role}
                            onValueChange={(value: "admin" | "owner" | "dev") =>
                              updateUserRole(user.email, value)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="owner">Owner</SelectItem>
                              <SelectItem value="dev">Developer</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
        <DashboardFooter isCollapsed={isCollapsed} />
      </div>
    </div>
  );
}
