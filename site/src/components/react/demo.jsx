export function Demo({prenom}) {
    const age = 22;

    return (
        <div>
            <h1>Bienvenue, {prenom} !</h1>
            <p>Vous avez {age} ans.</p>
            <p>L'an prochain, vous aurez {age + 1} ans.</p>
        </div>
    );
}