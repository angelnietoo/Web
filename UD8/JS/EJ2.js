// catalogo-productos.js
'use strict';
document.addEventListener('DOMContentLoaded', () => {
  const API = 'https://dummyjson.com/products';
  const fetchBtn = document.getElementById('fetchBtn');
  const filterBtn = document.getElementById('filterBtn');
  const resetBtn = document.getElementById('resetBtn');
  const status = document.getElementById('status');
  const tbody = document.querySelector('#tbl tbody');
  const msg = document.getElementById('msg');

  let products = [];

  async function loadAll() {
    status.textContent = 'Cargando productos...';
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error('Error al obtener productos: ' + res.status);
      const data = await res.json();
      if (!Array.isArray(data.products)) throw new Error('Respuesta inesperada');
      products = data.products;
      renderTable(products);
      filterBtn.disabled = false;
      resetBtn.disabled = false;
      msg.textContent = `Se han cargado ${products.length} productos.`;
    } catch (err) {
      msg.textContent = 'Error: ' + err.message;
    } finally {
      status.textContent = '';
    }
  }

  function renderTable(list) {
    tbody.innerHTML = '';
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="4">No hay productos para mostrar.</td></tr>';
      return;
    }
    for (const p of list) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(p.title)}</td>
        <td>${p.price} €</td>
        <td>${p.stock}</td>
        <td>${escapeHtml(p.brand)}</td>
      `;
      tbody.appendChild(tr);
    }
  }

  function escapeHtml(s='') {
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  }

  fetchBtn.addEventListener('click', loadAll);
  filterBtn.addEventListener('click', () => {
    const filtered = products.filter(p => Number(p.stock) < 10);
    renderTable(filtered);
    msg.textContent = `${filtered.length} productos con stock inferior a 10.`;
  });
  resetBtn.addEventListener('click', () => {
    renderTable(products);
    msg.textContent = `Mostrando todos los productos (${products.length}).`;
  });
});
