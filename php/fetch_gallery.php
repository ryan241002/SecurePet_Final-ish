<?php
session_start();
require_once 'connect.php';
require_once 'security_headers.php';

if (!isset($_SESSION['User_ID'])) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

try {
    // Get Pet_ID for the current user
    $stmt = $conn->prepare("
        SELECT g.Photo_Path 
        FROM PetGallery g
        JOIN Pet p ON g.Pet_ID = p.Pet_ID
        WHERE p.User_ID = ?
        ORDER BY g.Upload_Date DESC
        LIMIT 10
    ");

    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }

    $stmt->bind_param("i", $_SESSION['User_ID']);
    
    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }
    
    $result = $stmt->get_result();

    $images = [];
    while ($row = $result->fetch_assoc()) {
        // Remove the 'uploads/gallery/' prefix if it exists
        $imagePath = str_replace('uploads/gallery/', '', $row['Photo_Path']);
        $images[] = $imagePath;
    }

    echo json_encode(['success' => true, 'images' => $images]);

} catch (Exception $e) {
    error_log("Error in fetch_gallery.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error fetching gallery images']);
}

$stmt->close();
$conn->close();
?> 