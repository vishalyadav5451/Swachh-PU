(() => {

// ==============================
// UNIVERSITY COMPLAINT SYSTEM - FINAL FRONTEND (FIXED DUPLICATE SUBMISSION)
// ==============================

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwNNGoVem6hItVcqTe587auGggnFHN-bWiGtncwUqb0kFAaA-c_GImkSrMza01kM-pk6Q/exec';

document.addEventListener('DOMContentLoaded', () => {
  emailjs.init("eZyaR_iFcnoxXi04a");
  setupGPS();
  setupComplaintForm();
});

let isSubmitting = false;

// ==============================
// GPS HANDLING
// ==============================
function setupGPS() {
  const gpsBtn = document.getElementById("gpsBtn");
  if (!gpsBtn) return;

  gpsBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported by this browser.");
      return;
    }

    gpsBtn.disabled = true;
    gpsBtn.textContent = "Acquiring Location...";

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        const coordinates = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
        document.getElementById("latlon").value = coordinates;

        const manualLocation = document.getElementById("manualLocation");
        if (!manualLocation.value.trim()) {
          getLocationName(lat, lon, manualLocation);
        }

        gpsBtn.disabled = false;
        gpsBtn.textContent = "📍 Location Captured";
        gpsBtn.style.background = "#28a745";

        setTimeout(() => {
          gpsBtn.textContent = "📍 Use Current Location";
          gpsBtn.style.background = "";
        }, 3000);
      },
      () => {
        alert("Location access denied or unavailable. Please enter location manually.");
        gpsBtn.disabled = false;
        gpsBtn.textContent = "📍 Use Current Location";
      }
    );
  });
}

function getLocationName(lat, lon, locationField) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data && data.display_name) {
        const shortAddress = data.display_name.split(',').slice(0, 3).join(',').trim();
        locationField.value = shortAddress;
      }
    })
    .catch(error => console.log('Reverse geocoding failed:', error));
}

// ==============================
// FORM SETUP & VALIDATION
// ==============================
function setupComplaintForm() {
  const reportForm = document.getElementById("reportForm");
  const submitBtn = document.getElementById("submitBtn");

  if (!reportForm) return;

  reportForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    isSubmitting = true;

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting…";

    try {
      const formData = getFormData();
      const validationError = validateFormData(formData);

      if (validationError) {
        alert(validationError);
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Report";
        isSubmitting = false;
        return;
      }

      // ✅ Step 1: Send data to Google Sheets
      const sheetResponse = await saveToGoogleSheets(formData);

      if (sheetResponse.status === 'success') {
        const realComplaintId = sheetResponse.complaintId || "N/A";

        try {
          await sendComplaintEmail(formData, realComplaintId);
          showSuccessMessage(realComplaintId, formData.email, true, formData.coordinates);
        } catch (emailError) {
          console.warn('Email failed but data saved:', emailError);
          showSuccessMessage(realComplaintId, formData.email, false, formData.coordinates);
        }

        reportForm.reset();
        document.getElementById("latlon").value = "";
      } else {
        throw new Error(sheetResponse.message || "Failed to save complaint");
      }

    } catch (error) {
      console.error("Submission error:", error);
      showError(error.message || "Failed to submit complaint. Please try again.");
    } finally {
      isSubmitting = false;
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Report";
    }
  });
}

function getFormData() {
  const anonymous = document.getElementById("anonymous").checked;
  const nameField = document.getElementById("name");
  const photoFile = document.getElementById("photo").files[0];

  return {
    name: anonymous ? "Anonymous" : (nameField.value.trim() || "Anonymous"),
    regno: document.getElementById("regno").value.trim() || "Not provided",
    email: document.getElementById("email").value.trim() || "Not provided",
    category: document.getElementById("category").value,
    priority: document.getElementById("priority").value,
    location: document.getElementById("manualLocation").value.trim(),
    description: document.getElementById("description").value.trim(),
    coordinates: document.getElementById("latlon").value.trim(),
    photoFile: photoFile
  };
}

function validateFormData(formData) {
  if (!formData.category) return "Please select a category.";
  if (!formData.priority) return "Please select a priority level.";
  if (!formData.description.trim()) return "Please provide complaint description.";
  if (formData.description.trim().length < 10) return "Please provide more detailed description (minimum 10 characters).";
  if (!formData.location.trim()) return "Please provide location information or use GPS.";
  if (formData.photoFile) {
    if (formData.photoFile.size > MAX_FILE_SIZE) {
      return "Photo size must be less than 5MB.";
    }
    if (!ALLOWED_FILE_TYPES.includes(formData.photoFile.type)) {
      return "Please upload a valid image file (JPG, PNG, GIF, WebP).";
    }
  }
  return null;
}

// ==============================
// GOOGLE SHEETS + DRIVE UPLOAD
// ==============================
async function saveToGoogleSheets(formData) {
  try {
    console.log('🔄 Starting saveToGoogleSheets...');
    let photoUrl = '';

    // Step 1: Upload photo first
    if (formData.photoFile) {
      console.log('📸 Uploading photo...');
      try {
        photoUrl = await uploadPhotoToDrive(formData.photoFile);
        console.log('✅ Photo upload completed. URL:', photoUrl);
      } catch (photoError) {
        console.error('❌ Photo upload failed:', photoError);
      }
    }

    // Step 2: Send complaint data to Google Apps Script
    const payload = new URLSearchParams();
    payload.append('name', formData.name);
    payload.append('email', formData.email);
    payload.append('regno', formData.regno);
    payload.append('category', formData.category);
    payload.append('complaint', formData.description);
    payload.append('priority', formData.priority);
    payload.append('location', formData.location);
    payload.append('coordinates', formData.coordinates);
    payload.append('photoUrl', photoUrl);

    console.log('📤 Sending complaint data to Google Sheets...');
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: payload.toString()
    });

    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    const result = await response.json();
    console.log('✅ Google Sheets response:', result);

    return result;
  } catch (error) {
    console.error('❌ Submission error:', error);
    return { status: 'error', message: error.message };
  }
}

// ✅ Corrected: photo upload sends proper base64 data
// async function uploadPhotoToDrive(photoFile) {
//     return new Promise((resolve, reject) => {
//         const reader = new FileReader();

//         reader.onload = function(e) {
//             const base64Data = e.target.result.split(',')[1];

//             // ✅ Use URLSearchParams instead of FormData for better compatibility
//             const payload = new URLSearchParams();
//             payload.append('action', 'uploadPhoto');
//             payload.append('photoOnly', 'true'); // Explicit flag
//             payload.append('fileName', `complaint_${Date.now()}.jpg`);
//             payload.append('photoData', base64Data);

//             console.log('📤 Uploading ONLY photo to server...');

//             fetch(GOOGLE_SCRIPT_URL, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
//                 },
//                 body: payload.toString()
//             })
//             .then(response => response.json())
//             .then(data => {
//                 console.log('✅ Photo upload response:', data);
                
//                 // ✅ Check for proper photo upload success response
//                 if (data.status === 'success' && data.fileUrl) {
//                     console.log('🎉 Photo uploaded successfully:', data.fileUrl);
//                     resolve(data.fileUrl);
//                 } else if (data.status === 'success' && data.complaintId) {
//                     // ⚠️ This means backend still processed it as complaint
//                     console.error('❌ Backend processed photo as complaint!');
//                     resolve(''); // Continue without photo
//                 } else {
//                     console.warn('⚠️ Photo upload failed, continuing without photo');
//                     resolve('');
//                 }
//             })
//             .catch(error => {
//                 console.error('❌ Photo upload error, continuing without photo:', error);
//                 resolve('');
//             });
//         };

//         reader.onerror = function(error) {
//             console.error('❌ FileReader error:', error);
//             resolve('');
//         };
        
//         reader.readAsDataURL(photoFile);
//     });
// }

// ==============================
// EMAIL + UI FEEDBACK
// ==============================
async function sendComplaintEmail(formData, realComplaintId) {
  try {
    const emailParams = {
      track_id: realComplaintId,
      from_name: formData.name,
      reg_no: formData.regno,
      user_email: formData.email,
      category: formData.category,
      priority: formData.priority,
      manual_location: formData.location,
      coordinates: formData.coordinates || 'Not provided',
      description: formData.description,
      timestamp: new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    console.log('📧 Sending EmailJS with params:', emailParams);
    const result = await emailjs.send("service_f8rbbyi", "template_vcqqnau", emailParams);
    console.log('✅ Email sent successfully');
    return result;
  } catch (emailError) {
    console.error('❌ EmailJS error:', emailError);
    throw new Error('Failed to send confirmation email');
  }
}

// ==============================
// UI MESSAGES
// ==============================
function showSuccessMessage(trackId, userEmail, emailSent, coordinates) {
  const resultBox = document.getElementById("resultBox");
  if (!resultBox) return;

  resultBox.classList.remove("hidden");
  const locationInfo = coordinates ? `📍 <strong>GPS Location:</strong> ${coordinates}<br>` : '';
  const emailStatus = emailSent ? '📧 Confirmation email sent' : '⚠️ Email notification failed';

  resultBox.innerHTML = `
    <div style="text-align: center; padding: 20px; background: #d4edda; border-radius: 10px; margin: 20px 0;">
      <div style="font-size: 48px; margin-bottom: 15px;">✅</div>
      <h3 style="color: #155724; margin-bottom: 20px;">Complaint Submitted Successfully!</h3>
      <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border: 2px dashed #28a745;">
        <strong style="display: block; margin-bottom: 10px;">Your Tracking ID:</strong>
        <div style="font-size: 24px; font-weight: bold; color: #155724; margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 6px; font-family: 'Courier New', monospace;">
          ${trackId}
        </div>
      </div>
      <div style="text-align: left; background: #f8f9fa; padding: 15px; border-radius: 8px;">
        <p style="margin: 8px 0;">✅ Data saved to system</p>
        ${locationInfo}
        <p style="margin: 8px 0;">${emailStatus}</p>
      </div>
      <div style="margin-top: 20px;">
        <button onclick="copyToClipboard('${trackId}')" style="margin: 5px; padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer;">📋 Copy Track ID</button>
        <button onclick="window.location.href='track.html?id=${trackId}'" style="margin: 5px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer;">🔍 Track Status</button>
      </div>
    </div>
  `;

  resultBox.scrollIntoView({ behavior: 'smooth' });
}

function showError(message) {
  const resultBox = document.getElementById("resultBox");
  if (!resultBox) return;

  resultBox.classList.remove("hidden");
  resultBox.innerHTML = `
    <div style="text-align: center; padding: 20px; background: #f8d7da; border-radius: 10px;">
      <div style="font-size: 48px; margin-bottom: 15px;">❌</div>
      <h3 style="color: #721c24; margin-bottom: 15px;">Submission Failed</h3>
      <p style="color: #721c24;">${message}</p>
      <button onclick="location.reload()" style="margin-top: 15px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer;">🔄 Try Again</button>
    </div>
  `;
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('Track ID copied to clipboard: ' + text);
  }).catch(() => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    alert('Track ID copied to clipboard!');
  });
}

})(); // End of self-contained script
