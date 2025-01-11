<?php
require_once 'connect.php';

require_once 'security_headers.php';
require_once 'csrf_validate.php';

header('Content-Type: application/json');

// Validate CSRF token
if (!validateCSRFToken()) {
    $form_token = isset($_POST['csrf_token']) ? $_POST['csrf_token'] : 'not set';
    $header_token = isset($_SERVER['HTTP_X_CSRF_TOKEN']) ? $_SERVER['HTTP_X_CSRF_TOKEN'] : 'not set';
    
    error_log("CSRF Validation Failed - Form Token: $form_token, Header Token: $header_token");
    
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid CSRF token',
        'debug' => [
            'form_token' => $form_token,
            'header_token' => $header_token
        ]
    ]);
    exit;
}

// Prevent direct access
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    exit;
}

// Verify CSRF token
if (!isset($_POST['csrf_token']) || empty($_POST['csrf_token'])) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid CSRF token']);
    exit;
}

// Validate required fields
$required_fields = ['name', 'surname', 'email', 'password', 'confirm_password', 'contact_number', 'address'];
foreach ($required_fields as $field) {
    if (!isset($_POST[$field]) || empty($_POST[$field])) {
        echo json_encode(['status' => 'error', 'message' => 'All fields are required']);
        exit;
    }
}

// Sanitize inputs
$first_name = filter_var(trim($_POST['name']), FILTER_SANITIZE_STRING);
$last_name = filter_var(trim($_POST['surname']), FILTER_SANITIZE_STRING);
$email = filter_var(trim($_POST['email']), FILTER_SANITIZE_EMAIL);
$password = $_POST['password'];
$confirm_password = $_POST['confirm_password'];
$contact_num = filter_var(trim($_POST['contact_number']), FILTER_SANITIZE_STRING);
$location = filter_var(trim($_POST['address']), FILTER_SANITIZE_STRING);

// Validate email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid email format']);
    exit;
}

// Validate password match
if ($password !== $confirm_password) {
    echo json_encode(['status' => 'error', 'message' => 'Passwords do not match']);
    exit;
}

// Validate password strength
if (strlen($password) < 8 || 
    !preg_match('/[A-Z]/', $password) || 
    !preg_match('/[a-z]/', $password) || 
    !preg_match('/[0-9]/', $password) || 
    !preg_match('/[!@#$%^&*(),.?":{}|<>]/', $password)) {
    echo json_encode(['status' => 'error', 'message' => 'Password does not meet security requirements']);
    exit;
}

// Database operations using MySQLi instead of PDO
try {
    // Check if email already exists
    $check_existing = $conn->prepare("SELECT User_Email FROM User WHERE User_Email = ?");
    $check_existing->bind_param("s", $email);
    $check_existing->execute();
    $result = $check_existing->get_result();
    
    if ($result->num_rows > 0) {
        echo json_encode(['status' => 'error', 'message' => 'Email already registered']);
        exit;
    }
    
    // Hash password
    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    
    // Insert new user
    $stmt = $conn->prepare("
        INSERT INTO User (
            First_Name, 
            Last_Name, 
            User_Email, 
            Password_Hash, 
            Contact_Num, 
            Location, 
            Role, 
            Status
        ) VALUES (?, ?, ?, ?, ?, ?, 'User', 'Active')
    ");
    
    $stmt->bind_param("ssssss", 
        $first_name,
        $last_name,
        $email,
        $password_hash,
        $contact_num,
        $location
    );
    
    if ($stmt->execute()) {
        // Get the newly created user's ID
        $user_id = $stmt->insert_id;
        
        // Start the session if not already started
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        // Set the user ID in the session
        $_SESSION['User_ID'] = $user_id;
        
        echo json_encode(['status' => 'success', 'message' => 'Registration successful']);
    } else {
        throw new Exception("Error executing statement");
    }

} catch (Exception $e) {
    error_log($e->getMessage());
    echo json_encode(['status' => 'error', 'message' => 'Registration failed. Please try again later.']);
}

// Close the statement and connection
if (isset($stmt)) $stmt->close();
if (isset($check_existing)) $check_existing->close();
$conn->close();
?>
