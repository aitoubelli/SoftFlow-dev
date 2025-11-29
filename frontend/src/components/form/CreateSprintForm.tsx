import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Rocket, X, Calendar, CheckSquare } from 'lucide-react';

interface CreateSprintFormProps {
    projectId: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

interface Task {
    _id: string;
    title: string;
    status: string;
    priority?: string;
}

export default function CreateSprintForm({ projectId, onSuccess, onCancel }: CreateSprintFormProps) {
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { token } = useAuth();

    useEffect(() => {
        const fetchTasks = async () => {
            if (!projectId || !token) return;
            setLoadingTasks(true);
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tasks/projects/${projectId}/tasks`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (res.ok) {
                    const data = await res.json();
                    // Filter only TODO tasks
                    const todoTasks = data.filter((task: Task) => task.status === 'todo');
                    setTasks(todoTasks);
                } else {
                    console.error('Failed to fetch tasks');
                    toast.error('Impossible de charger les tâches');
                }
            } catch (err) {
                console.error('Error fetching tasks:', err);
                toast.error('Erreur lors du chargement des tâches');
            } finally {
                setLoadingTasks(false);
            }
        };

        fetchTasks();
    }, [projectId, token]);

    const handleTaskToggle = (taskId: string) => {
        setSelectedTaskIds(prev => {
            if (prev.includes(taskId)) {
                return prev.filter(id => id !== taskId);
            } else {
                return [...prev, taskId];
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        if (!name.trim() || !startDate || !endDate) {
            setError('Veuillez remplir tous les champs obligatoires.');
            setIsSubmitting(false);
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            setError('La date de fin doit être après la date de début.');
            setIsSubmitting(false);
            return;
        }
        
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/projects/${projectId}/sprints`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: name.trim(),
                    startDate,
                    endDate,
                    taskIds: selectedTaskIds
                }),
            });

            if (res.ok) {
                toast.success('Sprint créé avec succès !');
                setName('');
                setStartDate('');
                setEndDate('');
                setSelectedTaskIds([]);
                if (onSuccess) onSuccess();
            } else {
                const payload = await res.json().catch(() => ({}))
                setError(payload.error || 'Erreur lors de la création du sprint.');
                toast.error(payload.error || 'Erreur lors de la création du sprint.');
            }
        } catch (error: any) {
            console.error('Error creating sprint:', error);
            setError(error.message || 'Erreur serveur lors de la création du sprint.');
            toast.error(error.message || 'Erreur lors de la création du sprint');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="border-0 shadow-none">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Rocket className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Créer un nouveau sprint</CardTitle>
                            <CardDescription>Planifiez votre prochain cycle de développement</CardDescription>
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
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <p className="text-sm text-destructive font-medium">{error}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="sprint-name" className="text-sm font-medium">
                                Nom du sprint <span className="text-destructive">*</span>
                            </label>
                            <Input
                                id="sprint-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: Sprint 1"
                                required
                                className="w-full"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="startDate" className="text-sm font-medium">
                                Date de début
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="endDate" className="text-sm font-medium">
                                Date de fin
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="pl-10"
                                    min={startDate}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <CheckSquare className="h-4 w-4" />
                                Sélectionner les tâches à embarquer
                            </label>
                            <Badge variant="secondary" className="text-xs">
                                {selectedTaskIds.length} sélectionnée(s)
                            </Badge>
                        </div>
                        
                        <div className="border rounded-lg p-1 bg-muted/20 max-h-[200px] overflow-y-auto">
                            {loadingTasks ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                </div>
                            ) : tasks.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p className="text-sm">Aucune tâche "À faire" disponible.</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {tasks.map(task => (
                                        <div 
                                            key={task._id} 
                                            className={`flex items-start gap-3 p-3 rounded-md transition-colors cursor-pointer ${
                                                selectedTaskIds.includes(task._id) 
                                                    ? 'bg-primary/5 border-primary/20' 
                                                    : 'hover:bg-muted/50'
                                            }`}
                                            onClick={() => handleTaskToggle(task._id)}
                                        >
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <Checkbox 
                                                    id={`task-${task._id}`}
                                                    checked={selectedTaskIds.includes(task._id)}
                                                    onCheckedChange={() => handleTaskToggle(task._id)}
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <label 
                                                    htmlFor={`task-${task._id}`}
                                                    className="text-sm font-medium cursor-pointer block truncate"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {task.title}
                                                </label>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">
                                                        {task.status === 'todo' ? 'À faire' : task.status}
                                                    </Badge>
                                                    {task.priority && (
                                                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                                                            {task.priority}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Seules les tâches avec le statut "À faire" sont affichées.
                        </p>
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
                            {isSubmitting ? 'Création...' : 'Créer le sprint'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
