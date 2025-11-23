import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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
import EditIssueForm from '@/components/form/EditIssueForm';
import CreateTaskForm from '@/components/form/CreateTaskForm';
import TaskList from '@/components/task/TaskList';
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
import { Bell, CircleUser, LayoutDashboard, Menu, Users, UserPlus, Calendar, FolderOpen, Plus, UserMinus, Settings, Search, CheckSquare, Square, FileText, Edit, Trash2, MoreVertical, CheckSquare as TaskIcon } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';

export default function ProjectDetails() {
    const router = useRouter();
    const { id } = router.query;
    const [project, setProject] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [issues, setIssues] = useState<any[]>([]);
    const [selectedDevs, setSelectedDevs] = useState<string[]>([]);
    const [showCreateIssue, setShowCreateIssue] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [modalSelectedDevs, setModalSelectedDevs] = useState<string[]>([]);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [issuesRefreshKey, setIssuesRefreshKey] = useState(0);
    const issuesRefreshFnRef = useRef<(() => void) | null>(null);
    const [editingIssue, setEditingIssue] = useState<any>(null);
    const [showCreateTask, setShowCreateTask] = useState(false);
    const [taskIssue, setTaskIssue] = useState<any>(null);
    const [taskRefreshKey, setTaskRefreshKey] = useState(0);
    const { token, user, logout } = useAuth();

    const fetchIssues = async () => {
        if (!id || !token) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/projects/${id}/issues`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            if (res.ok) {
                const data = await res.json();
                setIssues(data);
            }
        } catch (error) {
            console.error('Error fetching issues:', error);
        }
    };

    useEffect(() => {
        if (!token) {
            setProject(null);
            setIssues([]);
            setUsers([]);
            router.push('/auth');
            return;
        }

        if (router.isReady && id) {
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
                .then(res => {
                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }
                    return res.json();
                })
                .then(data => {
                    setUsers(data);
                })
                .catch((error: Error) => {
                    console.error('Error fetching users:', error);
                    // Set empty array to avoid breaking the UI
                    setUsers([]);
                });

            fetchIssues();
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

    const handleDeleteIssue = async (issueId: string) => {
        if (!token || !confirm('Êtes-vous sûr de vouloir supprimer cette issue ?')) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/projects/${id}/issues/${issueId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            if (res.ok) {
                toast.success('Issue supprimée avec succès!');
                fetchIssues();
            } else {
                throw new Error('Failed to delete issue');
            }
        } catch (error: any) {
            console.error('Error deleting issue:', error);
            toast.error('Erreur lors de la suppression de l\'issue');
        }
    };

    const handleUpdateIssueStatus = async (issueId: string, newStatus: string) => {
        if (!token) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/projects/${id}/issues/${issueId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                toast.success('Statut mis à jour!');
                fetchIssues();
            } else {
                throw new Error('Failed to update status');
            }
        } catch (error: any) {
            console.error('Error updating status:', error);
            toast.error('Erreur lors de la mise à jour du statut');
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
        ? project.members.filter((member: any) => member.user).map((member: any) => member.user._id)
        : [];
    const availableUsers = Array.isArray(users) ? users.filter(u => !memberIds.includes(u._id) && u.role === 'dev') : [];
    const canAssignMembers = user?.id === project.owner?._id || user?.role === 'admin' || user?.role === 'owner';


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
                <main className="flex flex-1 flex-col gap-6 p-6 lg:p-8 overflow-auto pb-20 lg:pb-[60px] bg-gradient-to-br from-background via-background to-primary/5">
                    {/* Header Section */}
                    <div className="flex items-center justify-between">
                        <Breadcrumbs items={[
                            { label: "Accueil", href: "/dashboard" },
                            { label: "Mes Projets", href: "/projects" },
                            { label: project.name, href: `/project/${id}` }
                        ]} />
                        <div className="flex gap-3">
                            {(user?.id === project.owner?._id || user?.role === 'admin') && (
                                <Button onClick={() => setShowCreateIssue(true)} className="bg-primary hover:bg-primary/90">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Créer une issue
                                </Button>
                            )}
                            <Button variant="outline" onClick={() => router.back()}>
                                Retour
                            </Button>
                        </div>
                    </div>

                    {/* Project Overview Card */}
                    <Card className="shadow-elegant border-0 bg-gradient-to-r from-card to-card/95">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-primary/10 rounded-xl">
                                    <FolderOpen className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-bold">{project.name}</CardTitle>
                                    <CardDescription className="text-base mt-1">{project.description}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 md:grid-cols-3">
                                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <CircleUser className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Propriétaire</p>
                                        <p className="font-semibold">{project.owner ? project.owner.name : 'Non assigné'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Calendar className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Créé le</p>
                                        <p className="font-semibold">{new Date(project.createdAt).toLocaleDateString('fr-FR')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Users className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Membres</p>
                                        <p className="font-semibold">{project.members?.length || 0} développeur(s)</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Team Management Section */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Current Team Members */}
                        <Card className="shadow-card">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <Users className="h-5 w-5 text-primary" />
                                        </div>
                                        <CardTitle>Équipe actuelle</CardTitle>
                                    </div>
                                    {canAssignMembers && (
                                        <Button
                                            onClick={() => setShowAssignModal(true)}
                                            className="bg-primary hover:bg-primary/90"
                                            size="sm"
                                        >
                                            <UserPlus className="h-4 w-4 mr-2" />
                                            Ajouter
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {project.members && project.members.length > 0 ? (
                                    <div className="space-y-3">
                                        {project.members.map((member: any) => (
                                            member.user ? (
                                                <div key={member.user._id} className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-muted/30 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                                            <CircleUser className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{member.user.name}</p>
                                                            <Badge variant="secondary" className="text-xs">
                                                                {member.role}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    {canAssignMembers && member.role === 'dev' && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleUnassignDev(member.user._id)}
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        >
                                                            <UserMinus className="h-4 w-4 mr-2" />
                                                            Retirer
                                                        </Button>
                                                    )}
                                                </div>
                                            ) : null
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground">Aucun membre assigné</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Commencez par ajouter des développeurs à votre projet
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Project Actions */}
                        <Card className="shadow-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <Settings className="h-5 w-5 text-primary" />
                                    Actions du projet
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {(user?.id === project.owner?._id || user?.role === 'admin') && (
                                    <Button
                                        onClick={() => setShowCreateIssue(true)}
                                        className="w-full justify-start bg-primary hover:bg-primary/90"
                                    >
                                        <Plus className="h-4 w-4 mr-3" />
                                        Créer une nouvelle issue
                                    </Button>
                                )}

                                <div className="pt-4 border-t">
                                    <p className="text-sm text-muted-foreground mb-2">Informations</p>
                                    <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                                        <strong>ID du projet:</strong> {id}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="shadow-card">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <FileText className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle>Issues du projet</CardTitle>
                                        <CardDescription>
                                            Gérez les user stories et tâches de ce projet
                                        </CardDescription>
                                    </div>
                                </div>
                                <Badge variant="secondary" className="text-sm">
                                    {issues.length} issue{issues.length !== 1 ? 's' : ''}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {issues.length > 0 ? (
                                <div className="space-y-3">
                                    {issues.map((issue: any) => (
                                        <div key={issue._id} className="p-4 border border-border/50 rounded-lg hover:bg-muted/30 transition-colors">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h4 className="font-semibold text-base truncate">{issue.title}</h4>
                                                        <Badge
                                                            variant={issue.status === 'open' ? 'default' : 'secondary'}
                                                            className="shrink-0"
                                                        >
                                                            {issue.status === 'open' ? 'Ouvert' : 'Fermé'}
                                                        </Badge>
                                                    </div>
                                                    {issue.description && (
                                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                                            {issue.description}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-muted-foreground">
                                                        Créé le {new Date(issue.createdAt).toLocaleDateString('fr-FR')}
                                                    </p>

                                                    {/* Task List Component */}
                                                    <TaskList
                                                        projectId={id as string}
                                                        issueId={issue._id}
                                                        issueTitle={issue.title}
                                                        refreshTrigger={taskRefreshKey}
                                                    />
                                                    <p className="text-xs text-muted-foreground">
                                                        Créé le {new Date(issue.createdAt).toLocaleDateString('fr-FR')}
                                                    </p>
                                                </div>
                                                {(user?.id === project.owner?._id || user?.role === 'admin') && (
                                                    <div className="flex items-center gap-2">
                                                        <Select
                                                            value={issue.status}
                                                            onValueChange={(value) => handleUpdateIssueStatus(issue._id, value)}
                                                        >
                                                            <SelectTrigger className="w-[120px] h-9">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="open">Ouvert</SelectItem>
                                                                <SelectItem value="closed">Fermé</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-9 w-9">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        setTaskIssue(issue);
                                                                        setShowCreateTask(true);
                                                                    }}
                                                                    className={`cursor-pointer ${issue.status === 'closed' ? 'opacity-50 pointer-events-none' : ''}`}
                                                                    disabled={issue.status === 'closed'}
                                                                >
                                                                    <TaskIcon className="h-4 w-4 mr-2" />
                                                                    {issue.status === 'closed' ? 'Créer une tâche (Issue fermée)' : 'Créer une tâche'}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={() => setEditingIssue(issue)}
                                                                    className="cursor-pointer"
                                                                >
                                                                    <Edit className="h-4 w-4 mr-2" />
                                                                    Modifier
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={() => handleDeleteIssue(issue._id)}
                                                                    className="cursor-pointer text-destructive focus:text-destructive"
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                    Supprimer
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="p-4 bg-muted/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                        <FileText className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <p className="text-muted-foreground font-medium mb-1">Aucune issue pour le moment</p>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Commencez par créer votre première issue pour ce projet
                                    </p>
                                    {(user?.id === project.owner?._id || user?.role === 'admin') && (
                                        <Button
                                            onClick={() => setShowCreateIssue(true)}
                                            className="bg-primary hover:bg-primary/90"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Créer une issue
                                        </Button>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </main>
                <DashboardFooter isCollapsed={isCollapsed} />
            </div>

            {/* Create Issue Modal */}
            {showCreateIssue && project && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-xl shadow-elegant border max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <CreateIssueForm
                            projectId={project._id}
                            onSuccess={() => {
                                setShowCreateIssue(false);
                                setIssuesRefreshKey(prev => prev + 1);
                                fetchIssues();
                            }}
                            onCancel={() => setShowCreateIssue(false)}
                        />
                    </div>
                </div>
            )}

            {/* Create Task Modal */}
            {showCreateTask && taskIssue && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-xl shadow-elegant border max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <CreateTaskForm
                            projectId={id as string}
                            issueId={taskIssue._id}
                            issueTitle={taskIssue.title}
                            issueStatus={taskIssue.status}
                            onSuccess={() => {
                                setShowCreateTask(false);
                                setTaskIssue(null);
                                setTaskRefreshKey(prev => prev + 1);
                            }}
                            onCancel={() => {
                                setShowCreateTask(false);
                                setTaskIssue(null);
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Assign Developers Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-xl shadow-elegant border max-w-lg w-full max-h-[90vh] overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <UserPlus className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">Assigner des développeurs</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Sélectionnez les développeurs à ajouter au projet
                                    </p>
                                </div>
                            </div>

                            {/* Search Bar */}
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Rechercher un développeur..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>

                            {/* Select All/Unselect All */}
                            {availableUsers.length > 0 && (
                                <div className="flex gap-2 mb-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setModalSelectedDevs(availableUsers.map(u => u._id))}
                                        className="flex items-center gap-2"
                                    >
                                        <CheckSquare className="h-4 w-4" />
                                        Tout sélectionner
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setModalSelectedDevs([])}
                                        className="flex items-center gap-2"
                                    >
                                        <Square className="h-4 w-4" />
                                        Tout désélectionner
                                    </Button>
                                </div>
                            )}

                            {/* Developers List */}
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {(() => {
                                    const filteredUsers = availableUsers.filter(user =>
                                        user.name.toLowerCase().includes(searchQuery.toLowerCase())
                                    );

                                    return filteredUsers.length > 0 ? (
                                        filteredUsers.map(user => (
                                            <div key={user._id} className="flex items-center space-x-3 p-3 border border-border/50 rounded-lg hover:bg-muted/30 transition-colors">
                                                <Checkbox
                                                    id={`user-${user._id}`}
                                                    checked={modalSelectedDevs.includes(user._id)}
                                                    onCheckedChange={(checked: boolean) => {
                                                        setModalSelectedDevs(prev => {
                                                            if (checked === true) {
                                                                // Add user if not already selected
                                                                if (!prev.includes(user._id)) {
                                                                    return [...prev, user._id];
                                                                }
                                                                return prev;
                                                            } else {
                                                                // Remove user
                                                                return prev.filter(id => id !== user._id);
                                                            }
                                                        });
                                                    }}
                                                />
                                                <label
                                                    htmlFor={`user-${user._id}`}
                                                    className="flex items-center gap-3 flex-1 cursor-pointer"
                                                >
                                                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                                        <CircleUser className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm">{user.name}</p>
                                                        <Badge variant="outline" className="text-xs">
                                                            {user.role}
                                                        </Badge>
                                                    </div>
                                                </label>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8">
                                            <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                            <p className="text-sm text-muted-foreground">
                                                {searchQuery ? 'Aucun développeur trouvé' : 'Aucun développeur disponible'}
                                            </p>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Selected Count */}
                            {modalSelectedDevs.length > 0 && (
                                <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                                    <p className="text-sm text-primary font-medium">
                                        {modalSelectedDevs.length} développeur(s) sélectionné(s)
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3 mt-6 pt-4 border-t">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowAssignModal(false);
                                        setModalSelectedDevs([]);
                                        setSearchQuery('');
                                    }}
                                    className="flex-1"
                                >
                                    Annuler
                                </Button>
                                <Button
                                    onClick={async () => {
                                        // Directly assign using modalSelectedDevs
                                        if (!token || modalSelectedDevs.length === 0) return;

                                        try {
                                            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/projects/${id}/assign`, {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    'Authorization': `Bearer ${token}`,
                                                },
                                                body: JSON.stringify({ userIds: modalSelectedDevs }),
                                            });

                                            if (!res.ok) {
                                                throw new Error('Failed to assign developers');
                                            }

                                            const updatedProject = await res.json();
                                            setProject(updatedProject);
                                            setShowAssignModal(false);
                                            setModalSelectedDevs([]);
                                            setSearchQuery('');
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
                                    }}
                                    disabled={modalSelectedDevs.length === 0}
                                    className="flex-1 bg-primary hover:bg-primary/90"
                                >
                                    Assigner ({modalSelectedDevs.length})
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Issue Modal */}
            {editingIssue && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-xl shadow-elegant border max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <EditIssueForm
                            projectId={id as string}
                            issue={editingIssue}
                            onSuccess={() => {
                                setEditingIssue(null);
                                fetchIssues();
                            }}
                            onCancel={() => setEditingIssue(null)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
