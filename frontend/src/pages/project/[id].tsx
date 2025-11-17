import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import CreateIssueForm from '@/components/form/CreateIssueForm';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardFooter } from '@/components/dashboard/DashboardFooter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, CircleUser, LayoutDashboard, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';

export default function ProjectDetails() {
    const router = useRouter();
    const { id } = router.query;
    const [project, setProject] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [selectedDevs, setSelectedDevs] = useState<string[]>([]);
    const [showCreateIssue, setShowCreateIssue] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { token, user, logout } = useAuth();

    useEffect(() => {
        if (router.isReady && id && token) {
            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/projects/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            })
                .then(res => {
                    if (!res.ok) {
                        throw new Error('Project not found');
                    }
                    return res.json();
                })
                .then(data => {
                    setProject(data);
                })
                .catch((error: Error) => console.error('Error fetching project details:', error));

            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            })
                .then(res => res.json())
                .then(data => {
                    setUsers(data);
                })
                .catch((error: Error) => console.error('Error fetching users:', error));
        }
    }, [id, token, router.isReady]);

    const handleAssignDevs = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/projects/${id}/assign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ userIds: selectedDevs }),

            });
            if (!res.ok) {
                throw new Error('Failed to assign developers');
            }
            const updatedProject = await res.json();
            setProject(updatedProject);
            setSelectedDevs([]);
            toast.success("Developer(s) assigned successfully!");

            // Refresh the page data to reflect changes
            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/projects/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            })
                .then(res => res.json())
                .then(data => {
                    setProject(data);
                })
                .catch((error: Error) => console.error('Error refreshing project details:', error));
        } catch (error: any) {
            console.error('Error assigning developers:', error);
            toast.error(error.message || "Failed to assign developer(s).");
        }
    };

    const handleUnassignDev = async (userId: string) => {
        if (!token) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/projects/${id}/unassign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ userId }),

            });
            if (!res.ok) {
                throw new Error('Failed to unassign developer');
            }
            const updatedProject = await res.json();
            setProject(updatedProject);
            toast.success("Developer unassigned successfully!");

            // Refresh the page data to reflect changes
            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/projects/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            })
                .then(res => res.json())
                .then(data => {
                    setProject(data);
                })
                .catch((error: Error) => console.error('Error refreshing project details:', error));
        } catch (error: any) {
            console.error('Error unassigning developer:', error);
            toast.error(error.message || "Failed to unassign developer.");
        }
    };

    if (!project) {
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
                                <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>Paramètres</DropdownMenuItem>
                                <DropdownMenuItem>Support</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => logout()}>Déconnexion</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </header>
                    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto pb-20 lg:pb-[60px]">
                        <div className="flex items-center justify-center min-h-[400px]">
                            <div className="text-lg">Loading...</div>
                        </div>
                    </main>
                    <DashboardFooter isCollapsed={isCollapsed} />
                </div>
            </div>
        );
    }

    const memberIds = project.members
        ? project.members.filter((member: any) => member.user).map((member: any) => member.user.id)
        : [];
    const availableUsers = Array.isArray(users) ? users.filter(u => !memberIds.includes(u.id) && u.role === 'dev') : [];
    const canAssignMembers = user?.id === project.owner?.id || user?.role === 'admin';

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
                            <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Paramètres</DropdownMenuItem>
                            <DropdownMenuItem>Support</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => logout()}>Déconnexion</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto pb-20 lg:pb-[60px]">
                    <div className="flex items-center justify-between">
                        <Breadcrumbs items={[
                            { label: "Accueil", href: "/dashboard" },
                            { label: "Mes Projets", href: "/projects" },
                            { label: project.name, href: `/project/${id}` }
                        ]} />
                        <Button variant="outline" onClick={() => router.back()} className="ml-auto">
                            Retour
                        </Button>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>{project.name}</CardTitle>
                            <CardDescription>{project.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <p className="text-sm font-medium">Propriétaire:</p>
                                    <p className="text-sm text-muted-foreground">{project.owner ? project.owner.name : 'Non assigné'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Créé le:</p>
                                    <p className="text-sm text-muted-foreground">{new Date(project.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="mt-6">
                                <h4 className="font-bold mb-3">Membres du projet:</h4>
                                {project.members && project.members.length > 0 ? (
                                    <div className="space-y-2">
                                        {project.members.map((member: any) => (
                                            member.user ? (
                                                <div key={member.user.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                    <div>
                                                        <p className="font-medium">{member.user.name}</p>
                                                        <p className="text-sm text-muted-foreground">Rôle: {member.role}</p>
                                                    </div>
                                                    {canAssignMembers && member.role === 'dev' && (
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => handleUnassignDev(member.user.id)}
                                                        >
                                                            Retirer
                                                        </Button>
                                                    )}
                                                </div>
                                            ) : null
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Aucun membre assigné</p>
                                )}
                            </div>

                            {/* Create Issue Button - Only for owner */}
                            {user?.id === project.owner?.id && (
                                <div className="mt-6">
                                    <Button onClick={() => setShowCreateIssue(true)} className="w-full">
                                        Créer une issue
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            {canAssignMembers && (
                                <div className="flex gap-2 flex-wrap">
                                    <Select onValueChange={(value: string | undefined) => setSelectedDevs(value ? [value] : [])}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Assigner un développeur" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableUsers.map(u => (
                                                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button onClick={handleAssignDevs} disabled={selectedDevs.length === 0}>
                                        Assigner
                                    </Button>
                                </div>
                            )}
                            <div className="text-sm text-muted-foreground">
                                ID: {id}
                            </div>
                        </CardFooter>
                    </Card>
                </main>
                <DashboardFooter isCollapsed={isCollapsed} />
            </div>

            {/* Create Issue Modal */}
            {showCreateIssue && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <CreateIssueForm
                            projectId={id as string}
                            onSuccess={() => {
                                setShowCreateIssue(false);
                                // Optionally refresh project data here
                            }}
                            onCancel={() => setShowCreateIssue(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
