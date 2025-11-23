import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, X } from 'lucide-react';

interface EditTaskFormProps {
    projectId: string;
    task: any;
    projectMembers?: any[];
    isOwner?: boolean;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export default function EditTaskForm({ projectId, task, projectMembers = [], isOwner = false, onSuccess, onCancel }: EditTaskFormProps) {
    const [title, setTitle] = useState(task.title || '')
    const [description, setDescription] = useState(task.description || '')
    const [status, setStatus] = useState(task.status || 'todo')
    const [assignee, setAssignee] = useState(task.assignee?._id || 'unassigned')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { token } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) {
            setError('Le titre de la tâche est requis.')
            return
        }
        setError('')
        setIsSubmitting(true)

        try {
            const body: any = {
                title: title.trim(),
                description: description.trim(),
                status
            };

            // Only include assignee if owner (or admin, handled by backend check mostly, but frontend logic here)
            // The prompt said "Assignee (if owner/admin)".
            // We'll send it if the user selected something different.
            if (isOwner) {
                body.assignee = assignee === 'unassigned' ? null : assignee;
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tasks/projects/${projectId}/tasks/${task._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const payload = await res.json().catch(() => ({}))
                throw new Error(payload.error || 'Erreur lors de la modification de la tâche')
            }

            toast.success('Tâche modifiée avec succès!');

            // Call success callback
            if (onSuccess) {
                onSuccess();
            }
        } catch (err: any) {
            console.error('Erreur modification tâche:', err)
            setError(err.message || 'Erreur réseau')
            toast.error(err.message || 'Erreur lors de la modification de la tâche');
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
                            <CardTitle className="text-xl">Modifier la tâche</CardTitle>
                            <CardDescription>Mettez à jour les informations de la tâche</CardDescription>
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
                        <label htmlFor="task-title" className="text-sm font-medium">
                            Titre <span className="text-destructive">*</span>
                        </label>
                        <Input
                            id="task-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Entrez le titre de la tâche"
                            required
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="task-desc" className="text-sm font-medium">
                            Description
                        </label>
                        <textarea
                            id="task-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description détaillée de la tâche"
                            rows={4}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="task-status" className="text-sm font-medium">
                                Statut
                            </label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un statut" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todo">À faire</SelectItem>
                                    <SelectItem value="in_progress">En cours</SelectItem>
                                    <SelectItem value="done">Terminé</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {isOwner && (
                            <div className="space-y-2">
                                <label htmlFor="task-assignee" className="text-sm font-medium">
                                    Assigné à
                                </label>
                                <Select value={assignee} onValueChange={setAssignee}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Assigner à..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unassigned">Non assigné</SelectItem>
                                        {projectMembers.map((member: any) => (
                                            <SelectItem key={member.user._id} value={member.user._id}>
                                                {member.user.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
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
                            {isSubmitting ? 'Modification...' : 'Modifier la tâche'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
