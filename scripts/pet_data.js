document.addEventListener("DOMContentLoaded", function () {
    // Check if checkAuth is available
    if (typeof window.checkAuth === 'undefined') {
        console.error('Auth check function not loaded');
        return;
    }

    console.log("Starting auth check...");
    
    // Now use checkAuth
    window.checkAuth().then(() => {
        console.log("Auth check passed, fetching pet data...");
        
        fetch('../php/fetch_pet_data.php')
            .then(response => {
                console.log("Raw fetch response:", response);
                return response.json();
            })
            .then(data => {
                console.log("Received pet data:", data);
                
                if (data.status === "success") {
                    console.log("Successfully retrieved pet data:", data.data);
                    
                    // Update pet data
                    document.querySelector(".name-of-pet").textContent = data.data.pet_name || 'No name';
                    document.querySelector(".address").innerHTML = `<b>Address :</b> <br>${data.data.location || 'No address'}`;
                    document.querySelector(".age-of-pet").textContent = data.data.age || 'N/A';
                    document.querySelector(".breed-of-pet").textContent = data.data.category || 'N/A';
                    document.querySelector(".sex-of-pet").textContent = data.data.sex || 'N/A';
                    document.querySelector("#bioText").textContent = data.data.description || 'No description available';
                    document.querySelector(".animal").textContent = data.data.category || 'Pet';
                    
                    // Update pet image
                    const petImage = document.getElementById('petProfileImage');
                    if (data.data.photo) {
                        petImage.src = '../' + data.data.photo;
                    } else {
                        petImage.src = '../images/default-pet.jpg';
                    }
                } else {
                    console.error("Error status in response:", data.message);
                    showNoPetDataMessage();
                }
            })
            .catch(error => {
                console.error("Error fetching pet data:", error);
                showErrorMessage();
            });
    }).catch(error => {
        console.error("Auth check failed:", error);
    });
});

function showNoPetDataMessage() {
    const defaultMessage = "No pet information available";
    document.querySelector(".name-of-pet").textContent = "Add Your Pet";
    document.querySelector(".address").innerHTML = "<b>Address :</b> <br>Not set";
    document.querySelector(".age-of-pet").textContent = "-";
    document.querySelector(".breed-of-pet").textContent = "-";
    document.querySelector(".sex-of-pet").textContent = "-";
    document.querySelector("#bioText").textContent = "Add a description for your pet";
    document.querySelector(".animal").textContent = "Pet";
}

function showErrorMessage() {
    console.error("Unable to load pet data");
} 