import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface CreateIssueFormProps {
    projectId: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export default function CreateIssueForm({ projectId, onSuccess, onCancel }: CreateIssueFormProps) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/issues`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    projectId: projectId,
                    title: title.trim(),
                    description: description.trim()
                })
            });

            if (!res.ok) {
                const payload = await res.json().catch(() => ({}))
                throw new Error(payload.error || 'Erreur lors de la création de l\'issue')
            }

            const createdIssue = await res.json();
            toast.success('Issue créée avec succès!');

            // Reset form
            setTitle('')
            setDescription('')
            setError('')

            // Call success callback
            if (onSuccess) {
                onSuccess();
            }
        } catch (err: any) {
            console.error('Erreur création issue:', err)
            setError(err.message || 'Erreur réseau')
            toast.error(err.message || 'Erreur lors de la création de l\'issue');
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="create-issue-form">
            <h3>Créer une nouvelle issue</h3>

            {error && <p className="error">{error}</p>}

            <div className="field">
                <label htmlFor="issue-title">Titre *</label>
                <input
                    id="issue-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Entrez le titre de l'issue"
                    aria-required
                    required
                />
            </div>

            <div className="field">
                <label htmlFor="issue-desc">Description</label>
                <textarea
                    id="issue-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description détaillée de l'issue"
                    rows={4}
                />
            </div>

            <div className="actions">
                {onCancel && (
                    <button type="button" onClick={onCancel} className="cancel-btn">
                        Annuler
                    </button>
                )}
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Création...' : 'Créer l\'issue'}
                </button>
            </div>

            <style jsx>{`
                .create-issue-form {
                    width: 100%;
                    max-width: 500px;
                    padding: 24px;
                    border: 1px solid #e6e6e6;
                    border-radius: 12px;
                    background: #fff;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                }
                h3 {
                    margin: 0 0 20px 0;
                    font-size: 20px;
                    font-weight: 600;
                    text-align: center;
                }
                .field {
                    display: flex;
                    flex-direction: column;
                    margin-bottom: 16px;
                }
                label {
                    font-size: 14px;
                    margin-bottom: 6px;
                    font-weight: 500;
                }
                input,
                textarea {
                    padding: 10px 12px;
                    border: 1px solid #ccc;
                    border-radius: 6px;
                    font-size: 14px;
                    transition: border-color 0.2s;
                }
                input:focus,
                textarea:focus {
                    outline: none;
                    border-color: #0070f3;
                }
                .actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    margin-top: 20px;
                }
                button {
                    background: #0070f3;
                    color: white;
                    border: none;
                    padding: 10px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: background-color 0.2s;
                }
                button:hover:not(:disabled) {
                    background: #0056cc;
                }
                button:disabled {
                    background: #999;
                    cursor: not-allowed;
                }
                .cancel-btn {
                    background: #6c757d;
                }
                .cancel-btn:hover:not(:disabled) {
                    background: #545b62;
                }
                .error {
                    color: #dc3545;
                    margin: 0 0 16px 0;
                    text-align: center;
                    font-size: 14px;
                }
            `}</style>
        </form>
    )
}
