<?php
session_start();
include_once 'connect.php';

$data = json_decode(file_get_contents('php://input'), true);
$view = $data['view'] ?? 'all';
$filters = $data['filters'] ?? [];

try {
    $query = "
        SELECT 
            pl.*,
            lpa.Description,
            p.Pet_Name,
            p.Pet_Type,
            u.Contact_Num,
            u.User_Email,
            (SELECT Image_URL FROM LostPetImages WHERE Alert_ID = lpa.Alert_ID LIMIT 1) as Image_URL
        FROM PetLocations pl
        JOIN LostPetAlert lpa ON pl.Alert_ID = lpa.Alert_ID
        JOIN Pet p ON lpa.Pet_ID = p.Pet_ID
        JOIN User u ON lpa.User_ID = u.User_ID
        WHERE 1=1
    ";

    // Add filters
    if ($view === 'my' && isset($_SESSION['User_ID'])) {
        $query .= " AND lpa.User_ID = " . $_SESSION['User_ID'];
    }

    if (!empty($filters['petType']) && $filters['petType'] !== 'all') {
        $query .= " AND p.Pet_Type = '" . $filters['petType'] . "'";
    }

    if (!empty($filters['timeFrame']) && $filters['timeFrame'] === '24') {
        $query .= " AND pl.Location_DateTime >= DATE_SUB(NOW(), INTERVAL 24 HOUR)";
    }

    if (!empty($filters['status']) && $filters['status'] !== 'all') {
        $query .= " AND pl.Location_Type = '" . ($filters['status'] === 'lost' ? 'last_known' : 'sighting') . "'";
    }

    $query .= " ORDER BY pl.Location_DateTime DESC";

    $result = $conn->query($query);
    
    if ($result) {
        $locations = array();
        while($row = $result->fetch_assoc()) {
            $locations[] = $row;
        }
        echo json_encode(['status' => 'success', 'locations' => $locations]);
    } else {
        throw new Exception("Query failed");
    }
} catch(Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?> 