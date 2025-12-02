import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Rocket, Calendar, CheckCircle2, Clock } from 'lucide-react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

interface Task {
    _id: string;
    title: string;
    status: string;
    priority?: string;
}

interface Sprint {
    _id: string;
    name: string;
    startDate: string;
    endDate: string;
    tasks: Task[];
    createdAt: string;
    status?: 'active' | 'completed' | 'planned';
}

interface SprintListProps {
    sprints: Sprint[];
    loading: boolean;
}

export default function SprintList({ sprints, loading }: SprintListProps) {
    if (loading) {
        return (
            <Card className="shadow-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <Rocket className="h-5 w-5 text-primary" />
                        Sprints
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-card">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                        <Rocket className="h-5 w-5 text-primary" />
                        Sprints
                    </CardTitle>
                    <Badge variant="secondary">
                        {sprints.length} sprint{sprints.length !== 1 ? 's' : ''}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                {sprints.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Rocket className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p>Aucun sprint créé pour ce projet.</p>
                    </div>
                ) : (
                    <Accordion type="single" collapsible className="w-full">
                        {sprints.map((sprint) => (
                            <AccordionItem key={sprint._id} value={sprint._id} className="border-b border-border/50 last:border-0">
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex items-center gap-4 w-full pr-4">
                                        <div className="flex flex-col items-start gap-1 flex-1">
                                            <span className="font-semibold text-base">{sprint.name}</span>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground font-normal">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    Du {new Date(sprint.startDate).toLocaleDateString('fr-FR')} au {new Date(sprint.endDate).toLocaleDateString('fr-FR')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="ml-auto">
                                                {sprint.tasks?.length || 0} tâches
                                            </Badge>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="pl-4 pb-4 space-y-2">
                                        {sprint.tasks && sprint.tasks.length > 0 ? (
                                            sprint.tasks.map(task => (
                                                <div key={task._id} className="flex items-center justify-between p-2 bg-muted/30 rounded-md text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className={`h-4 w-4 ${task.status === 'done' ? 'text-green-500' : 'text-muted-foreground'}`} />
                                                        <span className={task.status === 'done' ? 'line-through text-muted-foreground' : ''}>
                                                            {task.title}
                                                        </span>
                                                    </div>
                                                    <Badge variant="secondary" className="text-[10px] h-5">
                                                        {task.status}
                                                    </Badge>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic">Aucune tâche dans ce sprint.</p>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </CardContent>
        </Card>
    );
}
