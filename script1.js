// Button functionality
document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('.btn');
    const formsSection = document.getElementById('formsSection');
    const reportForm = document.getElementById('reportForm');
    const trackForm = document.getElementById('trackForm');
    
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            if (this.textContent.includes('Go to Complain') || this.textContent.includes('Report an Issue')) {
                // Show forms section and report form
                formsSection.style.display = 'block';
                reportForm.style.display = 'block';
                trackForm.style.display = 'none';
                
                // Smooth scroll to forms section
                window.scrollTo({
                    top: formsSection.offsetTop - 50,
                    behavior: 'smooth'
                });
                
            } else if (this.textContent.includes('Track your Complain')) {
                // Show forms section and track form
                formsSection.style.display = 'block';
                reportForm.style.display = 'none';
                trackForm.style.display = 'block';
                
                // Smooth scroll to forms section
                window.scrollTo({
                    top: formsSection.offsetTop - 50,
                    behavior: 'smooth'
                });
                
                // Auto-focus on track ID input
                setTimeout(() => {
                    const trackIdInput = document.getElementById('trackId');
                    if (trackIdInput) trackIdInput.focus();
                }, 300);
                
            } else if (this.textContent.includes('Sign Up as Student') || this.textContent.includes('Sign Up as Administrator')) {
                // Handle signup buttons
                const role = this.textContent.includes('Student') ? 'Student' : 'Administrator';
                alert(`Redirecting to ${role} registration page...`);
                
            } else if (this.textContent.includes('View Issues Map')) {
                // Handle map view - show message since we don't have map.html
                alert('Campus issues map feature coming soon!');
            }
        });
    });
    
    // Form submission handling
    const complaintForm = document.getElementById('complaintForm');
    if (complaintForm) {
        complaintForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Generate random complaint ID
            const complaintId = 'PU' + Math.floor(1000 + Math.random() * 9000);
            
            // Show success message
            alert(`Complaint submitted successfully!\nYour Complaint ID: ${complaintId}\nPlease save this ID for tracking.`);
            
            // Reset form
            this.reset();
            
            // Show track form with the generated ID
            formsSection.style.display = 'block';
            reportForm.style.display = 'none';
            trackForm.style.display = 'block';
            
            // Auto-fill the track ID
            const trackIdInput = document.getElementById('trackId');
            if (trackIdInput) trackIdInput.value = complaintId;
        });
    }
    
    // Track button functionality
    const trackBtn = document.getElementById('trackBtn');
    if (trackBtn) {
        trackBtn.addEventListener('click', function() {
            const trackIdInput = document.getElementById('trackId');
            const trackResult = document.getElementById('trackResult');
            
            if (!trackIdInput || !trackIdInput.value.trim()) {
                alert('Please enter a Complaint ID');
                return;
            }
            
            const complaintId = trackIdInput.value.trim();
            
            // Simulate tracking results
            const statuses = ['Submitted', 'Under Review', 'In Progress', 'Resolved'];
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
            const randomDate = new Date();
            randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 7));
            
            // Display results
            if (trackResult) {
                trackResult.innerHTML = `
                    <h4>Complaint Status</h4>
                    <div class="status-info">
                        <p><strong>Complaint ID:</strong> ${complaintId}</p>
                        <p><strong>Status:</strong> <span class="status-${randomStatus.toLowerCase().replace(' ', '-')}">${randomStatus}</span></p>
                        <p><strong>Last Updated:</strong> ${randomDate.toLocaleDateString()}</p>
                        <p><strong>Estimated Resolution:</strong> ${randomStatus === 'Resolved' ? 'Completed' : 'Within 3-5 working days'}</p>
                    </div>
                `;
                trackResult.style.display = 'block';
            }
        });
    }
    
    // GPS location button
    const gpsBtn = document.getElementById('gpsBtn');
    if (gpsBtn) {
        gpsBtn.addEventListener('click', function() {
            const latlonInput = document.getElementById('latlon');
            
            if (navigator.geolocation) {
                // Show loading state
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting Location...';
                this.disabled = true;
                
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        const lat = position.coords.latitude;
                        const lon = position.coords.longitude;
                        if (latlonInput) {
                            latlonInput.value = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
                        }
                        
                        // Reset button
                        gpsBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i> Use Current Location';
                        gpsBtn.disabled = false;
                    },
                    function(error) {
                        alert('Unable to retrieve your location. Please enter manually.');
                        console.error('Geolocation error:', error);
                        
                        // Reset button
                        gpsBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i> Use Current Location';
                        gpsBtn.disabled = false;
                    }
                );
            } else {
                alert('Geolocation is not supported by this browser. Please enter manually.');
            }
        });
    }
    
    // Back to home functionality
    const backToHomeBtns = document.querySelectorAll('.back-to-home');
    backToHomeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            formsSection.style.display = 'none';
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    });
    
    // Add hover effect to cards
    const cards = document.querySelectorAll('.signup-card, .feature-card, .form-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.05)';
        });
    });
    
    // Header scroll effect
    const header = document.querySelector('header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            header.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
            header.style.background = 'rgba(255, 255, 255, 0.98)';
        } else {
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
            header.style.background = 'white';
        }
    });
});