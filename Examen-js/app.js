let productos = [];
const cuerpo = document.getElementById('cuerpo');
const serverStatusEl = document.getElementById('serverStatus');

const serverUrl = './api.php';
let serverAvailable = false;
let editingId = null;

// --- UTILIDADES SERVIDOR ---
// Comprobar estado del servidor y cargar productos
async function checkServer() {
    try {
        const resp = await fetch(`${serverUrl}`, { method: 'GET', cache: 'no-cache' });
        if (!resp.ok) throw new Error('no ok');
        const json = await resp.json();
        if (Array.isArray(json)) {
            serverAvailable = true;
            serverStatusEl.textContent = 'Servidor: online (datos sincronizados)';
            serverStatusEl.classList.add('online');
            serverStatusEl.classList.remove('offline');

            // Si hay datos en el servidor, los usamos (sobrescribe localStorage)
            productos = json;
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

// Función para guardar los datos en el servidor
async function saveToServer() {
    if (!serverAvailable) return;
    try {
        const resp = await fetch(`${serverUrl}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productos })
        });
        if (!resp.ok) throw new Error('error guardando en servidor');
        const json = await resp.json();
        if (!json.success) throw new Error('servidor rechazó');
        serverStatusEl.textContent = 'Servidor: online (última sincronización OK)';
    } catch (err) {
        serverStatusEl.textContent = 'Servidor: online pero no se pudo guardar';
    }
}

// --- FUNCIONES PRINCIPALES ---
// Guardar y sincronizar con el servidor
function guardarYSincronizar() {
    renderizar();
    if (serverAvailable) saveToServer();
}

// Renderizar la lista de productos
function renderizar() {
    cuerpo.innerHTML = "";
    if (productos.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="6" style="text-align:center;color:#666;padding:20px">No hay productos. Añade uno mediante el formulario.</td>';
        cuerpo.appendChild(tr);
        return;
    }

    productos.forEach((prod) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${prod.codigo}</td>
            <td>${prod.nombre}</td>
            <td>${prod.talla}</td>
            <td>${prod.precio}</td>
            <td>${prod.email_creador}</td>
            <td class="acciones-cell">
                <button class="btn-accion btn-editar" data-id="${prod.id}">✏️ Editar</button>
                <button class="btn-accion btn-eliminar" data-id="${prod.id}">🗑️ Eliminar</button>
            </td>
        `;
        cuerpo.appendChild(tr);
    });
}

// --- EVENTOS FORMULARIO ---
// Event listener para el formulario de productos
document.getElementById('formProducto').addEventListener('submit', (e) => {
    e.preventDefault();

    const codigo = document.getElementById('codigo').value.trim();
    const nombre = document.getElementById('nombre').value.trim();
    const talla = document.getElementById('talla').value.trim();
    const precio = parseFloat(document.getElementById('precio').value.trim());
    const email_creador = document.getElementById('email_creador').value.trim();

    if (!codigo || !nombre || !talla || isNaN(precio) || !email_creador) {
        alert('Por favor, completa todos los campos.');
        return;
    }

    const ahora = Date.now();
    const nuevoProducto = {
        id: editingId || ahora,
        codigo,
        nombre,
        talla,
        precio,
        email_creador
    };

    const idx = productos.findIndex(p => p.id === nuevoProducto.id);
    if (idx >= 0) {
        productos[idx] = Object.assign({}, productos[idx], nuevoProducto);
        alert('Producto actualizado.');
    } else {
        productos.push(nuevoProducto);
        alert('Producto añadido.');
    }

    // Resetear el formulario y guardar
    editingId = null;
    document.getElementById('productoId').value = '';
    document.getElementById('btnGuardar').textContent = 'Guardar';
    document.getElementById('btnCancelarEdicion').style.display = 'none';
    e.target.reset();

    guardarYSincronizar();
});

// --- BOTONES ---
// Borrar todo
document.getElementById('btnBorrarTodo')?.addEventListener('click', async () => {
    if (confirm("¿Borrar todo?")) {
        productos = [];
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
        // Descargar desde servidor
        window.location.href = `${serverUrl}?action=download`;
        return;
    }
    const datosStr = JSON.stringify(productos, null, 2);
    const blob = new Blob([datosStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `productos_${ts}.json`;
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

    // Si servidor disponible, subimos el archivo al servidor y el servidor nos devuelve datos parseados
    if (serverAvailable) {
        const form = new FormData();
        form.append('file', archivo);
        try {
            const resp = await fetch(`${serverUrl}?action=uploadFile`, { method: 'POST', body: form });
            const json = await resp.json();
            if (json.success && Array.isArray(json.data)) {
                mergeImported(json.data);
                alert(`Importación desde servidor finalizada. Añadidos/actualizados/ignorados.`);
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

    // Si no hay servidor, leer localmente
    readFileAndMerge(archivo);
    e.target.value = '';
});

// Función para leer e importar datos del archivo JSON
function readFileAndMerge(archivo) {
    const lector = new FileReader();
    lector.onload = function (evento) {
        try {
            let parsed = JSON.parse(evento.target.result);

            if (!Array.isArray(parsed)) {
                if (parsed.productos && Array.isArray(parsed.productos)) parsed = parsed.productos;
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

// Función para mezclar productos importados
function mergeImported(parsed) {
    let added = 0, updated = 0, invalid = 0;
    parsed.forEach(item => {
        const codigo = item.codigo ? String(item.codigo).trim() : '';
        const nombre = item.nombre ? String(item.nombre).trim() : '';
        const talla = item.talla || '';
        const precio = item.precio !== undefined ? parseFloat(item.precio) : null;
        const email_creador = item.email_creador || '';

        if (!codigo || !nombre || !talla || Number.isNaN(precio) || !email_creador) { invalid++; return; }

        const id = item.id || Date.now() + Math.floor(Math.random() * 1000);

        const nuevo = {
            id,
            codigo,
            nombre,
            talla,
            precio: Number.isNaN(precio) ? '' : precio,
            email_creador
        };

        const idx = productos.findIndex(p => p.id === id || (p.codigo === codigo));
        if (idx >= 0) {
            productos[idx] = Object.assign({}, productos[idx], nuevo);
            updated++;
        } else {
            productos.push(nuevo);
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
        const producto = productos.find(p => p.id === id);
        if (!producto) { alert('Producto no encontrado.'); return; }

        // Rellenar formulario
        document.getElementById('codigo').value = producto.codigo;
        document.getElementById('nombre').value = producto.nombre;
        document.getElementById('talla').value = producto.talla;
        document.getElementById('precio').value = producto.precio;
        document.getElementById('email_creador').value = producto.email_creador;
        document.getElementById('productoId').value = producto.id;

        editingId = producto.id;
        document.getElementById('btnGuardar').textContent = 'Actualizar';
        document.getElementById('btnCancelarEdicion').style.display = 'inline-block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    if (eliminarBtn) {
        const id = Number(eliminarBtn.dataset.id);
        if (!confirm('¿Eliminar este producto?')) return;
        productos = productos.filter(p => p.id !== id);
        guardarYSincronizar();
        alert('Producto eliminado.');
    }
});

// Cancelar edición
document.getElementById('btnCancelarEdicion').addEventListener('click', () => {
    editingId = null;
    document.getElementById('productoId').value = '';
    document.getElementById('formProducto').reset();
    document.getElementById('btnGuardar').textContent = 'Guardar';
    document.getElementById('btnCancelarEdicion').style.display = 'none';
});

// Render inicial y comprobación servidor
renderizar();
checkServer();