function initMap() {
    const mapDiv = document.getElementById('map');
    if (!mapDiv) return;
    
    // Check if Google Maps API is loaded
    if (typeof google === 'undefined') {
        mapDiv.innerHTML = '<div style="padding:2rem;text-align:center;">Google Maps API key required to render map.</div>';
        return;
    }

    const defaultLocation = { lat: 13.3409, lng: 74.7421 }; // Example: Udupi region
    const map = new google.maps.Map(mapDiv, {
        zoom: 13,
        center: defaultLocation
    });
    
    const marker = new google.maps.Marker({
        position: defaultLocation,
        map: map,
        draggable: true
    });
}

// Load initMap when window loads if the map div exists
window.onload = function() {
    if(document.getElementById('map')) {
        initMap();
    }
};
