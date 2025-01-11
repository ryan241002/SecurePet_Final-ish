<?php
header('Content-Type: application/json'); // Set JSON header
include 'connect.php';

try {
    $region = $_GET['region'] ?? '';
    
    $query = "SELECT * FROM vet WHERE Region = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("s", $region);
    $stmt->execute();
    $result = $stmt->get_result();
    $vets = $result->fetch_all(MYSQLI_ASSOC);
    
    echo json_encode($vets);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
