let dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

console.log(dias.map(dia => dia.length));
// Muestra el array con la longitud de cada día: [5, 6, 9, 6, 7, 6, 7]

let sumaDias = dias.reduce((acumulador, elemento) => {
return acumulador + elemento.length;
}, 0);

// Muestra la suma total de la longitud de los nombres de los días
console.log(sumaDias);