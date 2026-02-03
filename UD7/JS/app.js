let alumnos = JSON.parse(localStorage.getItem('alumnos_db')) || [];
const cuerpo = document.getElementById('cuerpo');

// --- VALIDACIONES ---
function validarMovil(movil) {
    return /^[6]\d{8}$/.test(String(movil).trim());
}

function mostrarErrorMovil(show) {
    document.getElementById('errorMovil').style.display = show ? 'block' : 'none';
}

// --- FUNCIONES PRINCIPALES ---
function guardarYSincronizar() {
    localStorage.setItem('alumnos_db', JSON.stringify(alumnos));
    renderizar();
}

function escapeHtml(text) {
    if (text === undefined || text === null) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function renderizar() {
    cuerpo.innerHTML = "";
    if (alumnos.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="7" style="text-align:center;color:#666;padding:20px">No hay alumnos. Añade uno mediante el formulario.</td>';
        cuerpo.appendChild(tr);
        return;
    }

    alumnos.forEach((alum) => {
        const tr = document.createElement('tr');
        const claseNota = (parseFloat(alum.nota) < 5) ? 'suspenso' : '';
        const badge = alum.repetidor ? '<span class="repetidor-badge">Rep</span>' : '';
        tr.innerHTML = `
            <td>${escapeHtml(alum.nombre)}</td>
            <td>${escapeHtml(alum.apellidos)}</td>
            <td>${escapeHtml(alum.edad)}</td>
            <td class="${claseNota}">${escapeHtml(alum.nota)}</td>
            <td>${escapeHtml(alum.movil || '')}</td>
            <td>${badge}</td>
            <td>${(parseFloat(alum.nota) >= 5) ? 'Aprobado' : 'Suspenso'}</td>
        `;
        cuerpo.appendChild(tr);
    });
}

// --- EVENTOS FORMULARIO ---
document.getElementById('formAlumno').addEventListener('submit', (e) => {
    e.preventDefault();
    mostrarErrorMovil(false);

    const nombre = document.getElementById('nombre').value.trim();
    const apellidos = document.getElementById('apellidos').value.trim();
    const edad = parseInt(document.getElementById('edad').value, 10);
    const nota = parseFloat(document.getElementById('nota').value);
    const movil = document.getElementById('movil').value.trim();
    const repetidor = document.getElementById('repetidor').checked;

    if (!nombre || !apellidos) { alert('Rellena nombre y apellidos.'); return; }
    if (Number.isNaN(edad) || edad < 0 || edad > 120) { alert('Edad inválida.'); return; }
    if (Number.isNaN(nota) || nota < 0 || nota > 10) { alert('Nota inválida (0-10).'); return; }
    if (!validarMovil(movil)) { mostrarErrorMovil(true); return; }

    const nuevo = { nombre, apellidos, edad, nota, movil, repetidor };
    const idx = alumnos.findIndex(a => a.nombre === nombre && a.apellidos === apellidos);
    if (idx >= 0) {
        alumnos[idx] = nuevo;
    } else {
        alumnos.push(nuevo);
    }

    guardarYSincronizar();
    e.target.reset();
    mostrarErrorMovil(false);
});

// --- BOTONES ---
document.getElementById('btnBorrarTodo').addEventListener('click', () => {
    if (confirm("¿Borrar todo?")) {
        alumnos = [];
        guardarYSincronizar();
    }
});

document.getElementById('btnDescargar').addEventListener('click', () => {
    const datosStr = JSON.stringify(alumnos, null, 2);
    const blob = new Blob([datosStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `notas_curso_${ts}.json`;
    a.click();
    URL.revokeObjectURL(url);
});

document.getElementById('btnCargar').addEventListener('click', () => {
    document.getElementById('inputArchivo').click();
});

document.getElementById('inputArchivo').addEventListener('change', (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = function (evento) {
        try {
            let parsed = JSON.parse(evento.target.result);

            if (!Array.isArray(parsed)) {
                if (parsed.alumnos && Array.isArray(parsed.alumnos)) parsed = parsed.alumnos;
                else if (parsed.data && Array.isArray(parsed.data)) parsed = parsed.data;
                else parsed = [parsed];
            }

            let added = 0, updated = 0, invalid = 0;
            parsed.forEach(item => {
                const nombre = item.nombre ? String(item.nombre).trim() : '';
                const apellidos = item.apellidos ? String(item.apellidos).trim() : '';
                const edad = item.edad !== undefined ? parseInt(item.edad, 10) : (item.age !== undefined ? parseInt(item.age, 10) : null);
                const nota = item.nota !== undefined ? parseFloat(item.nota) : (item.grade !== undefined ? parseFloat(item.grade) : null);
                const movil = item.movil || item.telefono || item.phone || '';
                if (!nombre || !apellidos || !validarMovil(movil)) { invalid++; return; }

                const repetidor = !!item.repetidor || !!item.repeat || !!item.repeater;

                const nuevo = {
                    nombre,
                    apellidos,
                    edad: Number.isNaN(edad) ? '' : edad,
                    nota: Number.isNaN(nota) ? '' : nota,
                    movil: String(movil),
                    repetidor
                };

                const idx = alumnos.findIndex(a => a.nombre === nombre && a.apellidos === apellidos);
                if (idx >= 0) {
                    alumnos[idx] = Object.assign({}, alumnos[idx], nuevo);
                    updated++;
                } else {
                    alumnos.push(nuevo);
                    added++;
                }
            });

            guardarYSincronizar();
            let mensaje = `Importación finalizada. Añadidos: ${added}. Actualizados: ${updated}. Ignorados (inválidos): ${invalid}.`;
            if (invalid > 0) mensaje += ' Comprueba el formato de los móviles y los nombres.';
            alert(mensaje);
        } catch (err) {
            alert("Error: El archivo no es un JSON válido.");
        }
    };
    lector.readAsText(archivo);
    e.target.value = '';
});

// Render inicial
renderizar();
