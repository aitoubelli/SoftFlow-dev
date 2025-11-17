import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Plus, X, Lock } from 'lucide-react';

interface CreateTaskFormProps {
    projectId: string;
    issueId: string;
    issueTitle: string;
    issueStatus: string;
    onSuccess: () => void;
    onCancel: () => void;
    onTaskCreated?: () => void;
}

export default function CreateTaskForm({ projectId, issueId, issueTitle, issueStatus, onSuccess, onCancel, onTaskCreated }: CreateTaskFormProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { token } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Check if issue is closed before proceeding
        if (issueStatus === 'closed') {
            toast.error('Impossible de créer une tâche pour une issue fermée');
            return;
        }

        if (!title.trim()) {
            toast.error('Le titre de la tâche est requis');
            return;
        }

        if (!token) {
            toast.error('Token d\'authentification manquant');
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tasks/projects/${projectId}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    issueId,
                    title: title.trim(),
                    description: description.trim()
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Erreur lors de la création de la tâche');
            }

            const task = await res.json();
            toast.success('Tâche créée avec succès!');

            // Reset form
            setTitle('');
            setDescription('');

            // Call success callback
            onSuccess();

            // Call task created callback if provided
            if (onTaskCreated) {
                onTaskCreated();
            }

        } catch (error: any) {
            console.error('Error creating task:', error);
            toast.error(error.message || 'Erreur lors de la création de la tâche');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setDescription(e.target.value);
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
    };

    // Check if issue is closed
    const isIssueClosed = issueStatus === 'closed';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isIssueClosed ? 'bg-muted' : 'bg-primary/10'}`}>
                        {isIssueClosed ? (
                            <Lock className="h-5 w-5 text-muted-foreground" />
                        ) : (
                            <Plus className="h-5 w-5 text-primary" />
                        )}
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">
                            {isIssueClosed ? 'Tâche impossible à créer' : 'Créer une nouvelle tâche'}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Issue: {issueTitle}
                            {isIssueClosed && (
                                <span className="text-destructive font-medium ml-2">
                                    (Issue fermée)
                                </span>
                            )}
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onCancel}
                    className="shrink-0"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {isIssueClosed ? (
                    <div className="p-4 bg-muted/50 border border-muted rounded-lg">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Lock className="h-4 w-4" />
                            <p className="text-sm">
                                Impossible de créer une tâche pour une issue fermée. Veuillez d'abord rouvrir l'issue.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2">
                            <label htmlFor="title" className="text-sm font-medium">
                                Titre de la tâche *
                            </label>
                            <Input
                                id="title"
                                type="text"
                                placeholder="Titre de la tâche..."
                                value={title}
                                onChange={handleTitleChange}
                                required
                                disabled={isSubmitting}
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="description" className="text-sm font-medium">
                                Description
                            </label>
                            <textarea
                                id="description"
                                placeholder="Description détaillée de la tâche..."
                                value={description}
                                onChange={handleDescriptionChange}
                                rows={4}
                                disabled={isSubmitting}
                                className="w-full min-h-[100px] px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none rounded-md"
                            />
                        </div>
                    </>
                )}

                <div className="flex gap-3 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="flex-1"
                    >
                        Annuler
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting || !title.trim() || isIssueClosed}
                        className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                Création...
                            </div>
                        ) : isIssueClosed ? (
                            <div className="flex items-center gap-2">
                                <Lock className="h-4 w-4" />
                                Issue fermée
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Créer la tâche
                            </div>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
