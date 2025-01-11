<?php
// Error reporting - comment these out in production
error_reporting(E_ALL);
ini_set('display_errors', 0); // Set to 0 to prevent HTML errors from being sent

// Security headers
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', 1);
session_start();

// Set JSON header before any output
header('Content-Type: application/json');

// Include database connection
require_once 'connect.php';
require_once 'security_headers.php';

// Check authentication
if (!isset($_SESSION['User_ID'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not authenticated']);
    exit;
}

try {
    $user_id = $_SESSION['User_ID'];
    
    // Check if we're updating just the Description (bio)
    if (isset($_POST['Description']) && count($_POST) === 1) {
        $description = filter_var($_POST['Description'], FILTER_SANITIZE_STRING);
        
        $stmt = $conn->prepare("
            UPDATE Pet 
            SET Description = ?
            WHERE User_ID = ?
        ");
        
        $stmt->bind_param("si", $description, $user_id);
        
        if ($stmt->execute()) {
            echo json_encode(['status' => 'success']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to update description']);
        }
        
        $stmt->close();
        $conn->close();
        exit;
    }
    
    // Full pet update logic
    if (isset($_POST['Pet_Name'], $_POST['Category'], $_POST['Sex'])) {
        // Validate inputs
        $pet_name = filter_var($_POST['Pet_Name'], FILTER_SANITIZE_STRING);
        $category = filter_var($_POST['Category'], FILTER_SANITIZE_STRING);
        $age = filter_var($_POST['Age'], FILTER_VALIDATE_INT);
        $sex = filter_var($_POST['Sex'], FILTER_SANITIZE_STRING);
        
        // Validate category and sex enums
        if (!in_array($category, ['Dog', 'Cat', 'Other'])) {
            throw new Exception('Invalid category');
        }
        if (!in_array($sex, ['Male', 'Female'])) {
            throw new Exception('Invalid sex');
        }
        
        // Start transaction
        $conn->begin_transaction();
        
        try {
            // Update pet information
            $stmt = $conn->prepare("
                UPDATE Pet 
                SET Pet_Name = ?, 
                    Category = ?, 
                    Age = ?, 
                    Sex = ?
                WHERE User_ID = ?
            ");
            
            $stmt->bind_param("ssisi", 
                $pet_name, 
                $category, 
                $age, 
                $sex,
                $user_id
            );
            
            if (!$stmt->execute()) {
                throw new Exception('Failed to update pet information');
            }
            
            // Update user location if provided
            if (isset($_POST['Location']) && !empty($_POST['Location'])) {
                $location = filter_var($_POST['Location'], FILTER_SANITIZE_STRING);
                $stmt2 = $conn->prepare("UPDATE User SET Location = ? WHERE User_ID = ?");
                $stmt2->bind_param("si", $location, $user_id);
                if (!$stmt2->execute()) {
                    throw new Exception('Failed to update location');
                }
            }
            
            $conn->commit();
            echo json_encode(['status' => 'success']);
            
        } catch (Exception $e) {
            $conn->rollback();
            throw $e;
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
    }
    
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($stmt2)) $stmt2->close();
    if (isset($conn)) $conn->close();
}
?> 