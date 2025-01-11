<?php
header('Content-Type: application/json');
include 'connect.php';
session_start();

if (!isset($_SESSION['User_ID'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

try {
    // Get and validate form data
    $vetId = filter_input(INPUT_POST, 'vet_id', FILTER_VALIDATE_INT);
    $petId = filter_input(INPUT_POST, 'pet_id', FILTER_VALIDATE_INT);
    $userId = $_SESSION['User_ID'];
    $date = $_POST['date'];
    $time = $_POST['time'];
    $issue = $_POST['issue'];

    // Validate vet exists
    $checkVet = "SELECT Vet_ID FROM vet WHERE Vet_ID = ?";
    $checkStmt = $conn->prepare($checkVet);
    $checkStmt->bind_param("i", $vetId);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid veterinarian ID']);
        exit;
    }

    // Create appointment times
    $appStart = $date . ' ' . $time;
    $appEnd = date('Y-m-d H:i:s', strtotime($appStart . ' +1 hour'));

    // Check for overlapping appointments
    $checkQuery = "SELECT COUNT(*) as count FROM booking 
                  WHERE Vet_ID = ? AND 
                  ((App_Start BETWEEN ? AND ?) OR 
                   (App_End BETWEEN ? AND ?))";
    
    $checkStmt = $conn->prepare($checkQuery);
    $checkStmt->bind_param("issss", $vetId, $appStart, $appEnd, $appStart, $appEnd);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    $row = $result->fetch_assoc();

    if ($row['count'] > 0) {
        echo json_encode(['success' => false, 'message' => 'This time slot is already booked']);
        exit;
    }

    // Insert the booking
    $query = "INSERT INTO booking (Vet_ID, User_ID, Pet_ID, App_Start, App_End, Issue) 
              VALUES (?, ?, ?, ?, ?, ?)";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("iiisss", $vetId, $userId, $petId, $appStart, $appEnd, $issue);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Appointment booked successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to book appointment: ' . $stmt->error]);
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>
