<?php
require_once 'session_config.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function validateCSRFToken() {
    // Get the token from the POST data
    $form_token = isset($_POST['csrf_token']) ? $_POST['csrf_token'] : '';
    
    // Get the token from the header
    $header_token = isset($_SERVER['HTTP_X_CSRF_TOKEN']) ? $_SERVER['HTTP_X_CSRF_TOKEN'] : '';
    
    // Debug logging
    error_log("Form token received: " . $form_token);
    error_log("Header token received: " . $header_token);
    
    // Check if both tokens exist and match
    if (!empty($form_token) && !empty($header_token)) {
        return hash_equals($form_token, $header_token);
    }
    
    return false;
}

// Add endpoint functionality for AJAX requests
if ($_SERVER['REQUEST_METHOD'] === 'GET' && basename($_SERVER['PHP_SELF']) === 'csrf_validate.php') {
    header('Content-Type: application/json');
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    echo json_encode(['csrf_token' => $_SESSION['csrf_token']]);
    exit;
} 