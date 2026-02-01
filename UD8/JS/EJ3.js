// buscador-productos.js
'use strict';
document.addEventListener('DOMContentLoaded', () => {
  const searchBtn = document.getElementById('searchBtn');
  const qInput = document.getElementById('q');
  const status = document.getElementById('status');
  const tbl = document.getElementById('tbl');
  const tbody = tbl.querySelector('tbody');
  const noResults = document.getElementById('noResults');

  async function doSearch(q) {
    if (!q || !q.trim()) {
      noResults.style.display = 'block';
      noResults.textContent = 'Escribe algo en el campo de búsqueda.';
      tbl.style.display = 'none';
      return;
    }
    status.textContent = 'Buscando...';
    noResults.style.display = 'none';
    tbody.innerHTML = '';
    tbl.style.display = 'none';

    const url = `https://dummyjson.com/products/search?q=${encodeURIComponent(q)}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error en la búsqueda: ' + res.status);
      const data = await res.json();
      const results = Array.isArray(data.products) ? data.products : [];

      if (!results.length) {
        noResults.style.display = 'block';
        noResults.textContent = 'No se encontraron productos que coincidan con tu búsqueda.';
        tbl.style.display = 'none';
      } else {
        for (const p of results) {
          const tr = document.createElement('tr');
          const img = (p.images && p.images[0]) ? p.images[0] : '';
          tr.innerHTML = `
            <td>${img ? `<img class="thumb" src="${img}" alt="${escapeHtml(p.title)}">` : '—'}</td>
            <td>${escapeHtml(p.title)}</td>
            <td>${escapeHtml(truncate(p.description, 120))}</td>
            <td>${p.discountPercentage ?? '—'}</td>
          `;
          tbody.appendChild(tr);
        }
        tbl.style.display = '';
      }
    } catch (err) {
      noResults.style.display = 'block';
      noResults.textContent = 'Error en la búsqueda: ' + err.message;
    } finally {
      status.textContent = '';
    }
  }

  function truncate(s, n) {
    if (!s) return '';
    return s.length > n ? s.slice(0, n-1) + '…' : s;
  }
  function escapeHtml(s='') {
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  }

  qInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); searchBtn.click(); } });
  searchBtn.addEventListener('click', () => doSearch(qInput.value));
});