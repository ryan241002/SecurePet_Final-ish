<?php
require_once 'security_headers.php';
require_once 'csrf_validate.php';
require_once 'connect.php';

session_start();

// Add CSRF validation
if (!validateCSRFToken()) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid CSRF token'
    ]);
    exit;
}

// Check if the user is logged in
if (!isset($_SESSION['User_ID'])) {
    die("You must be logged in to register a pet.");
}

// Define upload directory using XAMPP path structure
$uploadDir = $_SERVER['DOCUMENT_ROOT'] . '/your-project-folder/uploads/';

// Create directory if it doesn't exist
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Set header to return JSON
    header('Content-Type: application/json');
    
    try {
        // Collect form data
        $petName = trim($_POST['pet_name']);
        $category = $_POST['category'];
        $age = intval($_POST['age']);
        $description = isset($_POST['description']) ? trim($_POST['description']) : null;
        $sex = $_POST['sex'];

        // Input validation
        if (empty($petName) || empty($category) || empty($age) || empty($sex)) {
            throw new Exception("All required fields must be filled out.");
        }

        // Handle file upload
        $photoPath = null;
        if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
            $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
            $fileType = $_FILES['photo']['type'];
            
            if (!in_array($fileType, $allowedTypes)) {
                throw new Exception("Invalid file type. Please upload a JPEG, PNG, or GIF image.");
            }
            
            // Generate unique filename
            $extension = pathinfo($_FILES['photo']['name'], PATHINFO_EXTENSION);
            $filename = uniqid() . '.' . $extension;
            $uploadPath = '../uploads/' . $filename;
            
            // Move uploaded file
            if (move_uploaded_file($_FILES['photo']['tmp_name'], $uploadPath)) {
                $photoPath = 'uploads/' . $filename;
            } else {
                throw new Exception("Failed to upload image.");
            }
        }

        // Database insertion
        $userID = $_SESSION['User_ID'];
        $stmt = $conn->prepare("INSERT INTO Pet (User_ID, Pet_Name, Category, Age, Description, Sex, Photo) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("ississs", $userID, $petName, $category, $age, $description, $sex, $photoPath);

        if ($stmt->execute()) {
            header("Location: ../html/home.html");
            exit();
        } else {
            throw new Exception("Database error: " . $stmt->error);
        }

    } catch (Exception $e) {
        echo json_encode([
            'status' => 'error',
            'message' => $e->getMessage()
        ]);
    } finally {
        if (isset($stmt)) $stmt->close();
        if (isset($conn)) $conn->close();
    }
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid request method'
    ]);
}
?>