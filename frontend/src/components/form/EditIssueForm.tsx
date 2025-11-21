import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, X } from 'lucide-react';

interface EditIssueFormProps {
    projectId: string;
    issue: any;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export default function EditIssueForm({ projectId, issue, onSuccess, onCancel }: EditIssueFormProps) {
    const [title, setTitle] = useState(issue.title || '')
    const [description, setDescription] = useState(issue.description || '')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { token } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) {
            setError('Le titre de l\'issue est requis.')
            return
        }
        setError('')
        setIsSubmitting(true)

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/projects/${projectId}/issues/${issue._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim()
                })
            });

            if (!res.ok) {
                const payload = await res.json().catch(() => ({}))
                throw new Error(payload.error || 'Erreur lors de la modification de l\'issue')
            }

            const updatedIssue = await res.json();
            toast.success('Issue modifiée avec succès!');

            // Call success callback
            if (onSuccess) {
                onSuccess();
            }
        } catch (err: any) {
            console.error('Erreur modification issue:', err)
            setError(err.message || 'Erreur réseau')
            toast.error(err.message || 'Erreur lors de la modification de l\'issue');
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card className="border-0 shadow-none">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Edit className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Modifier l'issue</CardTitle>
                            <CardDescription>Mettez à jour les informations de l'issue</CardDescription>
                        </div>
                    </div>
                    {onCancel && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onCancel}
                            className="h-8 w-8"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <p className="text-sm text-destructive font-medium">{error}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="issue-title" className="text-sm font-medium">
                            Titre <span className="text-destructive">*</span>
                        </label>
                        <Input
                            id="issue-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Entrez le titre de l'issue"
                            required
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="issue-desc" className="text-sm font-medium">
                            Description
                        </label>
                        <textarea
                            id="issue-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description détaillée de l'issue"
                            rows={4}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                        {onCancel && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                className="flex-1"
                            >
                                Annuler
                            </Button>
                        )}
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-primary hover:bg-primary/90"
                        >
                            {isSubmitting ? 'Modification...' : 'Modifier l\'issue'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
