import React, { useState } from 'react'
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderOpen, X } from 'lucide-react';

interface ProjectFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

export default function ProjectForm({ onSuccess, onCancel }: ProjectFormProps) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { user, token } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) {
            setError('Le nom du projet est requis.')
            return
        }
        setError('')
        setIsSubmitting(true)

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim(),
                    owner: user?.id
                })
            });

            if (!res.ok) {
                const payload = await res.json().catch(() => ({}))
                throw new Error(payload.error || 'Erreur lors de la création du projet')
            }

            const createdProject = await res.json();
            toast.success('Projet créé avec succès!');

            // Reset form
            setName('')
            setDescription('')
            setError('')

            // Call success callback or redirect
            if (onSuccess) {
                onSuccess();
            } else {
                router.push('/projects');
            }
        } catch (err: any) {
            console.error('Erreur création projet:', err)
            setError(err.message || 'Erreur réseau')
            toast.error(err.message || 'Erreur lors de la création du projet');
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
                            <FolderOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Créer un nouveau projet</CardTitle>
                            <CardDescription>Définissez les paramètres de votre nouveau projet</CardDescription>
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
                        <label htmlFor="project-name" className="text-sm font-medium">
                            Nom du projet <span className="text-destructive">*</span>
                        </label>
                        <Input
                            id="project-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Entrez le nom du projet"
                            required
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="project-desc" className="text-sm font-medium">
                            Description
                        </label>
                        <textarea
                            id="project-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description du projet"
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
                            {isSubmitting ? 'Création...' : 'Créer le projet'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
