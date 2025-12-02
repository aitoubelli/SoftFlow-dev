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
import { FileText, ArrowLeft, Edit, Save, X } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Documentation {
    _id: string;
    title: string;
    content: string;
    type: 'admin' | 'user';
    project: string;
}

export default function ProjectDocs() {
    const router = useRouter();
    const { id } = router.query;
    const [documentations, setDocumentations] = useState<Documentation[]>([]);
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { token, user, logout } = useAuth();
    const [editingDoc, setEditingDoc] = useState<Documentation | null>(null);
    const [newDocType, setNewDocType] = useState<'admin' | 'user' | null>(null);
    const [formData, setFormData] = useState({ title: '', content: '' });

    useEffect(() => {
        if (id && token) {
            fetchProject();
            fetchDocumentations();
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

    const fetchDocumentations = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/documentation/project/${id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                }
            );
            if (res.ok) {
                const data = await res.json();
                setDocumentations(data);
            }
        } catch (error) {
            console.error('Error fetching documentations:', error);
            toast.error('Erreur lors du chargement de la documentation');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDoc = (type: 'admin' | 'user') => {
        setNewDocType(type);
        setFormData({ title: '', content: '' });
        setEditingDoc(null);
    };

    const handleEditDoc = (doc: Documentation) => {
        setEditingDoc(doc);
        setFormData({ title: doc.title, content: doc.content });
        setNewDocType(null);
    };

    const handleCancel = () => {
        setEditingDoc(null);
        setNewDocType(null);
        setFormData({ title: '', content: '' });
    };

    const handleSave = async () => {
        try {
            const url = editingDoc
                ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/documentation/${editingDoc._id}`
                : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/documentation`;
            
            const method = editingDoc ? 'PUT' : 'POST';
            const body = editingDoc
                ? { title: formData.title, content: formData.content }
                : { title: formData.title, content: formData.content, projectId: id, type: newDocType };

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                toast.success('Documentation sauvegardée avec succès');
                fetchDocumentations();
                handleCancel();
            } else {
                const error = await res.json();
                toast.error(error.message || 'Erreur lors de la sauvegarde');
            }
        } catch (error) {
            console.error('Error saving documentation:', error);
            toast.error('Erreur lors de la sauvegarde');
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
        { label: 'Documentation', href: `/project/${id}/docs` }
    ];

    const hasAdminDoc = documentations.some(d => d.type === 'admin');
    const hasUserDoc = documentations.some(d => d.type === 'user');

    const isOwner = project?.owner?._id === user?.id || project?.owner === user?.id;
    const isAdmin = user?.role === 'admin';
    const canManageDocs = isAdmin || isOwner;

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
                                    <h1 className="text-3xl font-bold">Documentation</h1>
                                    <p className="text-muted-foreground">{project.name}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {canManageDocs && !hasAdminDoc && !newDocType && !editingDoc && (
                                    <Button onClick={() => handleCreateDoc('admin')}>
                                        Créer Doc Admin
                                    </Button>
                                )}
                                {canManageDocs && !hasUserDoc && !newDocType && !editingDoc && (
                                    <Button onClick={() => handleCreateDoc('user')}>
                                        Créer Doc Utilisateur
                                    </Button>
                                )}
                            </div>
                        </div>

                        {(newDocType || editingDoc) ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        {editingDoc ? 'Modifier la documentation' : `Créer une documentation ${newDocType === 'admin' ? 'Admin' : 'Utilisateur'}`}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Titre</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 border rounded-md bg-background"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Contenu (Markdown)</label>
                                        <div className="grid grid-cols-2 gap-4 h-96">
                                            <textarea
                                                className="w-full h-full p-2 border rounded-md bg-background resize-none font-mono"
                                                value={formData.content}
                                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                                placeholder="# Votre documentation ici..."
                                            />
                                            <div className="h-full p-4 border rounded-md overflow-y-auto prose dark:prose-invert max-w-none">
                                                <ReactMarkdown 
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        h1: ({node, ...props}) => <h1 className="text-3xl font-bold mt-6 mb-4" {...props} />,
                                                        h2: ({node, ...props}) => <h2 className="text-2xl font-bold mt-5 mb-3" {...props} />,
                                                        h3: ({node, ...props}) => <h3 className="text-xl font-bold mt-4 mb-2" {...props} />,
                                                        h4: ({node, ...props}) => <h4 className="text-lg font-bold mt-3 mb-2" {...props} />,
                                                        p: ({node, ...props}) => <p className="mb-4 leading-relaxed" {...props} />,
                                                        ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4" {...props} />,
                                                        ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4" {...props} />,
                                                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary pl-4 italic mb-4" {...props} />,
                                                        a: ({node, ...props}) => <a className="text-primary hover:underline" {...props} />,
                                                    }}
                                                >
                                                    {formData.content || '*Aperçu...*'}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" onClick={handleCancel}>
                                            Annuler
                                        </Button>
                                        <Button onClick={handleSave}>
                                            <Save className="h-4 w-4 mr-2" />
                                            Sauvegarder
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-6">
                                {loading ? (
                                    <p>Chargement...</p>
                                ) : documentations.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        Aucune documentation disponible.
                                    </div>
                                ) : (
                                    documentations.map((doc) => (
                                        <Card key={doc._id}>
                                            <CardHeader className="flex flex-row items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-5 w-5 text-primary" />
                                                    <CardTitle>{doc.title}</CardTitle>
                                                    <Badge variant={doc.type === 'admin' ? 'destructive' : 'default'}>
                                                        {doc.type === 'admin' ? 'Admin' : 'Utilisateur'}
                                                    </Badge>
                                                </div>
                                                {canManageDocs && (
                                                    <Button variant="ghost" size="sm" onClick={() => handleEditDoc(doc)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </CardHeader>
                                            <CardContent>
                                                <div className="prose dark:prose-invert max-w-none">
                                                    <ReactMarkdown 
                                                        remarkPlugins={[remarkGfm]}
                                                        components={{
                                                            h1: ({node, ...props}) => <h1 className="text-3xl font-bold mt-6 mb-4" {...props} />,
                                                            h2: ({node, ...props}) => <h2 className="text-2xl font-bold mt-5 mb-3" {...props} />,
                                                            h3: ({node, ...props}) => <h3 className="text-xl font-bold mt-4 mb-2" {...props} />,
                                                            h4: ({node, ...props}) => <h4 className="text-lg font-bold mt-3 mb-2" {...props} />,
                                                            p: ({node, ...props}) => <p className="mb-4 leading-relaxed" {...props} />,
                                                            ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4" {...props} />,
                                                            ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4" {...props} />,
                                                            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary pl-4 italic mb-4" {...props} />,
                                                            a: ({node, ...props}) => <a className="text-primary hover:underline" {...props} />,
                                                        }}
                                                    >
                                                        {doc.content}
                                                    </ReactMarkdown>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </main>
                <DashboardFooter isCollapsed={isCollapsed} />
            </div>
        </div>
    );
}