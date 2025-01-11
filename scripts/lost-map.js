// Initialize the map when Google Maps API is loaded
function initMap() {
    // Set default location (e.g., the center of the map)
    const defaultLocation = { lat: -20.512760102654763, lng: 57.51061152312467 }; // Change as needed

    // Create the map, centered at the default location
    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 10,
        center: defaultLocation,
    });

    // Add a marker for the default location
    const marker = new google.maps.Marker({
        position: defaultLocation,
        map: map,
        draggable: true,  // Allow the user to move the marker
        title: "Last known location of your pet",
    });

    // Listen for marker drag events to update the location
    google.maps.event.addListener(marker, "dragend", function (event) {
        const newLocation = event.latLng;
        console.log("New location:", newLocation.lat(), newLocation.lng());

        // You can add code here to send this new location to your server
        // updateLocation(newLocation.lat(), newLocation.lng());
    });
} 

