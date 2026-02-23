/* ---------- Helpers & elemento raíz ---------- */
const qs = (s, ctx = document) => ctx.querySelector(s);
const qsa = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));

/* Dropdowns y accesibilidad (teclado) */
const modules = [
    { btn: qs('#btnLenguaje'), dropdown: qs('#dropdownLenguaje'), prefix: '', name: 'lenguaje' },
    { btn: qs('#btnCliente'), dropdown: qs('#dropdownCliente'), prefix: 'cliente_', name: 'cliente' },
    // Nuevo módulo DISEÑO DE INTERFACES WEB
    { btn: qs('#btnDiseno'), dropdown: qs('#dropdownDiseno'), prefix: 'diseno_', name: 'diseno' }
];

// carga selección previa (persistencia)
const selectedThemes = JSON.parse(localStorage.getItem('selectedThemes') || '{}');

/* --- Helpers específicos --- */
function refreshDropdownVisuals() {
    modules.forEach(({ dropdown, name }) => {
        if (!dropdown) return;
        const items = qsa('.item', dropdown);
        items.forEach(it => {
            it.classList.toggle('selected', selectedThemes[name] === it.dataset.tema);
        });
    });
}

/**
 * Asegura que exista un item con data-tema=temaId dentro del dropdown.
 * Si no existe, lo crea y lo inserta antes del item 'examenes' si existe.
 */
function ensureTemaItem(dropdown, temaId, labelText) {
    if (!dropdown) return null;
    const exists = dropdown.querySelector(`.item[data-tema="${temaId}"]`);
    if (exists) return exists;

    // crear item nuevo
    const div = document.createElement('div');
    div.setAttribute('tabindex', '0');
    div.className = 'item';
    div.setAttribute('role', 'menuitem');
    div.dataset.tema = temaId;
    div.innerHTML = `<span class="dot"></span><span> ${labelText}</span>`;

    // intentar insertar antes de 'examenes' si hay uno
    const exam = dropdown.querySelector('.item[data-tema="examenes"]');
    if (exam) dropdown.insertBefore(div, exam);
    else dropdown.appendChild(div);

    return div;
}

/**
 * Asegura que un elemento .item esté visible dentro de su contenedor .dropdown:
 * calcula offset y ajusta dropdown.scrollTop si hace falta.
 */
function ensureItemVisibleInDropdown(dropdown, item) {
    if (!dropdown || !item) return;
    // usar requestAnimationFrame para esperar a que el DOM haya pintado
    requestAnimationFrame(() => {
        const itemTop = item.offsetTop;
        const itemBottom = itemTop + item.offsetHeight;
        const viewTop = dropdown.scrollTop;
        const viewBottom = viewTop + dropdown.clientHeight;

        if (itemTop < viewTop) {
            dropdown.scrollTop = itemTop - 8;
        } else if (itemBottom > viewBottom) {
            dropdown.scrollTop = itemBottom - dropdown.clientHeight + 8;
        }
    });
}

/* --- Inicialización de dropdowns y manejadores (robusto) --- */
modules.forEach(({ btn, dropdown, prefix, name }) => {
    if (!btn || !dropdown) return;

    // Al iniciar, inyectamos Tema 8 si es el dropdownCliente
    if (name === 'cliente') {
        ensureTemaItem(dropdown, 'tema8', 'Tema 8 — APIs & Fetch');
    }

    // Abre/cierra el dropdown. Recalcula items al abrir para incluir items nuevos.
    function setOpen(open) {
        dropdown.classList.toggle('show', open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');

        // Recalcular items al abrir para que incluyan tema8 si existe
        const currentItems = qsa('.item', dropdown);

        if (open) {
            const selectedTema = selectedThemes[name];
            const selItem = currentItems.find(i => i.dataset.tema === selectedTema);
            (selItem || currentItems[0])?.focus();

            // Forzar visibilidad/scroll del dropdown mediante maxHeight inline
            try {
                const sh = dropdown.scrollHeight;
                // Limitar a un máximo razonable para no romper layout (por ejemplo 70vh)
                const maxPx = Math.min(sh, Math.round(window.innerHeight * 0.7));
                dropdown.style.maxHeight = (maxPx > 0 ? (maxPx + 'px') : '');
                dropdown.style.overflowY = 'auto';
                // eleva z-index momentáneamente para evitar clipping por stacking context
                dropdown.style.zIndex = 9999;
            } catch (e) {
                dropdown.style.maxHeight = '';
                dropdown.style.overflowY = '';
                dropdown.style.zIndex = '';
            }

            // Asegurar que el último elemento (o tema8) sea visible
            const want = dropdown.querySelector('.item[data-tema="tema8"]') || currentItems[currentItems.length - 1];
            if (want) ensureItemVisibleInDropdown(dropdown, want);
        } else {
            // revertimos estilos inline para no interferir con CSS permanente
            dropdown.style.maxHeight = '';
            dropdown.style.overflowY = '';
            dropdown.style.zIndex = '';
        }
    }

    btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const willOpen = !dropdown.classList.contains('show');
        modules.forEach(m => {
            if (m.dropdown && m.dropdown !== dropdown) {
                m.dropdown.classList.remove('show');
                m.btn.setAttribute('aria-expanded', 'false');
                m.dropdown.style.maxHeight = '';
                m.dropdown.style.overflowY = '';
                m.dropdown.style.zIndex = '';
            }
        });
        // Antes de abrir, garantizar item tema8 (por si HTML no lo contiene)
        if (name === 'cliente') ensureTemaItem(dropdown, 'tema8', 'Tema 8 — APIs & Fetch');
        setOpen(willOpen);
    });

    // keyboard navigation within dropdown (reconsulta siempre los items)
    dropdown.addEventListener('keydown', (e) => {
        const currentItems = qsa('.item', dropdown);
        const idx = currentItems.indexOf(document.activeElement);
        if (e.key === 'ArrowDown') { e.preventDefault(); const next = currentItems[(idx + 1) % currentItems.length]; next?.focus(); ensureItemVisibleInDropdown(dropdown, next); }
        if (e.key === 'ArrowUp') { e.preventDefault(); const prev = currentItems[(idx - 1 + currentItems.length) % currentItems.length]; prev?.focus(); ensureItemVisibleInDropdown(dropdown, prev); }
        if (e.key === 'Escape') { dropdown.classList.remove('show'); btn.setAttribute('aria-expanded', 'false'); btn.focus(); dropdown.style.maxHeight = ''; dropdown.style.overflowY = ''; dropdown.style.zIndex = ''; }
        if (e.key === 'Enter') { document.activeElement.click(); }
    });

    // Delegación: click en cualquier .item del dropdown (incluye tema8 aunque se añada después)
    dropdown.addEventListener('click', (e) => {
        const it = e.target.closest('.item');
        if (!it || !dropdown.contains(it)) return;

        const temaRaw = it.dataset.tema;
        const tema = typeof temaRaw === 'string' ? temaRaw.trim() : temaRaw;

        // guardar selección para este módulo
        selectedThemes[name] = tema;

        // limpiar la selección de otros módulos
        modules.forEach(m => {
            if (m.name !== name) delete selectedThemes[m.name];
        });

        localStorage.setItem('selectedThemes', JSON.stringify(selectedThemes));
        refreshDropdownVisuals();

        // mostrar contenido correspondiente y cerrar dropdown
        showTema(tema, name);

        // cerrar y revertir estilos
        dropdown.classList.remove('show');
        btn.setAttribute('aria-expanded', 'false');
        dropdown.style.maxHeight = '';
        dropdown.style.overflowY = '';
        dropdown.style.zIndex = '';
    });
});

/* Cerrar dropdowns al hacer click fuera */
document.addEventListener('click', (e) => {
    modules.forEach(({ btn, dropdown }) => {
        if (!btn || !dropdown) return;
        if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
            dropdown.classList.remove('show');
            btn.setAttribute('aria-expanded', 'false');
            dropdown.style.maxHeight = '';
            dropdown.style.overflowY = '';
            dropdown.style.zIndex = '';
        }
    });
});

/* Cerrar con ESC global */
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        modules.forEach(({ btn, dropdown }) => { if (btn && dropdown) { dropdown.classList.remove('show'); btn.setAttribute('aria-expanded', 'false'); dropdown.style.maxHeight = ''; dropdown.style.overflowY = ''; dropdown.style.zIndex = ''; } });
    }
});

/* --------------------- showTema (robusta + debug) --------------------- */
function showTema(temaId, module) {
    console.groupCollapsed(`showTema: tema="${temaId}" module="${module}"`);
    try {
        const allTemas = Array.from(document.querySelectorAll('.content .tema'));
        if (!allTemas.length) console.warn('No se encontraron artículos con selector ".content .tema"');

        allTemas.forEach(el => {
            el.classList.remove('active', 'highlight');
            el.setAttribute('aria-hidden', 'true');
        });

        const cleanTema = String(temaId || '').trim();

        // Construir candidatos con tratamiento especial para 'cliente' y 'diseno'
        const candidates = [];

        if (module === 'cliente') {
            candidates.push('cliente_' + cleanTema);
        } else if (module === 'diseno') {
            // para diseño, preferimos ids que empiecen por diseno_ y además un fallback directo al artículo único
            candidates.push('diseno_' + cleanTema);
            candidates.push('diseno_tema1'); // artículo único en el index para diseño
        } else {
            if (cleanTema) candidates.push(cleanTema);
        }

        // Añadimos otras heurísticas existentes
        candidates.push(cleanTema.replace(/^cliente_/, ''));
        if (module === 'cliente') candidates.push('cliente_' + 'tema' + String(cleanTema).replace(/\D/g, ''));
        candidates.push('cliente_' + cleanTema.replace(/^tema/, ''));

        // Filtrar nulos y duplicados
        const uniq = Array.from(new Set(candidates.filter(Boolean)));

        console.debug('Candidatos de id:', uniq);

        let target = null;
        let foundId = null;
        for (const id of uniq) {
            const el = document.getElementById(id);
            if (el) { target = el; foundId = id; break; }
        }

        if (!target) {
            console.error('showTema: NO encontrado ningún elemento con los ids candidatos. Asegúrate de que el id del artículo exista exactamente.');
            console.groupEnd();
            return;
        }

        target.classList.add('active', 'highlight');
        target.removeAttribute('aria-hidden');

        try { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { /* ignore */ }
        try {
            target.focus?.();
        } catch (e) { /* ignore */ }

        const compStyle = window.getComputedStyle(target);
        console.debug('Elemento encontrado id="%s" — display=%s, visibility=%s, height=%s', foundId, compStyle.display, compStyle.visibility, compStyle.height);

        if (compStyle.display === 'none' || compStyle.visibility === 'hidden' || parseFloat(compStyle.height) === 0) {
            console.warn('Elemento sigue invisible tras añadir .active — aplicando fallback inline style.');
            target.style.display = '';
            target.style.visibility = 'visible';
            target.style.removeProperty('height');
            const after = window.getComputedStyle(target);
            console.debug('Después fallback — display=%s, visibility=%s, height=%s', after.display, after.visibility, after.height);
            if (after.display === 'none') {
                console.error('Aún invisible: puede haber reglas con !important. Comparte aquí tu CSS para que lo adaptemos.');
            }
        }

        // marcar botones activos (incluimos btnDiseno)
        if (qs('#btnLenguaje')) qs('#btnLenguaje').classList.toggle('active', module === 'lenguaje');
        if (qs('#btnCliente')) qs('#btnCliente').classList.toggle('active', module === 'cliente');
        if (qs('#btnDiseno')) qs('#btnDiseno').classList.toggle('active', module === 'diseno');

        console.log('showTema: mostrado ->', foundId);
    } finally {
        console.groupEnd();
    }
}

/* Inicialización */
(function init() {
    refreshDropdownVisuals();

    // Mostrar selección previa si la hay
    if (selectedThemes['lenguaje']) showTema(selectedThemes['lenguaje'], 'lenguaje');
    if (selectedThemes['cliente']) showTema(selectedThemes['cliente'], 'cliente');
    if (selectedThemes['diseno']) showTema(selectedThemes['diseno'], 'diseno');
})();

/* CTA / shortcuts (guards) */
if (qs('#githubBtn')) {
    qs('#githubBtn').addEventListener('click', function (e) { e.preventDefault(); alert('Sustituye este comportamiento por tu enlace a GitHub o proyecto.'); });
}
if (qs('#contactBtn')) {
    qs('#contactBtn').addEventListener('click', function (e) { e.preventDefault(); window.location.href = 'mailto:tu-email@ejemplo.com'; });
}

/* Mejora accesibilidad: mostrar estilo focus cuando se navega por teclado */
(function () {
    function handleFirstTab(e) {
        if (e.key === 'Tab') document.body.classList.add('show-focus');
        window.removeEventListener('keydown', handleFirstTab);
    }
    window.addEventListener('keydown', handleFirstTab);
    document.addEventListener('focusin', (ev) => {
        if (document.body.classList.contains('show-focus')) {
            if (ev.target) ev.target.classList.add('focus-visible');
        }
    });
    document.addEventListener('focusout', (ev) => {
        if (ev.target) ev.target.classList.remove('focus-visible');
    });
})();