const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwNNGoVem6hItVcqTe587auGggnFHN-bWiGtncwUqb0kFAaA-c_GImkSrMza01kM-pk6Q/exec';
document.addEventListener('DOMContentLoaded', function() {
    initializeTracking();
    checkURLForTrackId();
});

function initializeTracking() {
    const trackInput = document.getElementById('trackId');
    const trackBtn = document.getElementById('trackBtn');

    if (trackInput) {
        trackInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchComplaint();
            }
        });
        
        // Auto-focus
        trackInput.focus();
    }

    if (trackBtn) {
        trackBtn.addEventListener('click', searchComplaint);
    }
}

function checkURLForTrackId() {
    const urlParams = new URLSearchParams(window.location.search);
    const trackId = urlParams.get('id');
    
    if (trackId) {
        document.getElementById('trackId').value = trackId;
        searchComplaint();
    }
}

async function searchComplaint() {
    const trackId = document.getElementById('trackId').value.trim();
    const trackBtn = document.getElementById('trackBtn');
    const resultBox = document.getElementById('trackResult'); // ✅ FIXED: Changed to trackResult

    if (!trackId) {
        showError('Please enter a Track ID');
        return;
    }

    if (!isValidTrackId(trackId)) {
        showError('Invalid Track ID format. Please check and try again.');
        return;
    }

    // Show loading state
    if (trackBtn) { // ✅ FIXED: Changed to trackBtn
        trackBtn.disabled = true;
        trackBtn.textContent = 'Searching...';
    }

    if (resultBox) {
        resultBox.classList.remove('hidden');
        resultBox.innerHTML = '<div style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Searching for your complaint...</div>';
    }

    try {
        const complaint = await fetchComplaintDetails(trackId);
        
        if (complaint.status === 'success') {
            displayComplaintDetails(complaint.data);
        } else {
            showError(complaint.message || 'Complaint not found');
        }
    } catch (error) {
        console.error('Search error:', error);
        showError('Network error. Please check your connection and try again.');
    } finally {
        if (trackBtn) { // ✅ FIXED: Changed to trackBtn
            trackBtn.disabled = false;
            trackBtn.textContent = 'Check Status';
        }
    }
}

function isValidTrackId(trackId) {
    // ✅ FIXED: More flexible validation to match your actual IDs
    return /^[A-Z0-9_]+$/.test(trackId);
}

async function fetchComplaintDetails(trackId) {
    try {
        console.log('🔍 Fetching complaint:', trackId);
        
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?complaintId=${encodeURIComponent(trackId)}`, {
    method: 'GET',
    mode: 'cors'
});


        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('📋 Complaint data received:', result);
        return result;

    } catch (error) {
        console.error('❌ Fetch error:', error);
        return {
            status: 'error',
            message: 'Failed to fetch complaint details. Please try again.'
        };
    }
}

// ✅ FIX THE COMPLAINT DATA EXTRACTION IN track.js
function displayComplaintDetails(complaint) {
    const resultBox = document.getElementById('trackResult');
    if (!resultBox) return;

    // ✅ FIX: Handle both Google Sheets format and transformed format
    const status = complaint.Status || complaint.status || 'Pending';
    const priority = complaint.Priority || complaint.priority || 'Medium';
    const complaintId = complaint.ComplaintID || complaint.complaintId || complaint.trackId || 'N/A';
    const name = complaint.Name || complaint.name || 'Anonymous';
    const email = complaint.Email || complaint.email || 'Not provided';
    const regno = complaint.RegNo || complaint.regno || 'Not provided';
    const category = complaint.Category || complaint.category || 'General';
    const description = complaint.Complaint || complaint.complaint || complaint.description || 'No description provided';
    const location = complaint['Manual Location'] || complaint.location || 'Not specified';
    const coordinates = complaint['GPS Coordinates'] || complaint.coordinates;
    const timestamp = complaint.Timestamp || complaint.timestamp;

    console.log('📋 Displaying complaint:', {
        complaintId, status, priority, name, category
    });

    // Rest of your display code...


    resultBox.innerHTML = `
        <div style="background: white; border-radius: 10px; padding: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border: 1px solid #e1e5e9; margin: 20px 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #f8f9fa;">
                <div style="padding: 8px 16px; border-radius: 20px; font-weight: bold; background: ${getStatusColor(status)}; color: white;">
                    ${status}
                </div>
                <div style="padding: 8px 16px; border-radius: 20px; font-weight: bold; background: ${getPriorityColor(priority)}; color: white;">
                    ${priority} Priority
                </div>
            </div>

            <div style="text-align: center; margin-bottom: 25px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                <h3 style="margin: 0 0 15px 0; color: #2c3e50;">Complaint Tracking Details</h3>
                <div style="font-size: 24px; font-weight: bold; color: #155724; margin: 10px 0; padding: 15px; background: white; border-radius: 8px; font-family: 'Courier New', monospace; border: 1px solid #dee2e6;">
                    ${complaint.ComplaintID || complaint.complaintId || 'N/A'}
                </div>
            </div>

            <div style="display: grid; gap: 20px; margin-bottom: 25px;">
                <div style="padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #007bff;">
                    <h4 style="margin: 0 0 15px 0; color: #2c3e50;">👤 Personal Information</h4>
                    <div style="display: flex; margin-bottom: 10px;">
                        <label style="font-weight: 600; color: #495057; min-width: 120px;">Name:</label>
                        <span style="color: #6c757d;">${complaint.Name || complaint.name || 'Anonymous'}</span>
                    </div>
                    <div style="display: flex; margin-bottom: 10px;">
                        <label style="font-weight: 600; color: #495057; min-width: 120px;">Email:</label>
                        <span style="color: #6c757d;">${complaint.Email || complaint.email || 'Not provided'}</span>
                    </div>
                    <div style="display: flex;">
                        <label style="font-weight: 600; color: #495057; min-width: 120px;">Registration No:</label>
                        <span style="color: #6c757d;">${complaint.RegNo || complaint.regno || 'Not provided'}</span>
                    </div>
                </div>

                <div style="padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #28a745;">
                    <h4 style="margin: 0 0 15px 0; color: #2c3e50;">📋 Complaint Details</h4>
                    <div style="display: flex; margin-bottom: 10px;">
                        <label style="font-weight: 600; color: #495057; min-width: 120px;">Category:</label>
                        <span style="color: #6c757d;">${complaint.Category || complaint.category || 'General'}</span>
                    </div>
                    <div style="display: flex; margin-bottom: 15px;">
                        <label style="font-weight: 600; color: #495057; min-width: 120px;">Priority:</label>
                        <span style="padding: 4px 12px; border-radius: 12px; background: ${getPriorityColor(priority)}; color: white; font-weight: 600;">
                            ${priority}
                        </span>
                    </div>
                    <div>
                        <label style="font-weight: 600; color: #495057; display: block; margin-bottom: 8px;">Description:</label>
                        <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #dee2e6; line-height: 1.5;">
                            ${complaint.Complaint || complaint.complaint || complaint.description || 'No description provided'}
                        </div>
                    </div>
                </div>

                <div style="padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #ffc107;">
                    <h4 style="margin: 0 0 15px 0; color: #2c3e50;">📍 Location Information</h4>
                    <div style="display: flex; margin-bottom: 10px;">
                        <label style="font-weight: 600; color: #495057; min-width: 120px;">Location:</label>
                        <span style="color: #6c757d;">${complaint['Manual Location'] || complaint.location || 'Not specified'}</span>
                    </div>
                    ${(complaint['GPS Coordinates'] || complaint.coordinates) ? `
                    <div style="display: flex;">
                        <label style="font-weight: 600; color: #495057; min-width: 120px;">GPS Coordinates:</label>
                        <span style="color: #6c757d; font-family: 'Courier New', monospace; background: #e9ecef; padding: 4px 8px; border-radius: 4px;">
                            ${complaint['GPS Coordinates'] || complaint.coordinates}
                        </span>
                    </div>
                    ` : ''}
                </div>

                <div style="padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #6f42c1;">
                    <h4 style="margin: 0 0 15px 0; color: #2c3e50;">📅 Timeline</h4>
                    <div style="display: flex; margin-bottom: 10px;">
                        <label style="font-weight: 600; color: #495057; min-width: 120px;">Submitted:</label>
                        <span style="color: #6c757d;">${formatDateTime(complaint.Timestamp || complaint.timestamp)}</span>
                    </div>
                    <div style="display: flex;">
                        <label style="font-weight: 600; color: #495057; min-width: 120px;">Last Updated:</label>
                        <span style="color: #6c757d;">${formatDateTime(complaint.Timestamp || complaint.timestamp)}</span>
                    </div>
                </div>
            </div>

            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin: 25px 0;">
                <button onclick="printComplaint()" style="padding: 12px 24px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    🖨️ Print Details
                </button>
                <button onclick="shareComplaint('${complaint.ComplaintID || complaint.complaintId || trackId}')" style="padding: 12px 24px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    📤 Share
                </button>
                <button onclick="newComplaint()" style="padding: 12px 24px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    📝 Submit New Complaint
                </button>
            </div>

            <div style="text-align: center; padding: 15px; background: #e7f3ff; border-radius: 6px; border-left: 4px solid #007bff;">
                <p style="margin: 0;"><strong>Need Help?</strong> Contact support if you have questions about your complaint status.</p>
            </div>
        </div>
    `;

    resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function getStatusColor(status) {
    const statusColors = {
        'pending': '#ffc107',
        'in progress': '#17a2b8',
        'resolved': '#28a745',
        'rejected': '#dc3545'
    };
    return statusColors[status.toLowerCase()] || '#6c757d';
}

function getPriorityColor(priority) {
    const priorityColors = {
        'low': '#17a2b8',
        'medium': '#ffc107',
        'high': '#fd7e14',
        'urgent': '#dc3545'
    };
    return priorityColors[priority.toLowerCase()] || '#6c757d';
}

function formatDateTime(timestamp) {
    if (!timestamp) return 'Not available';
    
    try {
        const date = new Date(timestamp);
        return date.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Invalid date';
    }
}

function showError(message) {
    const resultBox = document.getElementById('trackResult'); // ✅ FIXED: Changed to trackResult
    if (!resultBox) return;

    resultBox.classList.remove('hidden');
    resultBox.innerHTML = `
        <div style="text-align: center; padding: 30px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px;">
            <div style="font-size: 48px; margin-bottom: 15px;">❌</div>
            <h3 style="color: #721c24; margin-bottom: 15px;">Complaint Not Found</h3>
            <p style="color: #721c24; margin-bottom: 20px;">${message}</p>
            <div style="text-align: left; background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <p style="margin: 0 0 10px 0; font-weight: bold;">Suggestions:</p>
                <ul style="margin: 0; padding-left: 20px;">
                    <li>Check if the Track ID is correct</li>
                    <li>Ensure you're using the exact ID provided during submission</li>
                    <li>Try copying and pasting the ID again</li>
                    <li>If problem persists, contact support</li>
                </ul>
            </div>
            <button onclick="newComplaint()" style="padding: 12px 24px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer;">
                📝 Submit New Complaint
            </button>
        </div>
    `;

    resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function printComplaint() {
    window.print();
}

function shareComplaint(trackId) {
    const url = `${window.location.origin}${window.location.pathname}?id=${trackId}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Complaint Tracking',
            text: `Track my complaint using this ID: ${trackId}`,
            url: url
        });
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
            alert('Tracking link copied to clipboard!');
        });
    } else {
        const tempInput = document.createElement('input');
        tempInput.value = url;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        alert('Tracking link copied to clipboard!');
    }
}

function newComplaint() {
    window.location.href = 'complain.html';
}