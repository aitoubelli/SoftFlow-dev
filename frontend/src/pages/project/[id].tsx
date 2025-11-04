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

export default function ProjectDetails() {
    const router = useRouter();
    const { id } = router.query;
    const [project, setProject] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [selectedDevs, setSelectedDevs] = useState<string[]>([]);
    const { token } = useAuth();

    useEffect(() => {
        if (id && token) {
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
                .then(data => setProject(data))
                .catch(error => console.error('Error fetching project details:', error));
            
            fetch('http://localhost:8000/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            })
                .then(res => res.json())
                .then(data => setUsers(data))
                .catch(error => console.error('Error fetching users:', error));
        }
    }, [id, token]);

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
                console.log(res);
                throw new Error('Failed to assign developers');
            }
            const updatedProject = await res.json();
            setProject(updatedProject);
        } catch (error) {
            console.error('Error assigning developers:', error);
        }
    };

    if (!project) {
        return <div>Loading...</div>;
    }

    const memberIds = project.members ? project.members.map((member: any) => member.user._id) : [];
    const availableUsers = users.filter(user => !memberIds.includes(user._id));

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
                                <li key={member.user._id}>{member.user.name} ({member.role})</li>
                            ))}
                        </ul>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <div className="flex gap-2">
                        <Select onValueChange={(value) => setSelectedDevs(value ? [value] : [])}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Assign a developer" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableUsers.map(user => (
                                    <SelectItem key={user._id} value={user._id}>{user.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleAssignDevs} disabled={selectedDevs.length === 0}>Assign</Button>
                    </div>
                    <Button onClick={() => router.back()}>Go Back</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
