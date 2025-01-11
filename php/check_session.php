<?php
require_once 'security_headers.php';
require_once 'session_config.php';

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');

// Check if all required session variables exist
if (!isset($_SESSION['User_ID']) || !isset($_SESSION['First_Name'])) {
    session_destroy();
    echo json_encode([
        'status' => 'error',
        'message' => 'Session invalid'
    ]);
    exit();
}

// Optional: Check for session timeout
$timeout = 30 * 60; // 30 minutes
if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > $timeout)) {
    session_destroy();
    echo json_encode([
        'status' => 'error',
        'message' => 'Session expired'
    ]);
    exit();
}

// Update last activity time
$_SESSION['last_activity'] = time();

// Session is valid
echo json_encode([
    'status' => 'success',
    'userId' => $_SESSION['User_ID'],
    'firstName' => $_SESSION['First_Name']
]);
exit();
?>