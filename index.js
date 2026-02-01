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

// función para actualizar visuales en dropdowns (clase .selected)
function refreshDropdownVisuals() {
    modules.forEach(({ dropdown, name }) => {
        if (!dropdown) return;
        const items = qsa('.item', dropdown);
        items.forEach(it => {
            it.classList.toggle('selected', selectedThemes[name] === it.dataset.tema);
        });
    });
}

modules.forEach(({ btn, dropdown, prefix, name }) => {
    if (!btn || !dropdown) return; // seguridad por si no existe el DOM esperado
    const items = qsa('.item', dropdown);

    // toggle function
    function setOpen(open) {
        dropdown.classList.toggle('show', open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');

        // si abrimos, enfocamos el item seleccionado si existe, si no el primero
        if (open) {
            const selectedTema = selectedThemes[name];
            const selItem = items.find(i => i.dataset.tema === selectedTema);
            (selItem || items[0])?.focus();
        }
    }

    btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const willOpen = !dropdown.classList.contains('show');
        // close others
        modules.forEach(m => { if (m.dropdown !== dropdown && m.dropdown) { m.dropdown.classList.remove('show'); m.btn.setAttribute('aria-expanded', 'false'); } });
        setOpen(willOpen);
    });

    // keyboard navigation within dropdown
    dropdown.addEventListener('keydown', (e) => {
        const idx = items.indexOf(document.activeElement);
        if (e.key === 'ArrowDown') { e.preventDefault(); const next = items[(idx + 1) % items.length]; next.focus(); }
        if (e.key === 'ArrowUp') { e.preventDefault(); const prev = items[(idx - 1 + items.length) % items.length]; prev.focus(); }
        if (e.key === 'Escape') { setOpen(false); btn.focus(); }
        if (e.key === 'Enter') { document.activeElement.click(); }
    });

    // click on item: show corresponding tema
    items.forEach(it => {
        it.addEventListener('click', () => {
            const tema = it.dataset.tema;

            // guardar selección para este módulo
            selectedThemes[name] = tema;

            // <-- LIMPIA la selección de los demás módulos para que no queden marcados -->
            modules.forEach(m => {
                if (m.name !== name) {
                    delete selectedThemes[m.name];
                }
            });

            // persistir y refrescar visuales
            localStorage.setItem('selectedThemes', JSON.stringify(selectedThemes));
            refreshDropdownVisuals();

            // mostrar contenido correspondiente y cerrar dropdown
            showTema(tema, name);
            setOpen(false);
        });
    });
});

// close dropdowns al hacer click fuera
document.addEventListener('click', (e) => {
    modules.forEach(({ btn, dropdown }) => {
        if (!dropdown || !btn) return;
        if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
            dropdown.classList.remove('show');
            btn.setAttribute('aria-expanded', 'false');
        }
    });
});

// cerrar con ESC global
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        modules.forEach(({ btn, dropdown }) => { if (dropdown && btn) { dropdown.classList.remove('show'); btn.setAttribute('aria-expanded', 'false'); } });
    }
});

/* Mostrar tema (activa/desactiva artículos) - VERSIÓN ROBUSTA */
function showTema(temaId, module) {
    // recoger todos los artículos de temas existentes bajo .content
    const allTemas = Array.from(document.querySelectorAll('.content .tema'));

    // ocultar todo y normalizar atributos
    allTemas.forEach(el => {
        el.classList.remove('active', 'highlight');
        el.setAttribute('aria-hidden', 'true');
        el.style.display = 'none';
    });

    // resolver posibles ids candidatos, por si data-tema viene con o sin prefijo
    const candidates = [
        (module === 'cliente' ? 'cliente_' : '') + temaId, // cliente_tema7 o tema7
        temaId,                                           // tema7
        temaId.replace(/^cliente_/, ''),                  // tema7 si vino como cliente_tema7
        (module === 'cliente' ? 'cliente_' : '') + 'tema' + String(temaId).replace(/\D/g,''), // cliente_tema7 fallback
        'cliente_' + temaId.replace(/^tema/, '')         // cliente_7 -> cliente_7 (otro fallback)
    ].filter(Boolean).map(s => String(s));

    let target = null;
    for (const id of candidates) {
        const el = document.getElementById(id);
        if (el) { target = el; break; }
    }

    if (!target) {
        console.warn('showTema: no se encontró ningún artículo para', temaId, 'candidatos:', candidates);
        return;
    }

    // mostrar el objetivo
    target.style.display = '';
    target.removeAttribute('aria-hidden');
    target.classList.add('active', 'highlight');

    // scroll suave al elemento
    try { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { /* ignore */ }

    // marcar visualmente los toggles principales
    if (qs('#btnLenguaje')) qs('#btnLenguaje').classList.toggle('active', module === 'lenguaje');
    if (qs('#btnCliente')) qs('#btnCliente').classList.toggle('active', module === 'cliente');
}

// Inicialización: aplicar selección guardada en dropdowns y en paneles
document.addEventListener('DOMContentLoaded', () => {
    refreshDropdownVisuals();

    // si había selección previa, mostramos el tema correspondiente (opcional: comentar si no quieres autoabrir)
    if (selectedThemes['lenguaje']) showTema(selectedThemes['lenguaje'], 'lenguaje');
    if (selectedThemes['cliente']) showTema(selectedThemes['cliente'], 'cliente');
});

// CTA / shortcuts (con guards para evitar errores si los elementos no existen)
if (qs('#githubBtn')) {
    qs('#githubBtn').addEventListener('click', function (e) { /*Puedes añadir enlace a tu repo*/ e.preventDefault(); alert('Sustituye este comportamiento por tu enlace a GitHub o proyecto.'); });
}
if (qs('#contactBtn')) {
    qs('#contactBtn').addEventListener('click', function (e) { e.preventDefault(); window.location.href = 'mailto:tu-email@ejemplo.com'; });
}

// Mejora accesibilidad: mostrar estilo focus cuando se navega por teclado
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
