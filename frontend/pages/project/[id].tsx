import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function ProjectDetails() {
    const router = useRouter();
    const { id } = router.query;
    const [project, setProject] = useState<any>(null);

    useEffect(() => {
        if (id) {
            fetch(`http://localhost:8000/api/projects/${id}`)
                .then(res => {
                    if (!res.ok) {
                        throw new Error('Project not found');
                    }
                    return res.json();
                })
                .then(data => setProject(data))
                .catch(error => console.error('Error fetching project details:', error));
        }
    }, [id]);

    if (!project) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container">
            <h1>{project.name}</h1>
            <p>{project.description}</p>
            <p>Owner: {project.owner || 'Not assigned'}</p>
            <p>Created at: {new Date(project.createdAt).toLocaleDateString()}</p>
            
            <button onClick={() => router.back()}>Go Back</button>

            <style jsx>{`
                .container {
                    padding: 2rem;
                    text-align: center;
                }
                h1 {
                    color: #333;
                }
                p {
                    color: #666;
                    margin: 10px 0;
                }
                button {
                    margin-top: 20px;
                    padding: 10px 20px;
                    border-radius: 5px;
                    border: none;
                    background-color: #0070f3;
                    color: white;
                    cursor: pointer;
                }
                button:hover {
                    background-color: #005bb5;
                }
            `}</style>
        </div>
    );
}
