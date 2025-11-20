function resolverLaberinto(lab, x, y, visitado = null) {
const filas = lab.length;
const cols = lab[0].length;

// Inicializar la matriz de visitados
if (!visitado) {
visitado = Array.from({ length: filas }, () => Array(cols).fill(false));
}

// Verificar límites
if (x < 0 || y < 0 || x>= filas || y >= cols) return false;

    // Pared o ya visitado
    if (lab[x][y] === "X" || visitado[x][y]) return false;

    // Llegamos a la meta
    if (lab[x][y] === "F") return true;

    // Marcar como visitado
    visitado[x][y] = true;

    // Recorrer las 4 direcciones
    if (resolverLaberinto(lab, x + 1, y, visitado)) return true; // abajo
    if (resolverLaberinto(lab, x - 1, y, visitado)) return true; // arriba
    if (resolverLaberinto(lab, x, y + 1, visitado)) return true; // derecha
    if (resolverLaberinto(lab, x, y - 1, visitado)) return true; // izquierda

    // Si no hay camino en esa celda
    return false;
    }

    // --- Ejemplo de uso ---
    const laberinto = [
    ["S", " ", "X", " "],
    ["X", " ", "X", " "],
    [" ", " ", " ", " "],
    ["X", "X", " ", "F"]
    ];

    // Encontrar la posición inicial
    let startX, startY;
    for (let i = 0; i < laberinto.length; i++) { for (let j=0; j < laberinto[i].length; j++) { if (laberinto[i][j]==="S"
        ) { startX=i; startY=j; } } } console.log(resolverLaberinto(laberinto, startX, startY)); // true