/* ---------- Helpers & elemento raíz ---------- */
const qs = (s, ctx = document) => ctx.querySelector(s);
const qsa = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));

/* Dropdowns y accesibilidad (teclado) */
const modules = [
    { btn: qs('#btnLenguaje'), dropdown: qs('#dropdownLenguaje'), prefix: '', name: 'lenguaje' },
    { btn: qs('#btnCliente'), dropdown: qs('#dropdownCliente'), prefix: 'cliente_', name: 'cliente' }
];

// carga selección previa (persistencia)
const selectedThemes = JSON.parse(localStorage.getItem('selectedThemes') || '{}');

/* función para actualizar visuales en dropdowns (clase .selected) */
function refreshDropdownVisuals() {
    modules.forEach(({ dropdown, name }) => {
        if (!dropdown) return;
        const items = qsa('.item', dropdown);
        items.forEach(it => {
            it.classList.toggle('selected', selectedThemes[name] === it.dataset.tema);
        });
    });
}

/* --- Inicialización de dropdowns y manejadores --- */
modules.forEach(({ btn, dropdown, prefix, name }) => {
    if (!btn || !dropdown) return;

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
            // (si el CSS limita la altura, esto permite ver el contenido; si no, no rompe)
            try {
                // usa scrollHeight para adaptarse al contenido
                const sh = dropdown.scrollHeight;
                // si el dropdown ya tiene maxHeight mayor, no lo reduzcamos
                dropdown.style.maxHeight = (sh > 0 ? sh + 'px' : 'none');
                dropdown.style.overflowY = 'auto';
            } catch (e) {
                // no crítico
                dropdown.style.maxHeight = '';
                dropdown.style.overflowY = '';
            }
        } else {
            // revertimos estilos inline para no interferir con CSS permanente
            dropdown.style.maxHeight = '';
            dropdown.style.overflowY = '';
        }
    }

    btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const willOpen = !dropdown.classList.contains('show');
        modules.forEach(m => { if (m.dropdown && m.dropdown !== dropdown) { m.dropdown.classList.remove('show'); m.btn.setAttribute('aria-expanded', 'false'); m.dropdown.style.maxHeight = ''; m.dropdown.style.overflowY = ''; } });
        setOpen(willOpen);
    });

    // keyboard navigation within dropdown (reconsulta siempre los items)
    dropdown.addEventListener('keydown', (e) => {
        const currentItems = qsa('.item', dropdown);
        const idx = currentItems.indexOf(document.activeElement);
        if (e.key === 'ArrowDown') { e.preventDefault(); const next = currentItems[(idx + 1) % currentItems.length]; next?.focus(); }
        if (e.key === 'ArrowUp') { e.preventDefault(); const prev = currentItems[(idx - 1 + currentItems.length) % currentItems.length]; prev?.focus(); }
        if (e.key === 'Escape') { dropdown.classList.remove('show'); btn.setAttribute('aria-expanded', 'false'); btn.focus(); dropdown.style.maxHeight = ''; dropdown.style.overflowY = ''; }
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
        }
    });
});

/* Cerrar con ESC global */
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        modules.forEach(({ btn, dropdown }) => { if (btn && dropdown) { dropdown.classList.remove('show'); btn.setAttribute('aria-expanded', 'false'); dropdown.style.maxHeight = ''; dropdown.style.overflowY = ''; } });
    }
});

/* --------------------- showTema (robusta + debug) --------------------- */
/*
  Estrategia:
  - No manipulamos display: none globalmente (evitamos romper CSS).
  - Usamos/añadimos la clase .active (esperando que tu CSS muestre .tema.active).
  - Si después de añadir .active el elemento sigue invisible, forzamos un inline style como fallback y avisamos en consola.
  - Registramos en consola candidatos y resultado para depuración.
*/
function showTema(temaId, module) {
    console.groupCollapsed(`showTema: tema="${temaId}" module="${module}"`);
    try {
        const allTemas = Array.from(document.querySelectorAll('.content .tema'));
        if (!allTemas.length) console.warn('No se encontraron artículos con selector ".content .tema"');

        // quitar clases de todos
        allTemas.forEach(el => {
            el.classList.remove('active', 'highlight');
            el.setAttribute('aria-hidden', 'true');
            // No forzamos display aquí para respetar tu CSS
        });

        // generar candidatos (stringify por seguridad)
        const cleanTema = String(temaId || '').trim();
        const candidates = [
            (module === 'cliente' ? 'cliente_' : '') + cleanTema,
            cleanTema,
            cleanTema.replace(/^cliente_/, ''),
            (module === 'cliente' ? 'cliente_' : '') + 'tema' + String(cleanTema).replace(/\D/g,''),
            'cliente_' + cleanTema.replace(/^tema/, '')
        ].filter(Boolean).map(s => String(s));

        console.debug('Candidatos de id:', candidates);

        let target = null;
        let foundId = null;
        for (const id of candidates) {
            const el = document.getElementById(id);
            if (el) { target = el; foundId = id; break; }
        }

        if (!target) {
            console.error('showTema: NO encontrado ningún elemento con los ids candidatos. Asegúrate de que el id del artículo exista exactamente.');
            console.groupEnd();
            return;
        }

        // aplicamos clases que esperan la mayoría de estilos (activar / highlight)
        target.classList.add('active', 'highlight');
        target.removeAttribute('aria-hidden');

        // scroll y focus
        try { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { /* ignore */ }
        target.focus?.();

        // comprobación: ¿es visible según el navegador?
        const compStyle = window.getComputedStyle(target);
        console.debug('Elemento encontrado id="%s" — display=%s, visibility=%s, height=%s', foundId, compStyle.display, compStyle.visibility, compStyle.height);

        // fallback: si sigue invisible (display: none o visibility:hidden) intentamos forzar
        if (compStyle.display === 'none' || compStyle.visibility === 'hidden' || parseFloat(compStyle.height) === 0) {
            console.warn('Elemento sigue invisible tras añadir .active — aplicando fallback inline style.');
            target.style.display = '';      // intentar quitar display si estaba en inline
            target.style.visibility = 'visible';
            target.style.removeProperty('height'); // intentar quitar height forzado
            // re-check
            const after = window.getComputedStyle(target);
            console.debug('Después fallback — display=%s, visibility=%s, height=%s', after.display, after.visibility, after.height);
            if (after.display === 'none') {
                console.error('Aún invisible: puede haber reglas con !important. Comparte aquí tu CSS para que lo adaptemos.');
            }
        }

        // marcar toggles principales
        if (qs('#btnLenguaje')) qs('#btnLenguaje').classList.toggle('active', module === 'lenguaje');
        if (qs('#btnCliente')) qs('#btnCliente').classList.toggle('active', module === 'cliente');

        console.log('showTema: mostrado ->', foundId);
    } finally {
        console.groupEnd();
    }
}

/* Inicialización: aplicar selección guardada en dropdowns y en paneles */
(function init() {
    refreshDropdownVisuals();

    // Si hay selección previa la mostramos (no abrimos dropdowns)
    // Además: si la selección es cliente y el elemento no existe, dejamos log en consola
    if (selectedThemes['lenguaje']) showTema(selectedThemes['lenguaje'], 'lenguaje');
    if (selectedThemes['cliente']) showTema(selectedThemes['cliente'], 'cliente');
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
