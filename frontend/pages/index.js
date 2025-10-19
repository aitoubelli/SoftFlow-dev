import { useEffect, useState } from 'react';

export default function Home() {
    const [apiStatus, setApiStatus] = useState(null);

    useEffect(() => {
        fetch('http://localhost:8000/api/health')
            .then(res => res.json())
            .then(data => setApiStatus(data))
            .catch(() => setApiStatus({ error: 'API non accessible' }));
    }, []);

    return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
            <h1>🚀 Gestionnaire de Production Logicielle</h1>
            <p>Projet interne – Sprint 0</p>
            <p>État de l’API :
                {apiStatus ? (
                    <span style={{ color: apiStatus.error ? 'red' : 'green' }}>
                        {apiStatus.error || apiStatus.status}
                    </span>
                ) : 'Chargement...'}
            </p>
        </div>
    );
}
