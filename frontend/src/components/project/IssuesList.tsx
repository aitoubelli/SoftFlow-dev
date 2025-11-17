import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Trash2, Edit2, CheckCircle2, XCircle } from 'lucide-react';

interface Issue {
    _id: string;
    title: string;
    description: string;
    status: 'open' | 'closed';
    createdBy: {
        name: string;
        email: string;
    };
    createdAt: string;
    closedAt?: string;
}

interface IssuesListProps {
    projectId: string;
    isOwner: boolean;
    refreshTrigger?: number;
}

export default function IssuesList({ projectId, isOwner, refreshTrigger }: IssuesListProps) {
    const { token } = useAuth();
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingIssue, setEditingIssue] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');

    const fetchIssues = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/issues/project/${projectId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (res.ok) {
                const data = await res.json();
                setIssues(data);
            }
        } catch (error) {
            console.error('Error fetching issues:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (projectId && token) {
            fetchIssues();
        }
    }, [projectId, token, refreshTrigger]);

    const toggleIssueStatus = async (issueId: string, currentStatus: string) => {
        if (!isOwner) {
            toast.error('Only project owners can change issue status');
            return;
        }

        const newStatus = currentStatus === 'open' ? 'closed' : 'open';

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/issues/${issueId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ status: newStatus }),
                }
            );

            if (res.ok) {
                toast.success(`Issue ${newStatus === 'closed' ? 'closed' : 'reopened'}`);
                fetchIssues();
            } else {
                const error = await res.json();
                toast.error(error.error || 'Failed to update issue');
            }
        } catch (error) {
            toast.error('Error updating issue');
        }
    };

    const deleteIssue = async (issueId: string) => {
        if (!isOwner) {
            toast.error('Only project owners can delete issues');
            return;
        }

        if (!confirm('Are you sure you want to delete this issue?')) {
            return;
        }

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/issues/${issueId}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (res.ok) {
                toast.success('Issue deleted successfully');
                fetchIssues();
            } else {
                const error = await res.json();
                toast.error(error.error || 'Failed to delete issue');
            }
        } catch (error) {
            toast.error('Error deleting issue');
        }
    };

    const startEditIssue = (issue: Issue) => {
        setEditingIssue(issue._id);
        setEditTitle(issue.title);
        setEditDescription(issue.description);
    };

    const cancelEdit = () => {
        setEditingIssue(null);
        setEditTitle('');
        setEditDescription('');
    };

    const saveEdit = async (issueId: string) => {
        if (!isOwner) {
            toast.error('Only project owners can edit issues');
            return;
        }

        if (!editTitle.trim()) {
            toast.error('Issue title is required');
            return;
        }

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/issues/${issueId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ 
                        title: editTitle,
                        description: editDescription 
                    }),
                }
            );

            if (res.ok) {
                toast.success('Issue updated successfully');
                setEditingIssue(null);
                setEditTitle('');
                setEditDescription('');
                fetchIssues();
            } else {
                const error = await res.json();
                toast.error(error.error || 'Failed to update issue');
            }
        } catch (error) {
            toast.error('Error updating issue');
        }
    };

    if (loading) {
        return <div>Loading issues...</div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Issues ({issues.length})</CardTitle>
            </CardHeader>
            <CardContent>
                    {issues.length === 0 ? (
                        <p className="text-gray-500">No issues yet</p>
                    ) : (
                        <div className="space-y-3">
                            {issues.map((issue) => (
                                <div
                                    key={issue._id}
                                    className="flex flex-col p-4 border rounded-lg hover:shadow-md transition-shadow"
                                >
                                    {editingIssue === issue._id ? (
                                        // Edit mode
                                        <div className="space-y-3">
                                            <Input
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                placeholder="Issue title"
                                                className="font-semibold"
                                            />
                                            <Input
                                                value={editDescription}
                                                onChange={(e) => setEditDescription(e.target.value)}
                                                placeholder="Description (optional)"
                                                className="text-sm"
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => saveEdit(issue._id)}
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    Save
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={cancelEdit}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        // View mode
                                        <>
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="font-semibold text-lg">{issue.title}</h3>
                                                        <Badge
                                                            variant={issue.status === 'open' ? 'default' : 'secondary'}
                                                            className="flex items-center gap-1"
                                                        >
                                                            {issue.status === 'open' ? (
                                                                <XCircle className="h-3 w-3" />
                                                            ) : (
                                                                <CheckCircle2 className="h-3 w-3" />
                                                            )}
                                                            {issue.status}
                                                        </Badge>
                                                    </div>
                                                    {issue.description && (
                                                        <p className="text-sm text-gray-600 mb-3">
                                                            {issue.description}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-gray-500">
                                                        Created by {issue.createdBy.name} on{' '}
                                                        {new Date(issue.createdAt).toLocaleDateString()}
                                                        {issue.closedAt && (
                                                            <> • Closed on {new Date(issue.closedAt).toLocaleDateString()}</>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {isOwner && (
                                                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => toggleIssueStatus(issue._id, issue.status)}
                                                        className={issue.status === 'open' ? 'text-green-600 hover:bg-green-50' : 'text-blue-600 hover:bg-blue-50'}
                                                    >
                                                        {issue.status === 'open' ? (
                                                            <>
                                                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                                                Close Issue
                                                            </>
                                                        ) : (
                                                            <>
                                                                <XCircle className="h-4 w-4 mr-2" />
                                                                Reopen Issue
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => startEditIssue(issue)}
                                                        className="text-blue-600 hover:bg-blue-50"
                                                    >
                                                        <Edit2 className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => deleteIssue(issue._id)}
                                                        className="text-red-600 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
    );
}
