import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
    CheckSquare,
    Circle,
    Clock,
    User,
    MoreVertical,
    Edit,
    Trash2,
    Plus,
    ChevronDown,
    ChevronRight
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import EditTaskForm from '@/components/form/EditTaskForm';

interface Task {
    _id: string;
    title: string;
    description: string;
    status: 'todo' | 'in_progress' | 'done';
    assignee?: {
        _id: string;
        name: string;
        email: string;
    } | null;
    createdAt: string;
    updatedAt: string;
}

interface TaskListProps {
    projectId: string;
    issueId: string;
    issueTitle: string;
    projectMembers?: any[];
    isOwner?: boolean;
}

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'done':
            return <CheckSquare className="h-4 w-4 text-green-600" />;
        case 'in_progress':
            return <Clock className="h-4 w-4 text-blue-600" />;
        default:
            return <Circle className="h-4 w-4 text-gray-400" />;
    }
};

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'done':
            return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Terminé</Badge>;
        case 'in_progress':
            return <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">En cours</Badge>;
        default:
            return <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">À faire</Badge>;
    }
};

export default function TaskList({ projectId, issueId, issueTitle, projectMembers = [], isOwner = false }: TaskListProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const { token } = useAuth();

    const assignDeveloper = async (taskId: string, developerId: string | null) => {
        if (!token) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tasks/projects/${projectId}/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ assignee: developerId }),
            });

            if (res.ok) {
                const updatedTask = await res.json();
                setTasks(prev => prev.map(task =>
                    task._id === taskId ? updatedTask : task
                ));
                setRefreshKey(prev => prev + 1);
                toast.success(developerId ? 'Développeur affecté avec succès' : 'Développeur désaffecté');
            } else {
                throw new Error('Failed to assign developer');
            }
        } catch (error) {
            console.error('Error assigning developer:', error);
            toast.error('Erreur lors de l\'affectation du développeur');
        }
    };

    const fetchTasks = async () => {
        if (!token || !issueId) return;

        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tasks/projects/${projectId}/issues/${issueId}/tasks`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (res.ok) {
                const data = await res.json();
                setTasks(data);
            } else {
                throw new Error('Failed to fetch tasks');
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
            toast.error('Erreur lors du chargement des tâches');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (expanded) {
            fetchTasks();
        }
    }, [expanded, issueId, token]);

    const handleStatusUpdate = async (taskId: string, newStatus: string) => {
        if (!token) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tasks/projects/${projectId}/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                const updatedTask = await res.json();
                setTasks(prev => prev.map(task =>
                    task._id === taskId ? { ...task, status: updatedTask.status } : task
                ));
                toast.success('Statut de la tâche mis à jour');
            } else {
                throw new Error('Failed to update task status');
            }
        } catch (error) {
            console.error('Error updating task status:', error);
            toast.error('Erreur lors de la mise à jour du statut');
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!token || !confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tasks/projects/${projectId}/tasks/${taskId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (res.ok) {
                setTasks(prev => prev.filter(task => task._id !== taskId));
                toast.success('Tâche supprimée avec succès');
            } else {
                throw new Error('Failed to delete task');
            }
        } catch (error) {
            console.error('Error deleting task:', error);
            toast.error('Erreur lors de la suppression de la tâche');
        }
    };

    const todoTasks = tasks.filter(task => task.status === 'todo');
    const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
    const doneTasks = tasks.filter(task => task.status === 'done');

    return (
        <div className="mt-4">
            <div
                className="flex items-center gap-2 cursor-pointer p-2 hover:bg-muted/50 rounded-lg transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                {expanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <Plus className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                    Tâches ({tasks.length})
                </span>
                {tasks.length > 0 && (
                    <div className="flex gap-1 ml-auto">
                        {todoTasks.length > 0 && (
                            <Badge variant="outline" className="text-xs bg-gray-50">
                                {todoTasks.length} à faire
                            </Badge>
                        )}
                        {inProgressTasks.length > 0 && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                {inProgressTasks.length} en cours
                            </Badge>
                        )}
                        {doneTasks.length > 0 && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                {doneTasks.length} terminées
                            </Badge>
                        )}
                    </div>
                )}
            </div>

            {expanded && (
                <div className="ml-6 mt-3 space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                            <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Aucune tâche pour cette issue</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* TODO Tasks */}
                            {todoTasks.length > 0 && (
                                <div className="space-y-2">
                                    <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <Circle className="h-3 w-3" />
                                        À faire ({todoTasks.length})
                                    </h5>
                                    {todoTasks.map(task => (
                                        <TaskCard
                                            key={`${task._id}-${refreshKey}`}
                                            task={task}
                                            onStatusUpdate={handleStatusUpdate}
                                            onDelete={handleDeleteTask}
                                            projectMembers={projectMembers}
                                            isOwner={isOwner}
                                            onAssignDeveloper={assignDeveloper}
                                            onEdit={() => setEditingTask(task)}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* IN PROGRESS Tasks */}
                            {inProgressTasks.length > 0 && (
                                <div className="space-y-2">
                                    <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <Clock className="h-3 w-3" />
                                        En cours ({inProgressTasks.length})
                                    </h5>
                                    {inProgressTasks.map(task => (
                                        <TaskCard
                                            key={`${task._id}-${refreshKey}`}
                                            task={task}
                                            onStatusUpdate={handleStatusUpdate}
                                            onDelete={handleDeleteTask}
                                            projectMembers={projectMembers}
                                            isOwner={isOwner}
                                            onAssignDeveloper={assignDeveloper}
                                            onEdit={() => setEditingTask(task)}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* DONE Tasks */}
                            {doneTasks.length > 0 && (
                                <div className="space-y-2">
                                    <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <CheckSquare className="h-3 w-3" />
                                        Terminées ({doneTasks.length})
                                    </h5>
                                    {doneTasks.map(task => (
                                        <TaskCard
                                            key={`${task._id}-${refreshKey}`}
                                            task={task}
                                            onStatusUpdate={handleStatusUpdate}
                                            onDelete={handleDeleteTask}
                                            projectMembers={projectMembers}
                                            isOwner={isOwner}
                                            onAssignDeveloper={assignDeveloper}
                                            onEdit={() => setEditingTask(task)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Edit Task Modal */}
            {editingTask && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-xl shadow-elegant border max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <EditTaskForm
                            projectId={projectId}
                            task={editingTask}
                            projectMembers={projectMembers}
                            isOwner={isOwner}
                            onSuccess={() => {
                                setEditingTask(null);
                                fetchTasks();
                            }}
                            onCancel={() => setEditingTask(null)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

interface TaskCardProps {
    task: Task;
    onStatusUpdate: (taskId: string, status: string) => void;
    onDelete: (taskId: string) => void;
    projectMembers?: any[];
    isOwner?: boolean;
    onAssignDeveloper: (taskId: string, developerId: string | null) => void;
    onEdit: () => void;
}

function TaskCard({ task, onStatusUpdate, onDelete, projectMembers = [], isOwner = false, onAssignDeveloper, onEdit }: TaskCardProps) {
    return (
        <div className="p-3 border border-border/50 rounded-lg hover:bg-muted/30 transition-colors">
            <div className="flex items-start gap-3">
                <div className="mt-0.5">
                    {getStatusIcon(task.status)}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h6 className="text-sm font-medium truncate">{task.title}</h6>
                        {getStatusBadge(task.status)}
                    </div>
                    {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {task.description}
                        </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                            {task.assignee ? (
                                <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    <span>Assigné à: {task.assignee.name}</span>
                                </div>
                            ) : (
                                <span>Non assigné</span>
                            )}
                        </div>
                        {isOwner && projectMembers.length > 0 && (
                            <Select
                                value={task.assignee?._id || "unassigned"}
                                onValueChange={(value) => onAssignDeveloper(task._id, value === "unassigned" ? null : value)}
                            >
                                <SelectTrigger className="h-7 w-[140px] text-xs">
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
                        )}
                        <span>•</span>
                        <span>{new Date(task.updatedAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreVertical className="h-3 w-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <Select
                            value={task.status}
                            onValueChange={(value) => onStatusUpdate(task._id, value)}
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todo">À faire</SelectItem>
                                <SelectItem value="in_progress">En cours</SelectItem>
                                <SelectItem value="done">Terminé</SelectItem>
                            </SelectContent>
                        </Select>
                        <DropdownMenuSeparator />
                        {isOwner && (
                            <DropdownMenuItem className="cursor-pointer" onClick={onEdit}>
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="cursor-pointer text-destructive focus:text-destructive"
                            onClick={() => onDelete(task._id)}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
