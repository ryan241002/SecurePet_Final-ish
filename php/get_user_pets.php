<?php
header('Content-Type: application/json');
include 'connect.php';
session_start();

if (!isset($_SESSION['User_ID'])) {
    echo json_encode(['error' => 'User not logged in']);
    exit;
}

try {
    $userId = $_SESSION['User_ID'];
    $query = "SELECT Pet_ID, Pet_Name, Category, Description FROM Pet WHERE User_ID = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $pet = $result->fetch_assoc();
    
    echo json_encode($pet);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
