function contarParesImpares() {
    let numeros: number[] = [];
    let pares = 0;
    let impares = 0;
    
    while (true) {
        let entrada = prompt("Introduce un número (0 para terminar):");
        if (entrada === null || entrada.trim() === "") {
            continue;
        }
        
        let numero = parseInt(entrada);
        
        if (isNaN(numero) || numero === 0) {
            break;
        }
        
        numeros.push(numero);
        if (numero % 2 === 0) {
            pares++;
        } else {
            impares++;
        }
    }
    
    if (numeros.length > 0) {
        console.log("Array de entrada:", numeros);
        console.log("Cantidad de números pares:", pares);
        console.log("Cantidad de números impares:", impares);
    } else {
        console.log("No se ingresaron números válidos.");
    }
}

contarParesImpares();
