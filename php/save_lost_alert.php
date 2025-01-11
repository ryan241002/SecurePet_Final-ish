<?php
session_start();
require_once 'connect.php';

// Debug logging
error_log("Starting save_lost_alert.php");
error_log("Session data: " . print_r($_SESSION, true));

// Check if user is logged in and verify user exists in database
if (!isset($_SESSION['User_ID'])) {
    error_log("No User_ID in session");
    echo json_encode(['success' => false, 'error' => 'User not logged in']);
    exit;
}

$user_id = $_SESSION['User_ID'];

// Verify user exists and is active
$stmt = $conn->prepare("SELECT User_ID, Status FROM User WHERE User_ID = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

if (!$user) {
    error_log("User ID {$user_id} not found in database");
    echo json_encode(['success' => false, 'error' => 'User not found']);
    exit;
}

if ($user['Status'] !== 'Active') {
    error_log("User ID {$user_id} account is not active");
    echo json_encode(['success' => false, 'error' => 'Account is not active']);
    exit;
}

// Get pet ID from the database
$stmt = $conn->prepare("SELECT Pet_ID FROM Pet WHERE User_ID = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$pet = $result->fetch_assoc();

if (!$pet) {
    error_log("No pet found for User ID {$user_id}");
    echo json_encode(['success' => false, 'error' => 'No pet found']);
    exit;
}

$pet_id = $pet['Pet_ID'];
$description = $_POST['description'] ?? '';

// Get user's location from User table
$stmt = $conn->prepare("SELECT Location FROM User WHERE User_ID = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$userData = $result->fetch_assoc();
$location = $userData['Location'] ?? 'Unknown Location';

// Create images directory if it doesn't exist
$uploadDir = $_SERVER['DOCUMENT_ROOT'] . '/securepet/uploads/lost_pets/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// Function to generate unique filename
function generateUniqueFileName($originalName) {
    $extension = pathinfo($originalName, PATHINFO_EXTENSION);
    return uniqid() . '_' . time() . '.' . $extension;
}

try {
    // Start transaction
    $conn->begin_transaction();

    // Insert into LostPetAlert table
    $stmt = $conn->prepare("INSERT INTO LostPetAlert (User_ID, Pet_ID, Location, Description) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("iiss", $user_id, $pet_id, $location, $description);

    if (!$stmt->execute()) {
        throw new Exception("Failed to create alert: " . $conn->error);
    }

    $alert_id = $conn->insert_id;
    $uploaded_files = [];

    // Handle multiple photo uploads
    for ($i = 0; isset($_FILES["photo_$i"]); $i++) {
        $photo = $_FILES["photo_$i"];
        
        if ($photo['error'] === UPLOAD_ERR_OK) {
            // Generate unique filename
            $fileName = generateUniqueFileName($photo['name']);
            $targetPath = $uploadDir . $fileName;

            // Move uploaded file
            if (move_uploaded_file($photo['tmp_name'], $targetPath)) {
                // Insert image record
                $imageStmt = $conn->prepare("INSERT INTO LostPetImages (Alert_ID, Image_URL) VALUES (?, ?)");
                $imageStmt->bind_param("is", $alert_id, $fileName);
                
                if (!$imageStmt->execute()) {
                    throw new Exception("Failed to save image record: " . $conn->error);
                }

                $uploaded_files[] = $fileName;
                error_log("Successfully uploaded image: $fileName");
            } else {
                error_log("Failed to move uploaded file: " . $photo['name']);
                throw new Exception("Failed to save image file");
            }
        } else if ($photo['error'] !== UPLOAD_ERR_NO_FILE) {
            error_log("Upload error for photo_$i: " . $photo['error']);
            throw new Exception("Error uploading file");
        }
    }

    // Commit transaction
    $conn->commit();

    error_log("Successfully created lost pet alert for User ID {$user_id}");
    echo json_encode([
        'success' => true,
        'message' => 'Alert created successfully',
        'alert_id' => $alert_id,
        'uploaded_files' => $uploaded_files
    ]);

} catch (Exception $e) {
    // Rollback transaction on error
    $conn->rollback();
    error_log("Exception when creating alert: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}

$stmt->close();
$conn->close();
?> 