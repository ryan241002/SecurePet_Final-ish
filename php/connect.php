<?php
// Database connection details
$host = '127.0.0.1';
$username = 'root';
$password = ''; 
$database = 'securepet_database'; 

// Create connection
$conn = new mysqli($host, $username, $password, $database);

// Check the connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>