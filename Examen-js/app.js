document.addEventListener('DOMContentLoaded', function () {
    // Cargar productos al inicio
    loadProducts();

    // Evento para agregar un producto
    const addProductForm = document.getElementById('addProductForm');
    addProductForm.addEventListener('submit', function (event) {
        event.preventDefault();
        addProduct();
    });

    // Evento para actualizar un producto
    const editProductForm = document.getElementById('editProductForm');
    editProductForm.addEventListener('submit', function (event) {
        event.preventDefault();
        updateProduct();
    });
});

// Cargar productos desde la API
function loadProducts() {
    fetch('api.php', {
        method: 'GET',
    })
        .then(response => response.json())
        .then(data => {
            const productosTableBody = document.querySelector('#productosTable tbody');
            productosTableBody.innerHTML = '';  // Limpiar la tabla antes de agregar nuevos productos

            data.forEach(product => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${product.codigo}</td>
                    <td>${product.nombre}</td>
                    <td>${product.talla}</td>
                    <td>${product.precio}</td>
                    <td>${product.email_creador}</td>
                    <td>
                        <button class="btn btn-warning btn-sm" onclick="editProduct(${product.id})">Editar</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteProduct(${product.id})">Eliminar</button>
                    </td>
                `;
                productosTableBody.appendChild(row);
            });
        })
        .catch(error => console.error('Error al cargar productos:', error));
}

// Agregar un producto
function addProduct() {
    const codigo = document.getElementById('codigo').value;
    const nombre = document.getElementById('nombre').value;
    const talla = document.getElementById('talla').value;
    const precio = document.getElementById('precio').value;
    const email_creador = document.getElementById('email_creador').value;

    // Verificar que todos los campos están completos
    if (!codigo || !nombre || !talla || !precio || !email_creador) {
        alert("Por favor, completa todos los campos.");
        return;
    }

    const productData = {
        codigo,
        nombre,
        talla,
        precio,
        email_creador
    };

    fetch('api.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                alert(data.message); // Mensaje de éxito
                loadProducts(); // Recargar la lista de productos
                document.getElementById('addProductForm').reset(); // Limpiar el formulario
            }
        })
        .catch(error => console.error('Error al agregar producto:', error));
}

// Editar un producto (cargar datos en el modal)
function editProduct(id) {
    fetch(`api.php?id=${id}`, {
        method: 'GET',
    })
        .then(response => response.json())
        .then(data => {
            // Cargar los datos del producto en el modal de edición
            document.getElementById('editCodigo').value = data.codigo;
            document.getElementById('editNombre').value = data.nombre;
            document.getElementById('editTalla').value = data.talla;
            document.getElementById('editPrecio').value = data.precio;
            document.getElementById('editEmailCreador').value = data.email_creador;

            // Mostrar el modal
            new bootstrap.Modal(document.getElementById('editProductModal')).show();
        })
        .catch(error => console.error('Error al cargar producto para editar:', error));
}

// Actualizar producto
function updateProduct() {
    const id = document.getElementById('editCodigo').value; // Aquí usamos el código como id
    const codigo = document.getElementById('editCodigo').value;
    const nombre = document.getElementById('editNombre').value;
    const talla = document.getElementById('editTalla').value;
    const precio = document.getElementById('editPrecio').value;
    const email_creador = document.getElementById('editEmailCreador').value;

    const productData = {
        id,
        codigo,
        nombre,
        talla,
        precio,
        email_creador
    };

    fetch('api.php', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
    })
        .then(response => response.json())
        .then(data => {
            alert(data.message); // Mensaje de éxito
            loadProducts(); // Recargar la lista de productos
            document.getElementById('editProductForm').reset(); // Limpiar el formulario
            new bootstrap.Modal(document.getElementById('editProductModal')).hide(); // Cerrar modal
        })
        .catch(error => console.error('Error al actualizar producto:', error));
}

// Eliminar un producto
function deleteProduct(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
        fetch(`api.php?id=${id}`, {
            method: 'DELETE',
        })
            .then(response => response.json())
            .then(data => {
                alert(data.message); // Mensaje de éxito
                loadProducts(); // Recargar la lista de productos
            })
            .catch(error => console.error('Error al eliminar producto:', error));
    }
}