// equipo-pokemon.js
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const loadBtn = document.getElementById('loadBtn');
  const idsInput = document.getElementById('ids');
  const tbody = document.querySelector('#tbl tbody');
  const status = document.getElementById('status');
  const errorEl = document.getElementById('error');

  async function fetchPokemon(id) {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`Pokémon ${id} no encontrado (status ${res.status})`);
    return await res.json();
  }

  function clearTable() {
    tbody.innerHTML = '';
  }

  function addRow(pkm) {
    const tr = document.createElement('tr');
    const img = pkm.sprites?.front_default || '';
    tr.innerHTML = `
      <td><img class="pkm" src="${img}" alt="${escapeHtml(pkm.name)}"></td>
      <td>${escapeHtml(pkm.name)} (id: ${pkm.id})</td>
      <td>${pkm.base_experience ?? '—'}</td>
    `;
    tbody.appendChild(tr);
  }

  function escapeHtml(s = '') {
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  }

  loadBtn.addEventListener('click', async () => {
    const idsRaw = idsInput.value;
    const ids = idsRaw.split(',').map(s => s.trim()).filter(Boolean);
    if (!ids.length) return;

    clearTable();
    errorEl.textContent = '';
    status.textContent = 'Cargando...';
    loadBtn.disabled = true;

    try {
      for (const id of ids) {
        status.textContent = `Cargando Pokémon ${id}...`;
        try {
          const pkm = await fetchPokemon(id);
          addRow(pkm);
        } catch (innerErr) {
          const tr = document.createElement('tr');
          tr.innerHTML = `<td colspan="3">Error cargando ID ${escapeHtml(id)}: ${escapeHtml(innerErr.message)}</td>`;
          tbody.appendChild(tr);
        }
      }
      status.textContent = 'Carga finalizada.';
    } catch (err) {
      errorEl.textContent = 'Error general: ' + err.message;
      status.textContent = '';
    } finally {
      loadBtn.disabled = false;
      setTimeout(() => status.textContent = '', 2000);
    }
  });
});
