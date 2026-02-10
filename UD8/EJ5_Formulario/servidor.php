<?php
// servidor.php
// Gestión básica de un archivo JSON con alumnos.
// Endpoints (via action GET/POST):
// - action=list        [GET]   -> devuelve { success: true, data: [...] }
// - action=save        [POST]  -> recibe JSON { alumnos: [...] } en body -> guarda
// - action=download    [GET]   -> fuerza descarga del fichero JSON
// - action=uploadFile  [POST]  -> recibe file en 'file' y devuelve parsed data
// - action=delete_all  [POST]  -> vacía el fichero

header('Access-Control-Allow-Origin: *'); // si lo necesitas, quita si no
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

$action = isset($_GET['action']) ? $_GET['action'] : '';

$dataFile = __DIR__ . DIRECTORY_SEPARATOR . 'alumnos_db.json';

// crear fichero si no existe
if (!file_exists($dataFile)) {
    file_put_contents($dataFile, json_encode([], JSON_PRETTY_PRINT));
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

switch ($action) {
    case 'list':
        $content = @file_get_contents($dataFile);
        if ($content === false) {
            respondJson(false, 'No se puede leer el fichero', []);
        } else {
            $arr = json_decode($content, true);
            if (!is_array($arr)) $arr = [];
            respondJson(true, 'Datos obtenidos', $arr);
        }
        break;

    case 'save':
        $raw = file_get_contents('php://input');
        $json = json_decode($raw, true);
        if ($json === null) {
            respondJson(false, 'JSON inválido en body');
        } else {
            // Esperamos alumnos o directamente un array
            $toSave = [];
            if (isset($json['alumnos']) && is_array($json['alumnos'])) $toSave = $json['alumnos'];
            else if (is_array($json)) {
                // si es una estructura con clave alumnos o directamente un array
                if (array_keys($json) === range(0, count($json) - 1)) {
                    // array indexado
                    $toSave = $json;
                } else {
                    // objeto con otras claves -> intentar encontrar alumnos
                    if (isset($json['data']) && is_array($json['data'])) $toSave = $json['data'];
                    else if (isset($json['alumnos']) && is_array($json['alumnos'])) $toSave = $json['alumnos'];
                    else $toSave = $json;
                }
            }
            $written = @file_put_contents($dataFile, json_encode($toSave, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
            if ($written === false) {
                respondJson(false, 'No se pudo escribir el fichero');
            } else {
                respondJson(true, 'Guardado OK');
            }
        }
        break;

    case 'download':
        if (!file_exists($dataFile)) {
            http_response_code(404);
            echo "[]";
            exit;
        }
        header('Content-Type: application/json; charset=utf-8');
        header('Content-Disposition: attachment; filename="alumnos_db.json"');
        readfile($dataFile);
        exit;
        break;

    case 'uploadFile':
        if (!isset($_FILES['file'])) {
            respondJson(false, 'No se recibió archivo');
        }
        $file = $_FILES['file'];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            respondJson(false, 'Error en la subida: ' . $file['error']);
        }
        $content = file_get_contents($file['tmp_name']);
        $parsed = json_decode($content, true);
        if ($parsed === null) {
            respondJson(false, 'El archivo no contiene JSON válido');
        }
        // si es objeto y contiene 'alumnos' o 'data' usamos eso
        if (!is_array($parsed)) {
            respondJson(false, 'Formato JSON inesperado');
        }
        if (isset($parsed['alumnos']) && is_array($parsed['alumnos'])) $out = $parsed['alumnos'];
        else if (isset($parsed['data']) && is_array($parsed['data'])) $out = $parsed['data'];
        else if (array_keys($parsed) === range(0, count($parsed) - 1)) $out = $parsed;
        else $out = [$parsed];

        respondJson(true, 'Archivo procesado', $out);
        break;

    case 'delete_all':
        $written = @file_put_contents($dataFile, json_encode([], JSON_PRETTY_PRINT), LOCK_EX);
        if ($written === false) respondJson(false, 'No se pudo vaciar el fichero');
        respondJson(true, 'Fichero vaciado');
        break;

    default:
        respondJson(false, 'Action no especificada o desconocida');
        break;
}

function respondJson($success, $msg = '', $data = null) {
    header('Content-Type: application/json; charset=utf-8');
    $resp = ['success' => $success, 'message' => $msg];
    if ($data !== null) $resp['data'] = $data;
    echo json_encode($resp, JSON_UNESCAPED_UNICODE);
    exit;
}