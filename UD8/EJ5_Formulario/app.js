// app.js - frontend que sincroniza con servidor.php

let alumnos = JSON.parse(localStorage.getItem('alumnos_db')) || [];
const cuerpo = document.getElementById('cuerpo');
const serverStatusEl = document.getElementById('serverStatus');

const serverUrl = './servidor.php';
let serverAvailable = false;
let editingId = null;

// --- VALIDACIONES ---
function validarMovil(movil) {
    return /^[6]\d{8}$/.test(String(movil).trim());
}
function mostrarErrorMovil(show) {
    document.getElementById('errorMovil').style.display = show ? 'block' : 'none';
}

// --- UTILIDADES SERVIDOR ---
async function checkServer() {
    try {
        const resp = await fetch(`${serverUrl}?action=list`, { method: 'GET', cache: 'no-cache' });
        if (!resp.ok) throw new Error('no ok');
        const json = await resp.json();
        if (Array.isArray(json.data)) {
            serverAvailable = true;
            serverStatusEl.textContent = 'Servidor: online (datos sincronizados)';
            serverStatusEl.classList.add('online');
            serverStatusEl.classList.remove('offline');

            // Si hay datos en el servidor, los usamos (sobrescribe localStorage)
            alumnos = json.data;
            localStorage.setItem('alumnos_db', JSON.stringify(alumnos));
            renderizar();
        } else {
            throw new Error('formato inesperado');
        }
    } catch (err) {
        serverAvailable = false;
        serverStatusEl.textContent = 'Servidor: offline (se usará localStorage)';
        serverStatusEl.classList.add('offline');
        serverStatusEl.classList.remove('online');
    }
}

async function saveToServer() {
    if (!serverAvailable) return;
    try {
        const resp = await fetch(`${serverUrl}?action=save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alumnos })
        });
        if (!resp.ok) throw new Error('error guardando en servidor');
        const json = await resp.json();
        if (!json.success) throw new Error('servidor rechazó');
        // opcional: mostrar feedback breve
        serverStatusEl.textContent = 'Servidor: online (última sincronización OK)';
    } catch (err) {
        serverStatusEl.textContent = 'Servidor: online pero no se pudo guardar';
    }
}

// --- FUNCIONES PRINCIPALES ---
function guardarYSincronizar() {
    localStorage.setItem('alumnos_db', JSON.stringify(alumnos));
    renderizar();
    // intentar guardar en servidor de forma asíncrona
    if (serverAvailable) saveToServer();
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
        tr.innerHTML = '<td colspan="9" style="text-align:center;color:#666;padding:20px">No hay alumnos. Añade uno mediante el formulario.</td>';
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
            <td>${escapeHtml(alum.idioma || '')}</td>
            <td>${badge}</td>
            <td>${(parseFloat(alum.nota) >= 5) ? 'Aprobado' : 'Suspenso'}</td>
            <td class="acciones-cell">
                <button class="btn-accion btn-editar" data-id="${alum.id}">✏️ Editar</button>
                <button class="btn-accion btn-eliminar" data-id="${alum.id}">🗑️ Eliminar</button>
            </td>
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
    const edadVal = document.getElementById('edad').value;
    const edad = edadVal === '' ? NaN : parseInt(edadVal, 10);
    const nota = parseFloat(document.getElementById('nota').value);
    const movil = document.getElementById('movil').value.trim();
    const repetidor = document.getElementById('repetidor').checked;
    const idioma = document.getElementById('idiomas').value || '';

    if (!nombre || !apellidos) { alert('Rellena nombre y apellidos.'); return; }
    if (Number.isNaN(edad) || edad < 0 || edad > 120) { alert('Edad inválida.'); return; }
    if (Number.isNaN(nota) || nota < 0 || nota > 10) { alert('Nota inválida (0-10).'); return; }
    if (!validarMovil(movil)) { mostrarErrorMovil(true); return; }

    const ahora = Date.now();
    const nuevo = {
        id: editingId || ahora,
        nombre,
        apellidos,
        edad,
        nota,
        movil,
        repetidor,
        idioma
    };

    const idx = alumnos.findIndex(a => a.id === nuevo.id);
    if (idx >= 0) {
        alumnos[idx] = Object.assign({}, alumnos[idx], nuevo);
        alert('Alumno actualizado.');
    } else {
        const existNameIdx = alumnos.findIndex(a => a.nombre === nombre && a.apellidos === apellidos);
        if (existNameIdx >= 0) {
            if (!confirm('Ya existe un alumno con ese nombre y apellidos. ¿Deseas añadir otro con ID distinto?')) {
                return;
            }
        }
        alumnos.push(nuevo);
        alert('Alumno añadido.');
    }

    // reset
    editingId = null;
    document.getElementById('alumnoId').value = '';
    document.getElementById('btnGuardar').textContent = 'Guardar';
    document.getElementById('btnCancelarEdicion').style.display = 'none';
    e.target.reset();

    guardarYSincronizar();
    mostrarErrorMovil(false);
});

// --- BOTONES ---
// Borrar todo
document.getElementById('btnBorrarTodo')?.addEventListener('click', async () => {
    if (confirm("¿Borrar todo?")) {
        alumnos = [];
        guardarYSincronizar();
        if (serverAvailable) {
            try {
                await fetch(`${serverUrl}?action=delete_all`, { method: 'POST' });
                serverStatusEl.textContent = 'Servidor: online (datos borrados en servidor)';
            } catch (err) {
                serverStatusEl.textContent = 'Servidor: online pero no se pudo borrar en servidor';
            }
        }
    }
});

// Descargar (si servidor disponible sirve fichero; si no, crea blob local)
document.getElementById('btnDescargar').addEventListener('click', () => {
    if (serverAvailable) {
        // descargar desde servidor
        window.location.href = `${serverUrl}?action=download`;
        return;
    }
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

// Cargar (abre selector)
document.getElementById('btnCargar').addEventListener('click', () => {
    document.getElementById('inputArchivo').click();
});

// Importar archivo JSON (cliente) o enviarlo al servidor si está disponible
document.getElementById('inputArchivo').addEventListener('change', async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    // si servidor disponible, subimos el archivo al servidor y el servidor nos devuelve datos parseados
    if (serverAvailable) {
        const form = new FormData();
        form.append('file', archivo);
        try {
            const resp = await fetch(`${serverUrl}?action=uploadFile`, { method: 'POST', body: form });
            const json = await resp.json();
            if (json.success && Array.isArray(json.data)) {
                mergeImported(json.data);
                alert(`Importación desde servidor finalizada. Añadidos/actualizados/ignorados (ver consola).`);
            } else {
                alert('El servidor no pudo procesar el archivo. Se intentará importar localmente.');
                // fallback local
                readFileAndMerge(archivo);
            }
        } catch (err) {
            console.error(err);
            alert('Error subiendo al servidor. Se intentará importar localmente.');
            readFileAndMerge(archivo);
        } finally {
            e.target.value = '';
        }
        return;
    }

    // si no hay servidor, leer localmente
    readFileAndMerge(archivo);
    e.target.value = '';
});

function readFileAndMerge(archivo) {
    const lector = new FileReader();
    lector.onload = function (evento) {
        try {
            let parsed = JSON.parse(evento.target.result);

            if (!Array.isArray(parsed)) {
                if (parsed.alumnos && Array.isArray(parsed.alumnos)) parsed = parsed.alumnos;
                else if (parsed.data && Array.isArray(parsed.data)) parsed = parsed.data;
                else parsed = [parsed];
            }
            mergeImported(parsed);
            alert('Importación finalizada (local).');
        } catch (err) {
            alert("Error: El archivo no es un JSON válido.");
        }
    };
    lector.readAsText(archivo);
}

function mergeImported(parsed) {
    let added = 0, updated = 0, invalid = 0;
    parsed.forEach(item => {
        const nombre = item.nombre ? String(item.nombre).trim() : '';
        const apellidos = item.apellidos ? String(item.apellidos).trim() : '';
        const edad = item.edad !== undefined ? parseInt(item.edad, 10) : (item.age !== undefined ? parseInt(item.age, 10) : null);
        const nota = item.nota !== undefined ? parseFloat(item.nota) : (item.grade !== undefined ? parseFloat(item.grade) : null);
        const movil = item.movil || item.telefono || item.phone || '';
        const idioma = item.idioma || item.idiomas || item.language || '';
        if (!nombre || !apellidos || !validarMovil(movil) || Number.isNaN(edad)) { invalid++; return; }

        const repetidor = !!item.repetidor || !!item.repeat || !!item.repeater;
        const id = item.id || Date.now() + Math.floor(Math.random() * 1000);

        const nuevo = {
            id,
            nombre,
            apellidos,
            edad: Number.isNaN(edad) ? '' : edad,
            nota: Number.isNaN(nota) ? '' : nota,
            movil: String(movil),
            repetidor,
            idioma
        };

        const idx = alumnos.findIndex(a => a.id === id || (a.nombre === nombre && a.apellidos === apellidos));
        if (idx >= 0) {
            alumnos[idx] = Object.assign({}, alumnos[idx], nuevo);
            updated++;
        } else {
            alumnos.push(nuevo);
            added++;
        }
    });
    guardarYSincronizar();
    console.log(`Import: añadidos=${added}, actualizados=${updated}, inválidos=${invalid}`);
}

// Delegación de eventos para Editar / Eliminar
cuerpo.addEventListener('click', (e) => {
    const editarBtn = e.target.closest('.btn-editar');
    const eliminarBtn = e.target.closest('.btn-eliminar');

    if (editarBtn) {
        const id = Number(editarBtn.dataset.id);
        const alumno = alumnos.find(a => a.id === id);
        if (!alumno) { alert('Alumno no encontrado.'); return; }

        // rellenar formulario
        document.getElementById('nombre').value = alumno.nombre;
        document.getElementById('apellidos').value = alumno.apellidos;
        document.getElementById('edad').value = alumno.edad;
        document.getElementById('nota').value = alumno.nota;
        document.getElementById('movil').value = alumno.movil;
        document.getElementById('repetidor').checked = !!alumno.repetidor;
        document.getElementById('idiomas').value = alumno.idioma || '';
        document.getElementById('alumnoId').value = alumno.id;

        editingId = alumno.id;
        document.getElementById('btnGuardar').textContent = 'Actualizar';
        document.getElementById('btnCancelarEdicion').style.display = 'inline-block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    if (eliminarBtn) {
        const id = Number(eliminarBtn.dataset.id);
        if (!confirm('¿Eliminar este registro?')) return;
        alumnos = alumnos.filter(a => a.id !== id);
        guardarYSincronizar();
        alert('Alumno eliminado.');
    }
});

// Cancelar edición
document.getElementById('btnCancelarEdicion').addEventListener('click', () => {
    editingId = null;
    document.getElementById('alumnoId').value = '';
    document.getElementById('formAlumno').reset();
    document.getElementById('btnGuardar').textContent = 'Guardar';
    document.getElementById('btnCancelarEdicion').style.display = 'none';
    mostrarErrorMovil(false);
});

// Render inicial y comprobación servidor
renderizar();
checkServer();
