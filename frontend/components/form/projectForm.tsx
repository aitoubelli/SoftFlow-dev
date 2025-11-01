
import React, { useState } from 'react'
import { useRouter } from 'next/router';

export default function ProjectForm() {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) {
            setError('Le nom du projet est requis.')
            return
        }
        setError('')
            // appel réel à l'API backend
            setIsSubmitting(true)
            fetch('http://localhost:8000/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), description })
            })
                .then(async (res) => {
                    setIsSubmitting(false)
                    if (!res.ok) {
                        const payload = await res.json().catch(() => ({}))
                        console.log(res)
                        throw new Error(payload.error || 'Erreur lors de la création du projet prout')
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
                    max-width: 480px;
                    padding: 16px;
                    border: 1px solid #e6e6e6;
                    border-radius: 8px;
                    background: #fff;
                }
                h2 {
                    margin: 0 0 12px 0;
                    font-size: 18px;
                }
                .field {
                    display: flex;
                    flex-direction: column;
                    margin-bottom: 12px;
                }
                label {
                    font-size: 14px;
                    margin-bottom: 6px;
                }
                input,
                textarea {
                    padding: 8px 10px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    font-size: 14px;
                }
                .actions {
                    display: flex;
                    justify-content: flex-end;
                }
                button {
                    background: #0070f3;
                    color: white;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                }
                .error {
                    color: #b00020;
                    margin: 0 0 12px 0;
                }
            `}</style>
        </form>
    )   
}