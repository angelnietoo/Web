<?php
// servidor.php — CRUD MySQL con PDO para productos

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

// Verificar si la solicitud se hace desde localhost o desde el entorno de desarrollo local
if ($_SERVER['SERVER_ADDR'] == '127.0.0.1' || $_SERVER['SERVER_ADDR'] == 'localhost') {
    respondJson(false, 'Este servicio solo está disponible en el servidor, no se puede acceder localmente.');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$action = $_GET['action'] ?? '';

/* =========================
   CONEXIÓN A MYSQL (XAMPP)
   ========================= */
try {
    $pdo = new PDO(
        "mysql:host=localhost;dbname=tienda_ropa;charset=utf8mb4",  // Cambia a tu base de datos
        "root",  // Cambia a tu usuario de base de datos
        "root",  // Cambia a tu contraseña
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
} catch (PDOException $e) {
    respondJson(false, 'Error de conexión a MySQL');
}

/* =========================
   ACCIONES CRUD
   ========================= */
switch ($action) {

    /* ===== LISTAR ===== */
    case 'list':
        $stmt = $pdo->query("SELECT * FROM productos ORDER BY id DESC");
        respondJson(true, 'Datos obtenidos', $stmt->fetchAll());
        break;

    /* ===== INSERTAR ===== */
    case 'save':
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data) respondJson(false, 'JSON inválido');

        // Insertar un producto
        $sql = "INSERT INTO productos (codigo, nombre, talla, precio, email_creador)
                VALUES (?, ?, ?, ?, ?)";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $data['codigo'],
            $data['nombre'],
            $data['talla'],
            $data['precio'],
            $data['email_creador']
        ]);

        respondJson(true, 'Producto insertado');
        break;

    /* ===== ACTUALIZAR ===== */
    case 'update':
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data || empty($data['id'])) respondJson(false, 'Datos inválidos');

        // Actualizar producto
        $sql = "UPDATE productos SET
                    codigo=?,
                    nombre=?,
                    talla=?,
                    precio=?,
                    email_creador=?
                WHERE id=?";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $data['codigo'],
            $data['nombre'],
            $data['talla'],
            $data['precio'],
            $data['email_creador'],
            $data['id']
        ]);

        respondJson(true, 'Producto actualizado');
        break;

    /* ===== BORRAR ===== */
    case 'delete':
        $id = $_GET['id'] ?? null;
        if (!$id) respondJson(false, 'ID no recibido');

        $stmt = $pdo->prepare("DELETE FROM productos WHERE id=?");
        $stmt->execute([$id]);

        respondJson(true, 'Producto eliminado');
        break;

    default:
        respondJson(false, 'Acción no válida');
}

/* =========================
   RESPUESTA JSON
   ========================= */
function respondJson($success, $msg = '', $data = null) {
    header('Content-Type: application/json; charset=utf-8');
    $resp = ['success' => $success, 'message' => $msg];
    if ($data !== null) $resp['data'] = $data;
    echo json_encode($resp, JSON_UNESCAPED_UNICODE);
    exit;
}