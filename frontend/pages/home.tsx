import { useRouter } from "next/router"; 
import { useEffect, useState } from "react";

export default function Home() {

    const router = useRouter();
    const [projects, setProjects] = useState<any[]>([]);

    const fetchProjects = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/projects');
            if (!res.ok) {
                throw new Error('Failed to fetch projects');
            }
            const projects = await res.json();
            return projects;
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    useEffect(() => {
        fetchProjects().then((data) => {
            if (data) {
                setProjects(data);
                console.log('Fetched projects:', data);
            }
        });
    }, []);

    return (
        <div className="container">
            <h1>Welcome to SoftFlow</h1>
            <h2>Your projects will be listed here</h2>
            <div className="project-list">
                {projects.map((project: any) => (
                    <div key={project._id} className="project-card" onClick={() => router.push(`/project/${project._id}`)}>
                        <h3>{project.name}</h3>
                        <p>{project.description}</p>
                    </div>
                ))}
            </div>            
            <button
                onClick={() => router.push('/addProject')}
            >
                Create a project
            </button>

            <style jsx>{`
                .container {
                    padding: 2rem;
                }
                .project-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 20px;
                    list-style: none;
                    padding: 0;
                    justify-content: center;
                }
                .project-card {
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 20px;
                    width: 300px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    transition: box-shadow 0.3s ease, transform 0.3s ease;
                    cursor: pointer;
                }
                .project-card:hover {
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                    transform: translateY(-5px);
                }
                h1, h2 {
                    text-align: center;
                    color: #333;
                }
                button {
                    display: block;
                    margin: 40px auto;
                    padding: 12px 24px;
                    border-radius: 8px;
                    border: none;
                    background-color: #0070f3;
                    color: white;
                    cursor: pointer;
                    font-size: 16px;
                    transition: background-color 0.3s ease;
                }
                button:hover {
                    background-color: #005bb5;
                }
            `}</style>
        </div>
    )
    
}