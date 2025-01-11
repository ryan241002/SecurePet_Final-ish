<?php
session_start();
include_once 'connect.php';

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Check if user is logged in using the same session variable as check_session.php
if (!isset($_SESSION['User_ID'])) {  // Changed from user_id to User_ID
    echo json_encode(['status' => 'error', 'message' => 'User must be logged in']);
    exit;
}

// Parse JSON data
$rawData = file_get_contents('php://input');
$data = json_decode($rawData, true);

// Validate required fields
if (!isset($data['alert_id']) || !isset($data['location']) || !isset($data['details'])) {
    echo json_encode([
        'status' => 'error', 
        'message' => 'Missing required fields',
        'received' => $data
    ]);
    exit;
}

try {
    // Start transaction
    $conn->begin_transaction();

    // Insert sighting report
    $query = "INSERT INTO SightingReport (Alert_ID, User_ID, Location, Description) 
              VALUES (?, ?, ?, ?)";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("iiss", 
        $data['alert_id'],
        $_SESSION['User_ID'],
        $data['location'],
        $data['details']
    );
    
    $stmt->execute();

    // Get pet owner's ID and pet details
    $petQuery = "SELECT lpa.User_ID, p.Pet_Name 
                 FROM LostPetAlert lpa 
                 JOIN Pet p ON lpa.Pet_ID = p.Pet_ID 
                 WHERE lpa.Alert_ID = ?";
    
    $petStmt = $conn->prepare($petQuery);
    $petStmt->bind_param("i", $data['alert_id']);
    $petStmt->execute();
    $petResult = $petStmt->get_result();
    $petData = $petResult->fetch_assoc();

    // Create notification for pet owner
    $notifyQuery = "INSERT INTO Notifications (User_ID, Alert_ID, Message, Type) 
                    VALUES (?, ?, ?, 'sighting')";
    
    $message = "Someone reported seeing your pet " . $petData['Pet_Name'] . " at " . $data['location'];
    
    $notifyStmt = $conn->prepare($notifyQuery);
    $notifyStmt->bind_param("iis", 
        $petData['User_ID'],
        $data['alert_id'],
        $message
    );
    
    $notifyStmt->execute();

    // Commit transaction
    $conn->commit();

    echo json_encode([
        'status' => 'success', 
        'message' => 'Sighting report submitted successfully'
    ]);

} catch (Exception $e) {
    // Rollback on error
    $conn->rollback();
    echo json_encode([
        'status' => 'error', 
        'message' => $e->getMessage()
    ]);
}

// Close the statement and connection
if (isset($stmt)) {
    $stmt->close();
}
$conn->close();
?> 