import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Save } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface TestCase {
    _id: string;
    name: string;
    description?: string;
    status: 'pending' | 'passed' | 'failed';
    release?: string;
    task?: {
        _id: string;
        title: string;
    };
}

interface EditTestCaseFormProps {
    projectId: string;
    testCase: TestCase;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function EditTestCaseForm({ projectId, testCase, onSuccess, onCancel }: EditTestCaseFormProps) {
    const { token, user } = useAuth();
    const [formData, setFormData] = useState({
        name: testCase.name,
        description: testCase.description || '',
        status: testCase.status,
        release: testCase.release || ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const isDeveloper = user?.role === 'dev';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            toast.error('Le nom est requis');
            return;
        }

        setIsSubmitting(true);

        try {
            // Developers can only update status
            const updateData = isDeveloper 
                ? { status: formData.status }
                : {
                    name: formData.name,
                    description: formData.description,
                    status: formData.status,
                    release: formData.release
                };

            const response = await fetch(
                `http://localhost:8000/api/testcases/projects/${projectId}/testcases/${testCase._id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(updateData)
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la mise à jour de la fiche de test');
            }

            toast.success('Fiche de test mise à jour avec succès');
            onSuccess();
        } catch (error: any) {
            console.error('Error updating test case:', error);
            toast.error(error.message || 'Erreur lors de la mise à jour de la fiche de test');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Modifier la fiche de test</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {testCase.task && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-600">
                            Tâche liée: <span className="font-medium text-gray-900">{testCase.task.title}</span>
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Nom <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Nom de la fiche de test"
                            required
                            disabled={isSubmitting || isDeveloper}
                        />
                        {isDeveloper && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Les développeurs ne peuvent modifier que le statut
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Description de la fiche de test"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={4}
                            disabled={isSubmitting || isDeveloper}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Statut <span className="text-red-500">*</span>
                        </label>
                        <Select
                            value={formData.status}
                            onValueChange={(value: 'pending' | 'passed' | 'failed') => 
                                setFormData({ ...formData, status: value })
                            }
                            disabled={isSubmitting}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un statut" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">En attente</SelectItem>
                                <SelectItem value="passed">Réussi</SelectItem>
                                <SelectItem value="failed">Échoué</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Release
                        </label>
                        <Input
                            value={formData.release}
                            onChange={(e) => setFormData({ ...formData, release: e.target.value })}
                            placeholder="Numéro de release (optionnel)"
                            disabled={isSubmitting || isDeveloper}
                        />
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={isSubmitting}
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={isSubmitting}
                        >
                            Annuler
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
