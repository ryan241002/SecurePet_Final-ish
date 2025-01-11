<?php
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', 1);
session_start();
include 'connect.php';

// Add debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

if (!isset($_SESSION['User_ID'])) {
    echo json_encode(['status' => 'error', 'message' => 'User not logged in']);
    exit;
}

$user_id = $_SESSION['User_ID'];

try {
    // Updated query to match your exact table structure
    $stmt = $conn->prepare("SELECT p.Pet_Name, p.Age, p.Category, p.Sex, p.Description, p.Photo, u.Location 
                           FROM Pet p
                           JOIN User u ON p.User_ID = u.User_ID 
                           WHERE p.User_ID = ?
                           LIMIT 1");  // Added LIMIT 1 to get just one pet
    
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param("i", $user_id);
    
    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }
    
    $result = $stmt->get_result();
    
    if ($pet = $result->fetch_assoc()) {
        echo json_encode([
            'status' => 'success',
            'data' => [
                'pet_name' => $pet['Pet_Name'],
                'location' => $pet['Location'],    // From User table
                'age' => $pet['Age'],
                'category' => $pet['Category'],    // This is your ENUM('Dog', 'Cat', 'Other')
                'sex' => $pet['Sex'],             // This is your ENUM('Male', 'Female')
                'description' => $pet['Description'],
                'photo' => $pet['Photo']
            ]
        ]);
    } else {
        // No pet found for this user
        echo json_encode([
            'status' => 'error', 
            'message' => 'No pet found for this user',
            'debug_info' => [
                'user_id' => $user_id
            ]
        ]);
    }
} catch (Exception $e) {
    error_log("Error in fetch_pet_data.php: " . $e->getMessage());
    echo json_encode([
        'status' => 'error', 
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

if (isset($stmt)) {
    $stmt->close();
}
$conn->close();
?>