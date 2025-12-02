import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { FileCheck, X } from 'lucide-react';

interface CreateTestCaseFormProps {
    projectId: string;
    taskId?: string;
    taskTitle?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function CreateTestCaseForm({
    projectId,
    taskId,
    taskTitle,
    onSuccess,
    onCancel
}: CreateTestCaseFormProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [release, setRelease] = useState('');
    const [loading, setLoading] = useState(false);
    const { token } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error('Le nom est requis');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/testcases/projects/${projectId}/testcases`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: name.trim(),
                        description: description.trim(),
                        taskId: taskId || undefined,
                        release: release.trim() || undefined
                    })
                }
            );

            if (res.ok) {
                toast.success('Fiche de test créée avec succès');
                onSuccess();
            } else {
                const error = await res.json();
                toast.error(error.message || 'Erreur lors de la création de la fiche de test');
            }
        } catch (error) {
            console.error('Error creating test case:', error);
            toast.error('Erreur lors de la création de la fiche de test');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <FileCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Créer une fiche de test</h3>
                        {taskTitle && (
                            <p className="text-sm text-muted-foreground">
                                Pour la tâche: {taskTitle}
                            </p>
                        )}
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onCancel}
                    className="h-8 w-8"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                        Nom <span className="text-destructive">*</span>
                    </label>
                    <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nom de la fiche de test"
                        required
                        disabled={loading}
                    />
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium mb-2">
                        Description
                    </label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description de la fiche de test"
                        disabled={loading}
                        rows={4}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    />
                </div>

                <div>
                    <label htmlFor="release" className="block text-sm font-medium mb-2">
                        Release
                    </label>
                    <Input
                        id="release"
                        type="text"
                        value={release}
                        onChange={(e) => setRelease(e.target.value)}
                        placeholder="Version ou release (optionnel)"
                        disabled={loading}
                    />
                </div>

                <div className="flex gap-3 pt-4">
                    <Button
                        type="submit"
                        disabled={loading}
                        className="flex-1"
                    >
                        {loading ? 'Création...' : 'Créer'}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1"
                    >
                        Annuler
                    </Button>
                </div>
            </form>
        </div>
    );
}
