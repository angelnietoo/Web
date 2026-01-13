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
        const items = qsa('.item', dropdown);
        items.forEach(it => {
            it.classList.toggle('selected', selectedThemes[name] === it.dataset.tema);
        });
    });
}

modules.forEach(({ btn, dropdown, prefix, name }) => {
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
        modules.forEach(m => { if (m.dropdown !== dropdown) { m.dropdown.classList.remove('show'); m.btn.setAttribute('aria-expanded', 'false'); } });
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
        if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
            dropdown.classList.remove('show');
            btn.setAttribute('aria-expanded', 'false');
        }
    });
});

// cerrar con ESC global
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        modules.forEach(({ btn, dropdown }) => { dropdown.classList.remove('show'); btn.setAttribute('aria-expanded', 'false'); });
    }
});

/* Mostrar tema (activa/desactiva artículos) */
function showTema(temaId, module) {
    // añadimos 'examenes' para que el nuevo panel sea manejado
    const temas = ['tema1', 'tema2', 'tema3', 'tema4', 'tema5', 'examenes'];
    temas.forEach(t => {
        const elLang = document.getElementById(t);
        const elCli = document.getElementById('cliente_' + t);
        if (elLang) elLang.classList.toggle('active', module === 'lenguaje' && t === temaId);
        if (elCli) elCli.classList.toggle('active', module === 'cliente' && t === temaId);

        // además aplicamos un ligero highlight al panel activo
        if (elLang) elLang.classList.toggle('highlight', module === 'lenguaje' && t === temaId);
        if (elCli) elCli.classList.toggle('highlight', module === 'cliente' && t === temaId);
    });

    // hacer scroll suave al contenido
    const active = document.getElementById((module === 'cliente' ? 'cliente_' : '') + temaId);
    if (active) active.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // marca visual en botones principales (si quieres añadir estilos CSS a .toggle.active puedes hacerlo)
    qs('#btnLenguaje').classList.toggle('active', module === 'lenguaje');
    qs('#btnCliente').classList.toggle('active', module === 'cliente');
}

// Inicialización: aplicar selección guardada en dropdowns y en paneles
document.addEventListener('DOMContentLoaded', () => {
    refreshDropdownVisuals();

    // si había selección previa, mostramos el tema correspondiente (opcional: comentar si no quieres autoabrir)
    // aqui solo mostramos el panel seleccionado (sin abrir dropdown)
    if (selectedThemes['lenguaje']) showTema(selectedThemes['lenguaje'], 'lenguaje');
    if (selectedThemes['cliente']) showTema(selectedThemes['cliente'], 'cliente');
});

// CTA / shortcuts
qs('#githubBtn').addEventListener('click', function (e) { /*Puedes añadir enlace a tu repo*/ e.preventDefault(); alert('Sustituye este comportamiento por tu enlace a GitHub o proyecto.'); });
qs('#contactBtn').addEventListener('click', function (e) { e.preventDefault(); window.location.href = 'mailto:tu-email@ejemplo.com'; });

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
