
import React, { useState } from 'react'
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';

export default function ProjectForm() {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { user, token } = useAuth();
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) {
            setError('Le nom du projet est requis.')
            return
        }
        setError('')
            setIsSubmitting(true)
            fetch('http://localhost:8000/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: name.trim(), description, owner: user?.id })
            })
                .then(async (res) => {
                    setIsSubmitting(false)
                    if (!res.ok) {
                        const payload = await res.json().catch(() => ({}))
                        throw new Error(payload.error || 'Erreur lors de la création du projet')
                    }
                    return res.json()
                })
                .then((created) => {
                    // reset
                    setName('')
                    setDescription('')
                    router.push('/home')
                })
                .catch((err) => {
                    console.error('Erreur création projet:', err)
                    setError(err.message || 'Erreur réseau')
                })
    }

    return (
        <form onSubmit={handleSubmit} className="project-form">
            <h2>Créer un projet</h2>

            {error && <p className="error">{error}</p>}

            <div className="field">
                <label htmlFor="project-name">Nom du projet</label>
                <input
                    id="project-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Entrez le nom du projet"
                    aria-required
                />
            </div>

            <div className="field">
                <label htmlFor="project-desc">Description</label>
                <textarea
                    id="project-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Courte description du projet"
                    rows={4}
                />
            </div>

                    <div className="actions">
                        <button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Création...' : 'Créer'}
                        </button>
                    </div>

            <style jsx>{`
                .project-form {
                    width: 100%;
                    max-width: 640px;
                    padding: 24px;
                    border: 1px solid #e6e6e6;
                    border-radius: 12px;
                    background: #fff;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                }
                h2 {
                    margin: 0 0 24px 0;
                    font-size: 24px;
                    font-weight: 600;
                    text-align: center;
                }
                .field {
                    display: flex;
                    flex-direction: column;
                    margin-bottom: 16px;
                }
                label {
                    font-size: 16px;
                    margin-bottom: 8px;
                }
                input,
                textarea {
                    padding: 12px 14px;
                    border: 1px solid #ccc;
                    border-radius: 6px;
                    font-size: 16px;
                }
                .actions {
                    display: flex;
                    justify-content: flex-end;
                    margin-top: 8px;
                }
                button {
                    background: #0070f3;
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 500;
                }
                button:disabled {
                    background: #999;
                    cursor: not-allowed;
                }
                .error {
                    color: #b00020;
                    margin: 0 0 16px 0;
                    text-align: center;
                }
            `}</style>
        </form>
    )
}
