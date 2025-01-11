<?php
session_start();
include_once 'connect.php';

if (!isset($_SESSION['User_ID'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in']);
    exit;
}

try {
    $query = "SELECT n.*, p.Pet_Name 
              FROM Notifications n
              JOIN LostPetAlert lpa ON n.Alert_ID = lpa.Alert_ID
              JOIN Pet p ON lpa.Pet_ID = p.Pet_ID
              WHERE n.User_ID = ? AND n.Is_Read = FALSE
              ORDER BY n.Created_At DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $_SESSION['User_ID']);
    $stmt->execute();
    
    $result = $stmt->get_result();
    $notifications = [];
    
    while($row = $result->fetch_assoc()) {
        $notifications[] = $row;
    }
    
    echo json_encode([
        'status' => 'success',
        'notifications' => $notifications
    ]);

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?> 