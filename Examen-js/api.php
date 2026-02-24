<?php
header('Content-Type: application/json');
$servername = "localhost";
$username = "root";  // Cambia a tu usuario de la base de datos
$password = "";      // Cambia a tu contraseña
$dbname = "tienda_ropa";

// Conectar a la base de datos
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar conexión
if ($conn->connect_error) {
    die(json_encode(["error" => "Conexión fallida: " . $conn->connect_error]));
}

// Operación que recibimos a través de GET o POST
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            // Obtener un solo producto
            $id = $_GET['id'];
            $sql = "SELECT * FROM productos WHERE id = $id";
            $result = $conn->query($sql);
            if ($result) {
                echo json_encode($result->fetch_assoc());
            } else {
                echo json_encode(["error" => "Producto no encontrado."]);
            }
        } else {
            // Obtener todos los productos
            $sql = "SELECT * FROM productos";
            $result = $conn->query($sql);
            if ($result) {
                $productos = [];
                while($row = $result->fetch_assoc()) {
                    $productos[] = $row;
                }
                echo json_encode($productos);
            } else {
                echo json_encode(["error" => "No se encontraron productos."]);
            }
        }
        break;

    case 'POST':
        // Crear producto
        $data = json_decode(file_get_contents("php://input"));
        
        // Validar datos
        if (!isset($data->codigo) || !isset($data->nombre) || !isset($data->talla) || !isset($data->precio) || !isset($data->email_creador)) {
            echo json_encode(["error" => "Faltan datos para crear el producto"]);
            break;
        }

        $codigo = $data->codigo;
        $nombre = $data->nombre;
        $talla = $data->talla;
        $precio = $data->precio;
        $email_creador = $data->email_creador;

        // Insertar producto
        $sql = "INSERT INTO productos (codigo, nombre, talla, precio, email_creador) 
                VALUES ('$codigo', '$nombre', '$talla', '$precio', '$email_creador')";
        if ($conn->query($sql) === TRUE) {
            echo json_encode(["message" => "Producto creado con éxito."]);
        } else {
            echo json_encode(["error" => "Error al crear producto: " . $conn->error]);
        }
        break;

    case 'PUT':
        // Actualizar producto
        $data = json_decode(file_get_contents("php://input"));

        if (!isset($data->id) || !isset($data->codigo) || !isset($data->nombre) || !isset($data->talla) || !isset($data->precio) || !isset($data->email_creador)) {
            echo json_encode(["error" => "Faltan datos para actualizar el producto"]);
            break;
        }

        $id = $data->id;
        $codigo = $data->codigo;
        $nombre = $data->nombre;
        $talla = $data->talla;
        $precio = $data->precio;
        $email_creador = $data->email_creador;

        // Actualizar producto
        $sql = "UPDATE productos 
                SET codigo='$codigo', nombre='$nombre', talla='$talla', precio='$precio', email_creador='$email_creador' 
                WHERE id=$id";

        if ($conn->query($sql) === TRUE) {
            echo json_encode(["message" => "Producto actualizado con éxito."]);
        } else {
            echo json_encode(["error" => "Error al actualizar producto: " . $conn->error]);
        }
        break;

    case 'DELETE':
        // Eliminar producto
        if (!isset($_GET['id'])) {
            echo json_encode(["error" => "ID del producto es requerido para eliminar"]);
            break;
        }

        $id = $_GET['id'];

        // Eliminar producto
        $sql = "DELETE FROM productos WHERE id=$id";
        if ($conn->query($sql) === TRUE) {
            echo json_encode(["message" => "Producto eliminado con éxito."]);
        } else {
            echo json_encode(["error" => "Error al eliminar producto: " . $conn->error]);
        }
        break;

    default:
        echo json_encode(["error" => "Método no soportado"]);
        break;
}

// Cerrar la conexión
$conn->close();
?>