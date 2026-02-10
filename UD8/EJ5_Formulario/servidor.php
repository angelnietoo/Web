<?php
// servidor.php — CRUD MySQL con PDO

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

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
        "mysql:host=localhost;dbname=crud_alumnos;charset=utf8mb4",
        "root",
        "",
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
        $stmt = $pdo->query("SELECT * FROM alumnos ORDER BY id DESC");
        respondJson(true, 'Datos obtenidos', $stmt->fetchAll());
        break;

    /* ===== INSERTAR ===== */
    case 'save':
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data) respondJson(false, 'JSON inválido');

        $sql = "INSERT INTO alumnos
                (nombre, apellidos, edad, nota, movil, idioma, repetidor)
                VALUES (?, ?, ?, ?, ?, ?, ?)";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $data['nombre'],
            $data['apellidos'],
            $data['edad'],
            $data['nota'],
            $data['movil'],
            $data['idiomas'] ?? null,
            !empty($data['repetidor']) ? 1 : 0
        ]);

        respondJson(true, 'Alumno insertado');
        break;

    /* ===== ACTUALIZAR ===== */
    case 'update':
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data || empty($data['id'])) respondJson(false, 'Datos inválidos');

        $sql = "UPDATE alumnos SET
                    nombre=?,
                    apellidos=?,
                    edad=?,
                    nota=?,
                    movil=?,
                    idioma=?,
                    repetidor=?
                WHERE id=?";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $data['nombre'],
            $data['apellidos'],
            $data['edad'],
            $data['nota'],
            $data['movil'],
            $data['idiomas'] ?? null,
            !empty($data['repetidor']) ? 1 : 0,
            $data['id']
        ]);

        respondJson(true, 'Alumno actualizado');
        break;

    /* ===== BORRAR ===== */
    case 'delete':
        $id = $_GET['id'] ?? null;
        if (!$id) respondJson(false, 'ID no recibido');

        $stmt = $pdo->prepare("DELETE FROM alumnos WHERE id=?");
        $stmt->execute([$id]);

        respondJson(true, 'Alumno eliminado');
        break;

    default:
        respondJson(false, 'Action no válida');
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
