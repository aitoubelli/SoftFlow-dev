import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { NavigationHeader } from '@/components/dashboard/NavigationHeader';
import { DashboardFooter } from '@/components/dashboard/DashboardFooter';
import { FileCheck, ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';

interface TestCase {
    _id: string;
    name: string;
    description: string;
    status: 'pending' | 'passed' | 'failed';
    task?: {
        _id: string;
        title: string;
    };
    release?: string;
    createdBy: {
        _id: string;
        name: string;
    };
    createdAt: string;
}

export default function ProjectTestCases() {
    const router = useRouter();
    const { id } = router.query;
    const [testCases, setTestCases] = useState<TestCase[]>([]);
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { token, user, logout } = useAuth();

    useEffect(() => {
        if (id && token) {
            fetchProject();
            fetchTestCases();
        }
    }, [id, token]);

    const fetchProject = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/projects/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            if (res.ok) {
                const data = await res.json();
                setProject(data);
            }
        } catch (error) {
            console.error('Error fetching project:', error);
        }
    };

    const fetchTestCases = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/testcases/projects/${id}/testcases`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                }
            );
            if (res.ok) {
                const data = await res.json();
                setTestCases(data);
            }
        } catch (error) {
            console.error('Error fetching test cases:', error);
            toast.error('Erreur lors du chargement des fiches de test');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'passed':
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'failed':
                return <XCircle className="h-5 w-5 text-red-600" />;
            default:
                return <Clock className="h-5 w-5 text-yellow-600" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'passed':
                return <Badge className="bg-green-600">Réussi</Badge>;
            case 'failed':
                return <Badge className="bg-red-600">Échoué</Badge>;
            default:
                return <Badge className="bg-yellow-600">En attente</Badge>;
        }
    };

    if (!token) {
        if (typeof window !== 'undefined') {
            router.push('/auth');
        }
        return null;
    }

    if (!project) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>Chargement...</p>
            </div>
        );
    }

    const breadcrumbs = [
        { label: 'Projets', href: '/projects' },
        { label: project.name, href: `/project/${id}` },
        { label: 'Fiches de test', href: `/project/${id}/testcases` }
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                <NavigationHeader
                    isMobile={false}
                    isCollapsed={isCollapsed}
                    setIsCollapsed={setIsCollapsed}
                    user={user}
                    logout={logout}
                />
                <main className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <Breadcrumbs items={breadcrumbs} />

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push(`/project/${id}`)}
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Retour
                                </Button>
                                <div>
                                    <h1 className="text-3xl font-bold">Fiches de test</h1>
                                    <p className="text-muted-foreground">{project.name}</p>
                                </div>
                            </div>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <FileCheck className="h-6 w-6 text-primary" />
                                        Toutes les fiches de test
                                    </div>
                                    <Badge variant="secondary">{testCases.length} fiche{testCases.length !== 1 ? 's' : ''}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="text-center py-12">
                                        <p className="text-muted-foreground">Chargement...</p>
                                    </div>
                                ) : testCases.length > 0 ? (
                                    <div className="space-y-3">
                                        {testCases.map((testCase) => (
                                            <div
                                                key={testCase._id}
                                                className="p-4 border border-border/50 rounded-lg hover:bg-muted/30 transition-colors"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            {getStatusIcon(testCase.status)}
                                                            <h3 className="font-semibold text-lg">{testCase.name}</h3>
                                                            {getStatusBadge(testCase.status)}
                                                        </div>
                                                        {testCase.description && (
                                                            <p className="text-sm text-muted-foreground mb-3">
                                                                {testCase.description}
                                                            </p>
                                                        )}
                                                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                                            {testCase.task && (
                                                                <div className="flex items-center gap-1">
                                                                    <span className="font-medium">Tâche:</span>
                                                                    <span>{testCase.task.title}</span>
                                                                </div>
                                                            )}
                                                            {testCase.release && (
                                                                <div className="flex items-center gap-1">
                                                                    <span className="font-medium">Release:</span>
                                                                    <span>{testCase.release}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-medium">Créé par:</span>
                                                                <span>{testCase.createdBy.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-medium">Créé le:</span>
                                                                <span>{new Date(testCase.createdAt).toLocaleDateString('fr-FR')}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground font-medium mb-1">Aucune fiche de test</p>
                                        <p className="text-sm text-muted-foreground">
                                            Créez une fiche de test depuis une tâche
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </main>
                <DashboardFooter isCollapsed={isCollapsed} />
            </div>
        </div>
    );
}
