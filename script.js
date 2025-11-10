/*******************************
 * script.js
 * University Garbage Management
 * Firebase + EmailJS Integration
 *******************************/

/* ------------------ CONFIG ------------------ */
const firebaseConfig = {
    apiKey: "AIzaSyCOWlq5BPR-SxGKDZQh-iNa9AbLqQnlWO4",
    authDomain: "swachh-pu-7d71e.firebaseapp.com",
    projectId: "swachh-pu-7d71e",
    storageBucket: "swachh-pu-7d71e.firebasestorage.app",
    messagingSenderId: "805580265834",
    appId: "1:805580265834:web:b00611f88ffd582bd9ed13",
    measurementId: "G-V1EV8JWNHP"
};

const EMAILJS_PUBLIC_KEY = "eZyaR_iFcnoxXi04a";
const EMAILJS_SERVICE_ID = "service_f8rbbyi";
const EMAILJS_TEMPLATE_ID = "template_vcqqnau";

/* ------------------ INIT ------------------ */
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
}
if (typeof emailjs !== 'undefined') {
    emailjs.init(EMAILJS_PUBLIC_KEY);
}

/* ------------------ Utils ------------------ */
function showResult(element, message, success = true) {
    if (!element) return;
    element.classList.remove("hidden");
    element.style.borderColor = success ? "rgba(24,128,61,0.12)" : "rgba(220,38,38,0.12)";
    element.innerHTML = `<strong>${success ? "Success" : "Error"}:</strong> ${message}`;
    setTimeout(() => element.classList.add("hidden"), 12000);
}

/* ------------------ Get Current Location ------------------ */
function setupGPS() {
    const gpsBtn = document.getElementById("gpsBtn");
    const latlonInput = document.getElementById("latlon");
    const manualLocation = document.getElementById("manualLocation");
    
    if (!gpsBtn || !latlonInput) return;
    
    gpsBtn.addEventListener("click", () => {
        if (!navigator.geolocation) {
            alert("Geolocation not supported by this browser.");
            return;
        }
        gpsBtn.disabled = true;
        gpsBtn.textContent = "Acquiring…";
        navigator.geolocation.getCurrentPosition((pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            latlonInput.value = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
            if (manualLocation) {
                manualLocation.value = `Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}`;
            }
            gpsBtn.disabled = false;
            gpsBtn.textContent = "📍 Use Current Location";
        }, (err) => {
            alert("Unable to get location. Please allow location permission or enter manually.");
            gpsBtn.disabled = false;
            gpsBtn.textContent = "📍 Use Current Location";
        }, { enableHighAccuracy: true, timeout: 12000 });
    });
}