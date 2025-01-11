<?php
require_once 'security_headers.php';
require_once 'session_config.php';
require_once 'csrf_validate.php';

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Verify that this is an AJAX request
if (!isset($_SERVER['HTTP_X_REQUESTED_WITH']) || 
    strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) != 'xmlhttprequest') {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    exit;
}

// CSRF validation
if (!validateCSRFToken()) {
    http_response_code(403);
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid CSRF token'
    ]);
    exit;
}

// Clear any existing session data except CSRF token
$csrf_token = $_SESSION['csrf_token'];
session_unset();
$_SESSION['csrf_token'] = $csrf_token; // Preserve CSRF token

error_reporting(E_ALL);
ini_set('display_errors', 1);

include 'connect.php';

// Database connection
$servername = "localhost";
$username = "root";
$password = '';
$dbname = "securepet_database";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Check if email and password were received
    if (!isset($_POST['email']) || !isset($_POST['password'])) {
        echo "Email or password not received";
        exit();
    }

    // Get input values
    $email = $_POST['email'];
    $password = $_POST['password'];

    // Prepare and execute query
    $stmt = $conn->prepare("SELECT User_ID, First_Name, Last_Name, Password_Hash, Status FROM User WHERE User_Email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($password, $user['Password_Hash'])) {
        if ($user['Status'] !== 'Active') {
            echo json_encode(['status' => 'error', 'message' => 'Account is deactivated.']);
            exit();
        }

        // Set session variables
        $_SESSION['User_ID'] = $user['User_ID'];
        $_SESSION['First_Name'] = $user['First_Name'];
        $_SESSION['Last_Name'] = $user['Last_Name'];
        $_SESSION['last_activity'] = time();

        // Regenerate session ID to prevent session fixation
        session_regenerate_id(true);

        echo json_encode([
            'status' => 'success',
            'message' => 'Welcome, ' . $_SESSION['First_Name'] . '!',
            'redirect' => 'home.html'
        ]);
        exit();
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid email or password.']);
        exit();
    }

} catch(PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database Error: ' . $e->getMessage()]);
    exit();
}

$conn = null;
?> 