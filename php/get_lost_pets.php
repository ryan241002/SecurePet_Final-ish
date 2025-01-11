<?php
session_start();
include_once 'connect.php';

try {
    $query = "
        SELECT 
            lpa.Alert_ID,
            lpa.Location,
            lpa.Description,
            lpa.Alert_DateTime,
            lpa.Status,
            u.First_Name,
            u.Contact_Num as Phone,
            u.User_Email as Username,
            p.Pet_Name,
            GROUP_CONCAT(lpi.Image_URL) as Images
        FROM LostPetAlert lpa
        JOIN User u ON lpa.User_ID = u.User_ID
        JOIN Pet p ON lpa.Pet_ID = p.Pet_ID
        LEFT JOIN LostPetImages lpi ON lpa.Alert_ID = lpi.Alert_ID
        WHERE lpa.Status = 'Active'
        GROUP BY lpa.Alert_ID
        ORDER BY lpa.Alert_DateTime DESC
    ";
    
    $result = $conn->query($query);
    
    if ($result) {
        $pets = array();
        while($row = $result->fetch_assoc()) {
            // Convert comma-separated image URLs to array
            $row['Images'] = $row['Images'] ? explode(',', $row['Images']) : [];
            $pets[] = $row;
        }
        echo json_encode(['status' => 'success', 'data' => $pets]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Query failed']);
    }
} catch(Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?> 