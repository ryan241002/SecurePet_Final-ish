<?php
session_start();
include 'connect.php';

if (!isset($_SESSION['User_ID'])) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

// Get Pet_ID for the current user
$stmt = $conn->prepare("SELECT Pet_ID FROM Pet WHERE User_ID = ?");
$stmt->bind_param("i", $_SESSION['User_ID']);
$stmt->execute();
$result = $stmt->get_result();
$pet = $result->fetch_assoc();

if (!$pet) {
    echo json_encode(['success' => false, 'message' => 'No pet found']);
    exit;
}

$pet_id = $pet['Pet_ID'];
$uploadDir = '../uploads/gallery/';

if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$response = ['success' => true, 'files' => []];

if (isset($_FILES['photos'])) {
    foreach ($_FILES['photos']['tmp_name'] as $key => $tmp_name) {
        if ($_FILES['photos']['error'][$key] === UPLOAD_ERR_OK) {
            $fileSize = $_FILES['photos']['size'][$key];
            $fileType = $_FILES['photos']['type'][$key];
            
            // Validate file size (15MB max)
            if ($fileSize > 15 * 1024 * 1024) {
                $response['files'][] = [
                    'name' => $_FILES['photos']['name'][$key],
                    'success' => false,
                    'message' => 'File too large (max 15MB)'
                ];
                continue;
            }
            
            // Validate file type
            if (!in_array($fileType, ['image/jpeg', 'image/png', 'image/gif'])) {
                $response['files'][] = [
                    'name' => $_FILES['photos']['name'][$key],
                    'success' => false,
                    'message' => 'Invalid file type'
                ];
                continue;
            }
            
            $filename = uniqid() . '_' . $_FILES['photos']['name'][$key];
            $filepath = $uploadDir . $filename;
            
            if (move_uploaded_file($tmp_name, $filepath)) {
                // Insert into database
                $relativeFilepath = 'uploads/gallery/' . $filename;
                $stmt = $conn->prepare("INSERT INTO PetGallery (Pet_ID, Photo_Path) VALUES (?, ?)");
                $stmt->bind_param("is", $pet_id, $relativeFilepath);
                
                if ($stmt->execute()) {
                    $response['files'][] = [
                        'name' => $_FILES['photos']['name'][$key],
                        'success' => true,
                        'path' => $relativeFilepath
                    ];
                } else {
                    $response['files'][] = [
                        'name' => $_FILES['photos']['name'][$key],
                        'success' => false,
                        'message' => 'Database error'
                    ];
                }
            }
        }
    }
}

echo json_encode($response);
?> 