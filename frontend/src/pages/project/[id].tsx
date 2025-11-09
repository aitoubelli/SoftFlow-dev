import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function ProjectDetails() {
    const router = useRouter();
    const { id } = router.query;
    const [project, setProject] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [selectedDevs, setSelectedDevs] = useState<string[]>([]);
    const { token, user } = useAuth();

    useEffect(() => {
        if (router.isReady && id && token) {
            fetch(`http://localhost:8000/api/projects/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            })
                .then(res => {
                    if (!res.ok) {
                        throw new Error('Project not found');
                    }
                    return res.json();
                })
                .then(data => {
                    setProject(data);
                })
                .catch((error: Error) => console.error('Error fetching project details:', error));

            fetch('http://localhost:8000/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            })
                .then(res => res.json())
                .then(data => {
                    setUsers(data);
                })
                .catch((error: Error) => console.error('Error fetching users:', error));
        }
    }, [id, token, router.isReady]);

    const handleAssignDevs = async () => {
        if (!token) return;
        try {
            const res = await fetch(`http://localhost:8000/api/projects/${id}/assign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ userIds: selectedDevs }),

            });
            if (!res.ok) {
                throw new Error('Failed to assign developers');
            }
            const updatedProject = await res.json();
            setProject(updatedProject);
            toast.success("Developer(s) assigned successfully!");
        } catch (error: any) {
            console.error('Error assigning developers:', error);
            toast.error(error.message || "Failed to assign developer(s).");
        }
    };

    if (!project) {
        return <div>Loading...</div>;
    }

    const memberIds = project.members
        ? project.members.filter((member: any) => member.user).map((member: any) => member.user.id)
        : [];
    const availableUsers = Array.isArray(users) ? users.filter(u => !memberIds.includes(u.id) && u.role === 'dev') : []; // Filter to only include 'dev' users not already members
    const canAssignMembers = user?.id === project.owner?.id || user?.role === 'admin';

    return (
        <div className="container mx-auto p-4">
            <Card>
                <CardHeader>
                    <CardTitle>{project.name}</CardTitle>
                    <CardDescription>{project.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Owner: {project.owner ? project.owner.name : 'Not assigned'}</p>
                    <p>Created at: {new Date(project.createdAt).toLocaleDateString()}</p>
                    <div>
                        <h4 className="font-bold mt-4">Members:</h4>
                        <ul>
                            {project.members && project.members.map((member: any) => (
                                member.user ? <li key={member.user.id}>{member.user.name} ({member.role})</li> : null
                            ))}
                        </ul>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    {canAssignMembers && (
                        <div className="flex gap-2">
                            <Select onValueChange={(value: string | undefined) => setSelectedDevs(value ? [value] : [])}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Assign a developer" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableUsers.map(u => (
                                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button onClick={handleAssignDevs} disabled={selectedDevs.length === 0}>Assign</Button>
                        </div>
                    )}
                    <Button onClick={() => router.back()}>Go Back</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
