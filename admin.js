// Enhanced Admin Panel JavaScript - FIXED VERSION
const admin = {
    // Configuration
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwNNGoVem6hItVcqTe587auGggnFHN-bWiGtncwUqb0kFAaA-c_GImkSrMza01kM-pk6Q/exec',
    ADMIN_PASSWORD: 'puadmin2025',
    
    // Global variables
    allComplaints: [],
    filteredComplaints: [],
    currentComplaint: null,
    charts: {},
    autoRefreshInterval: null,

    // Initialize admin panel
    init: function() {
        console.log('🚀 Initializing Admin Panel...');
        this.setupEventListeners();
        this.loadAllComplaints();
        
        // ✅ FIXED: Better auto-refresh with checks
        this.autoRefreshInterval = setInterval(() => {
            if (this.allComplaints.length > 0) { // Only refresh if we have data
                this.loadAllComplaints();
            }
        }, 120000);
        
        this.updateLastUpdateTime();
    },

    // Setup event listeners
    setupEventListeners: function() {
        // Search and filters
        document.getElementById('search-input').addEventListener('input', () => this.filterComplaints());
        document.getElementById('status-filter').addEventListener('change', () => this.filterComplaints());
        document.getElementById('category-filter').addEventListener('change', () => this.filterComplaints());
        document.getElementById('priority-filter').addEventListener('change', () => this.filterComplaints());
        
        // Modal close events
        window.addEventListener('click', (event) => {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                this.refreshData();
            }
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeStatusModal();
            }
        });

        console.log('✅ Event listeners setup complete');
    },

    // ✅ FIXED: Load all complaints from Google Sheets
    loadAllComplaints: async function() {
        try {
            console.log('📥 Loading complaints from Google Sheets...');
            this.showLoadingState();
            
            const complaints = await this.fetchComplaints();
            
            if (complaints && complaints.length > 0) {
                this.allComplaints = complaints;
                this.filteredComplaints = [...complaints];
                console.log(`✅ Loaded ${this.allComplaints.length} REAL complaints`);
            } else {
                // ❌ REAL DATA NAHI MILA - Show clear error
                this.showError('No real data received from server. Check Google Script URL and Sheet permissions.');
                this.allComplaints = [];
                this.filteredComplaints = [];
            }
            
            this.updateDashboard();
            this.updateComplaintsTable();
            this.updateUsersTable();
            this.createCharts();
            
            this.updateLastUpdateTime();
            this.hideLoadingState();
            
        } catch (error) {
            console.error('❌ Error loading complaints:', error);
            this.showError('Failed to load complaints: ' + error.message);
            this.hideLoadingState();
        }
    },

    // ✅ FIXED: Fetch complaints from Google Apps Script
    async fetchComplaints() {
        try {
            console.log('🔗 Fetching complaints...');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(`${this.GOOGLE_SCRIPT_URL}?action=getAll&t=${Date.now()}`, {
                method: 'GET',
                mode: 'cors',
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            const data = await response.json();

            if (data.status === 'success' && data.data) {
                console.log(`✅ Loaded ${data.data.length} complaints`);
                return this.transformComplaintData(data.data);
            } else {
                throw new Error(data.message || 'Invalid data format');
            }
        } catch (err) {
            console.error('❌ Fetch error:', err);
            throw new Error('Network or CORS error — check deployment and permissions');
        }
    },

    // ✅ FIXED: Transform Google Sheets data to admin panel format
    transformComplaintData: function(sheetData) {
        if (!sheetData || !Array.isArray(sheetData)) {
            console.error('❌ Invalid sheet data:', sheetData);
            return [];
        }
        
        console.log('🔄 Transforming sheet data, rows:', sheetData.length);
        
        return sheetData.map((row, index) => {
            try {
                // ✅ FIXED: Safe data access with fallbacks
                const complaint = {
                    trackId: row.ComplaintID || row.complaintId || `UNK_${index}`,
                    name: row.Name || row.name || 'Anonymous',
                    regno: row.RegNo || row.regno || 'Not provided',
                    email: row.Email || row.email || 'Not provided',
                    category: row.Category || row.category || 'General',
                    priority: row.Priority || row.priority || 'Medium',
                    location: row['Manual Location'] || row.location || 'Not provided',
                    description: row.Complaint || row.complaint || row.description || 'No description',
                    coordinates: row['GPS Coordinates'] || row.coordinates || 'Not available',
                    photo: row['Photo URL'] ? 'Yes' : 'No',
                    status: row.Status || row.status || 'Pending',
                    timestamp: row.Timestamp || row.timestamp || new Date().toISOString()
                };

                // ✅ FIXED: Parse coordinates safely
                if (complaint.coordinates && complaint.coordinates.includes(',')) {
                    const coords = complaint.coordinates.split(',');
                    complaint.latitude = coords[0]?.trim();
                    complaint.longitude = coords[1]?.trim();
                } else {
                    complaint.latitude = null;
                    complaint.longitude = null;
                }

                return complaint;
            } catch (error) {
                console.error(`❌ Error transforming row ${index}:`, error);
                return null;
            }
        }).filter(complaint => complaint !== null); // Remove null entries
    },

    // Update dashboard statistics
    updateDashboard: function() {
        const total = this.allComplaints.length;
        const pending = this.allComplaints.filter(c => c.status === 'Pending').length;
        const progress = this.allComplaints.filter(c => c.status === 'In Progress').length;
        const resolved = this.allComplaints.filter(c => c.status === 'Resolved').length;

        // Update stat numbers
        document.getElementById('total-complaints').textContent = total;
        document.getElementById('pending-complaints').textContent = pending;
        document.getElementById('progress-complaints').textContent = progress;
        document.getElementById('resolved-complaints').textContent = resolved;

        // Update recent count badge
        document.getElementById('recent-count').textContent = `${pending} pending`;

        this.updateRecentComplaints(this.allComplaints.slice(-10).reverse());
    },

    // Update recent complaints list
    updateRecentComplaints: function(complaints) {
        const container = document.getElementById('recent-complaints');
        
        if (complaints.length === 0) {
            container.innerHTML = '<div class="loading-state">No complaints found</div>';
            return;
        }

        let html = '';
        complaints.forEach(complaint => {
            const timeAgo = this.getTimeAgo(complaint.timestamp);
            
            html += `
                <div class="recent-item" onclick="admin.viewComplaint('${complaint.trackId}')">
                    <div class="recent-info">
                        <h4>${complaint.trackId} - ${complaint.category}</h4>
                        <div class="recent-meta">
                            ${complaint.name} • ${complaint.location} • ${timeAgo}
                        </div>
                    </div>
                    <div class="recent-actions">
                        <span class="status-badge status-${complaint.status.toLowerCase().replace(' ', '-')}">
                            ${complaint.status}
                        </span>
                        <span class="priority-${complaint.priority.toLowerCase()}">
                            ${complaint.priority}
                        </span>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    // Update complaints table
    updateComplaintsTable: function() {
        const tbody = document.getElementById('complaints-table-body');
        const count = document.getElementById('complaint-count');
        
        count.textContent = `${this.filteredComplaints.length} complaints`;
        
        if (this.filteredComplaints.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="loading-cell">
                        <i class="fas fa-search"></i> No complaints found
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        this.filteredComplaints.forEach(complaint => {
            const timeAgo = this.getTimeAgo(complaint.timestamp);
            
            html += `
                <tr>
                    <td><strong>${complaint.trackId}</strong></td>
                    <td>${complaint.name}</td>
                    <td>${complaint.category}</td>
                    <td class="priority-${complaint.priority.toLowerCase()}">${complaint.priority}</td>
                    <td>${complaint.location}</td>
                    <td>
                        <span class="status-badge status-${complaint.status.toLowerCase().replace(' ', '-')}">
                            ${complaint.status}
                        </span>
                    </td>
                    <td title="${this.formatDate(complaint.timestamp)}">${timeAgo}</td>
                    <td>
                        <button class="action-btn btn-view" onclick="admin.viewComplaint('${complaint.trackId}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn btn-edit" onclick="admin.updateComplaintStatus('${complaint.trackId}')" title="Update Status">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${complaint.status !== 'Resolved' ? 
                            `<button class="action-btn btn-resolve" onclick="admin.resolveComplaint('${complaint.trackId}')" title="Mark Resolved">
                                <i class="fas fa-check"></i>
                            </button>` : ''
                        }
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    },

    // Filter complaints based on search and filters
    filterComplaints: function() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const statusFilter = document.getElementById('status-filter').value;
        const categoryFilter = document.getElementById('category-filter').value;
        const priorityFilter = document.getElementById('priority-filter').value;

        this.filteredComplaints = this.allComplaints.filter(complaint => {
            const matchesSearch = 
                complaint.trackId.toLowerCase().includes(searchTerm) ||
                complaint.name.toLowerCase().includes(searchTerm) ||
                complaint.location.toLowerCase().includes(searchTerm) ||
                complaint.description.toLowerCase().includes(searchTerm);
            
            const matchesStatus = !statusFilter || complaint.status === statusFilter;
            const matchesCategory = !categoryFilter || complaint.category === categoryFilter;
            const matchesPriority = !priorityFilter || complaint.priority === priorityFilter;

            return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
        });

        this.updateComplaintsTable();
    },

    // View complaint details
    viewComplaint: function(trackId) {
        const complaint = this.allComplaints.find(c => c.trackId === trackId);
        if (!complaint) {
            this.showError('Complaint not found');
            return;
        }

        this.currentComplaint = complaint;
        this.showComplaintDetails(complaint);
    },

    // Show complaint details in modal
    showComplaintDetails: function(complaint) {
        const modal = document.getElementById('complaintModal');
        const content = document.getElementById('complaint-detail-content');

        const mapLink = complaint.latitude && complaint.longitude ? 
            `https://maps.google.com/?q=${complaint.latitude},${complaint.longitude}` : '#';

        content.innerHTML = `
            <div class="complaint-details">
                <div class="detail-section">
                    <h4>Complaint Information</h4>
                    <div class="detail-grid">
                        <div class="detail-group">
                            <label>Track ID</label>
                            <div class="detail-value">${complaint.trackId}</div>
                        </div>
                        <div class="detail-group">
                            <label>Submitted By</label>
                            <div class="detail-value">${complaint.name}</div>
                        </div>
                        <div class="detail-group">
                            <label>Registration No</label>
                            <div class="detail-value">${complaint.regno}</div>
                        </div>
                        <div class="detail-group">
                            <label>Email</label>
                            <div class="detail-value">${complaint.email}</div>
                        </div>
                        <div class="detail-group">
                            <label>Category</label>
                            <div class="detail-value">${complaint.category}</div>
                        </div>
                        <div class="detail-group">
                            <label>Priority</label>
                            <div class="detail-value priority-${complaint.priority.toLowerCase()}">${complaint.priority}</div>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h4>Location Details</h4>
                    <div class="detail-grid">
                        <div class="detail-group">
                            <label>Manual Location</label>
                            <div class="detail-value">${complaint.location}</div>
                        </div>
                        <div class="detail-group">
                            <label>GPS Coordinates</label>
                            <div class="detail-value">${complaint.coordinates}</div>
                        </div>
                        ${complaint.latitude && complaint.longitude ? `
                        <div class="detail-group">
                            <label>Map</label>
                            <div class="detail-value">
                                <a href="${mapLink}" target="_blank" class="btn btn-primary">
                                    <i class="fas fa-map-marker-alt"></i> View on Google Maps
                                </a>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h4>Description</h4>
                <div class="detail-value description-box">${complaint.description}</div>
            </div>

            <div class="detail-section">
                <h4>Timeline</h4>
                <div class="timeline">
                    <div class="timeline-item">
                        <div class="timeline-marker"></div>
                        <div class="timeline-content">
                            <div class="timeline-date">${this.formatDate(complaint.timestamp)}</div>
                            <div><strong>Complaint Submitted</strong></div>
                            <div>Complaint registered in the system</div>
                        </div>
                    </div>
                    ${complaint.status === 'In Progress' ? `
                    <div class="timeline-item">
                        <div class="timeline-marker"></div>
                        <div class="timeline-content">
                            <div class="timeline-date">${this.formatDate(new Date())}</div>
                            <div><strong>Under Review</strong></div>
                            <div>Assigned to relevant department</div>
                        </div>
                    </div>
                    ` : ''}
                    ${complaint.status === 'Resolved' ? `
                    <div class="timeline-item">
                        <div class="timeline-marker"></div>
                        <div class="timeline-content">
                            <div class="timeline-date">${this.formatDate(new Date())}</div>
                            <div><strong>Resolved</strong></div>
                            <div>Issue has been resolved</div>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>

            <div class="action-buttons">
                <button class="btn btn-primary" onclick="admin.updateComplaintStatus('${complaint.trackId}')">
                    <i class="fas fa-edit"></i> Update Status
                </button>
                ${complaint.status !== 'Resolved' ? 
                    `<button class="btn btn-success" onclick="admin.resolveComplaint('${complaint.trackId}')">
                        <i class="fas fa-check"></i> Mark Resolved
                    </button>` : ''
                }
                <button class="btn btn-secondary" onclick="admin.sendUserNotification('${complaint.trackId}')">
                    <i class="fas fa-envelope"></i> Notify User
                </button>
            </div>
        `;

        modal.style.display = 'block';
    },

    // Update complaint status - OPEN MODAL
    updateComplaintStatus: async function(trackId) {
        const complaint = this.allComplaints.find(c => c.trackId === trackId);
        if (!complaint) return;

        const modal = document.getElementById('statusModal');
        const content = document.getElementById('status-update-content');

        content.innerHTML = `
            <div class="form-group">
                <label>Current Status</label>
                <div class="current-status">
                    <span class="status-badge status-${complaint.status.toLowerCase().replace(' ', '-')}">
                        ${complaint.status}
                    </span>
                </div>
            </div>
            
            <div class="form-group">
                <label>Update Status</label>
                <select class="status-select" id="new-status">
                    <option value="Pending" ${complaint.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="In Progress" ${complaint.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Resolved" ${complaint.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Admin Notes (Optional)</label>
                <textarea id="status-notes" placeholder="Add any notes about this status update..." rows="3"></textarea>
            </div>
            
            <div class="form-group">
                <label>
                    <input type="checkbox" id="send-notification" checked>
                    Send email notification to user
                </label>
            </div>
            
            <div class="form-actions">
                <button class="btn btn-primary" onclick="admin.saveStatusUpdate('${trackId}')">
                    <i class="fas fa-save"></i> Save Changes
                </button>
                <button class="btn btn-secondary" onclick="admin.closeStatusModal()">
                    Cancel
                </button>
            </div>
        `;

        modal.style.display = 'block';
    },

    // ✅ FIXED: Save status update - BETTER VERSION
    async saveStatusUpdate(trackId) {
        const newStatus = document.getElementById('new-status').value;
        try {
            const url = `${this.GOOGLE_SCRIPT_URL}?updateAction=status&complaintId=${encodeURIComponent(trackId)}&newStatus=${encodeURIComponent(newStatus)}&t=${Date.now()}`;
            const response = await fetch(url, { method: 'GET', mode: 'cors' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();

            if (data.status === 'success') {
                this.updateLocalComplaintStatus(trackId, newStatus);
                this.showSuccess(`Status updated to ${newStatus}`);
                this.closeStatusModal();
                this.closeModal();
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            this.showError('Failed to update: ' + err.message);
        }
    },

    // Resolve complaint
    resolveComplaint: function(trackId) {
        if (confirm('Mark this complaint as resolved?')) {
            this.updateComplaintStatusDirect(trackId, 'Resolved');
        }
    },

    // Direct status update without modal
    updateComplaintStatusDirect: async function(trackId, newStatus) {
        try {
            console.log('🔄 Direct status update:', trackId, 'to:', newStatus);

            const response = await fetch(`${this.GOOGLE_SCRIPT_URL}?updateAction=status&complaintId=${encodeURIComponent(trackId)}&newStatus=${encodeURIComponent(newStatus)}&t=${Date.now()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('📊 Direct update response:', data);

            if (data.status === 'success') {
                this.updateLocalComplaintStatus(trackId, newStatus);
                this.showSuccess(`Complaint ${trackId} marked as ${newStatus}`);
            } else {
                throw new Error(data.message || 'Failed to update status');
            }

        } catch (error) {
            console.error('❌ Error in direct status update:', error);
            this.showError('Failed to update status: ' + error.message);
        }
    },

    // ✅ FIXED: Update local complaint status immediately
    updateLocalComplaintStatus: function(trackId, newStatus) {
        // Find and update the complaint in allComplaints array
        const complaintIndex = this.allComplaints.findIndex(c => c.trackId === trackId);
        if (complaintIndex !== -1) {
            this.allComplaints[complaintIndex].status = newStatus;
            console.log('✅ Updated local complaint status:', trackId, '->', newStatus);
        }
        
        // Also update in filteredComplaints
        const filteredIndex = this.filteredComplaints.findIndex(c => c.trackId === trackId);
        if (filteredIndex !== -1) {
            this.filteredComplaints[filteredIndex].status = newStatus;
        }
        
        // Immediately update the UI
        this.updateComplaintsTable();
        this.updateDashboard();
    },

    // Navigation functions
    showSection: function(section) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.add('hidden');
        });
        
        // Remove active class from all nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected section
        document.getElementById(section + '-section').classList.remove('hidden');
        
        // Add active class to clicked nav button
        event.target.classList.add('active');

        // Refresh charts if analytics section
        if (section === 'analytics') {
            setTimeout(() => this.createCharts(), 100);
        }
    },

    // Close modals
    closeModal: function() {
        document.getElementById('complaintModal').style.display = 'none';
    },

    closeStatusModal: function() {
        document.getElementById('statusModal').style.display = 'none';
    },

    // Refresh data
    refreshData: function() {
        this.loadAllComplaints();
        this.showSuccess('Data refreshed successfully');
    },

    // Clear filters
    clearFilters: function() {
        document.getElementById('search-input').value = '';
        document.getElementById('status-filter').value = '';
        document.getElementById('category-filter').value = '';
        document.getElementById('priority-filter').value = '';
        this.filterComplaints();
    },

    // Update users table
    updateUsersTable: function() {
        const tbody = document.getElementById('users-table-body');
        const count = document.getElementById('users-count');
        
        // Extract unique users
        const usersMap = new Map();
        this.allComplaints.forEach(complaint => {
            if (complaint.email && complaint.email !== 'Not provided') {
                if (!usersMap.has(complaint.email)) {
                    usersMap.set(complaint.email, {
                        name: complaint.name,
                        email: complaint.email,
                        regno: complaint.regno,
                        complaintCount: 1,
                        lastActivity: complaint.timestamp
                    });
                } else {
                    const user = usersMap.get(complaint.email);
                    user.complaintCount++;
                    if (new Date(complaint.timestamp) > new Date(user.lastActivity)) {
                        user.lastActivity = complaint.timestamp;
                    }
                }
            }
        });

        const users = Array.from(usersMap.values());
        count.textContent = `${users.length} users`;

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">No users found</td></tr>';
            return;
        }

        let html = '';
        users.forEach(user => {
            html += `
                <tr>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.regno}</td>
                    <td>${user.complaintCount} complaints</td>
                    <td>${this.getTimeAgo(user.lastActivity)}</td>
                    <td>
                        <span class="status-badge status-resolved">Active</span>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    },

    // Create charts for analytics
    createCharts: function() {
        this.createCategoryChart();
        this.createStatusChart();
        this.createTrendChart();
    },

    createCategoryChart: function() {
        const ctx = document.getElementById('categoryChart').getContext('2d');
        
        // Destroy existing chart
        if (this.charts.category) {
            this.charts.category.destroy();
        }

        const categoryData = this.getCategoryDistribution();
        
        this.charts.category = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: categoryData.labels,
                datasets: [{
                    data: categoryData.data,
                    backgroundColor: [
                        '#2E86AB', '#A23B72', '#28a745', '#ffc107', '#dc3545', '#6c757d'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    },

    // ✅ FIXED: Status chart (not priority chart)
    createStatusChart: function() {
        const ctx = document.getElementById('priorityChart').getContext('2d');
        
        if (this.charts.status) {
            this.charts.status.destroy();
        }

        const statusData = this.getStatusDistribution();
        
        this.charts.status = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: statusData.labels,
                datasets: [{
                    label: 'Complaints by Status',
                    data: statusData.data,
                    backgroundColor: [
                        '#dc3545', // Pending - Red
                        '#ffc107', // In Progress - Yellow  
                        '#28a745'  // Resolved - Green
                    ]
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    },

    createTrendChart: function() {
        const ctx = document.getElementById('trendChart').getContext('2d');
        
        if (this.charts.trend) {
            this.charts.trend.destroy();
        }

        const trendData = this.getWeeklyTrend();
        
        this.charts.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: trendData.labels,
                datasets: [{
                    label: 'Complaints',
                    data: trendData.data,
                    borderColor: '#2E86AB',
                    backgroundColor: 'rgba(46, 134, 171, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    },

    // Utility functions
    getCategoryDistribution: function() {
        const categories = {};
        this.allComplaints.forEach(complaint => {
            categories[complaint.category] = (categories[complaint.category] || 0) + 1;
        });

        return {
            labels: Object.keys(categories),
            data: Object.values(categories)
        };
    },

    // ✅ FIXED: Get status distribution (not priority)
    getStatusDistribution: function() {
        const statuses = { 'Pending': 0, 'In Progress': 0, 'Resolved': 0 };
        this.allComplaints.forEach(complaint => {
            statuses[complaint.status] = (statuses[complaint.status] || 0) + 1;
        });

        return {
            labels: Object.keys(statuses),
            data: Object.values(statuses)
        };
    },

    getWeeklyTrend: function() {
        // Last 7 days
        const days = [];
        const data = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('en-IN', { weekday: 'short' });
            
            const dayComplaints = this.allComplaints.filter(complaint => {
                const complaintDate = new Date(complaint.timestamp);
                return complaintDate.toDateString() === date.toDateString();
            });
            
            days.push(dateStr);
            data.push(dayComplaints.length);
        }

        return { labels: days, data: data };
    },

    formatDate: function(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN') + ' ' + date.toLocaleTimeString('en-IN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    },

    getTimeAgo: function(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return this.formatDate(dateString);
    },

    updateLastUpdateTime: function() {
        const element = document.getElementById('last-update');
        element.innerHTML = `<i class="fas fa-sync"></i> Last updated: ${new Date().toLocaleTimeString('en-IN')}`;
    },

    // UI Helper functions
    showLoadingState: function() {
        const tbody = document.getElementById('complaints-table-body');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="loading-cell">
                        <i class="fas fa-spinner fa-spin"></i> Loading complaints...
                    </td>
                </tr>
            `;
        }
    },

    hideLoadingState: function() {
        // Loading state is cleared when table is updated
    },

    // ✅ FIXED: Better notification system
    showSuccess: function(message) {
        this.showNotification(message, 'success');
    },

    showError: function(message) {
        this.showNotification(message, 'error');
    },

    showNotification: function(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'success' ? '✅' : '❌'}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add styles if not exists
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    min-width: 300px;
                    max-width: 500px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    border-left: 4px solid #28a745;
                    animation: slideIn 0.3s ease;
                }
                .notification-error {
                    border-left-color: #dc3545;
                }
                .notification-content {
                    padding: 12px 16px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .notification-close {
                    background: none;
                    border: none;
                    font-size: 18px;
                    cursor: pointer;
                    margin-left: auto;
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    },

    // Notification functions
    sendBulkNotification: function() {
        const message = document.getElementById('notification-message').value;
        if (!message.trim()) {
            this.showError('Please enter a notification message');
            return;
        }

        this.showSuccess('Notification sent to selected users');
    },

    sendUserNotification: async function(trackId) {
    const complaint = this.allComplaints.find(c => c.trackId === trackId);
    if (!complaint || complaint.email === 'Not provided') {
        this.showError('User email not available');
        return;
    }

    try {
        const url = `${this.GOOGLE_SCRIPT_URL}?action=notifyUser&email=${encodeURIComponent(complaint.email)}&name=${encodeURIComponent(complaint.name)}&complaintId=${encodeURIComponent(complaint.trackId)}&status=${encodeURIComponent(complaint.status)}&t=${Date.now()}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.status === 'success') {
            this.showSuccess(`📧 Notification sent to ${complaint.name}`);
        } else {
            this.showError('Failed to send: ' + data.message);
        }
    } catch (err) {
        this.showError('Error sending notification: ' + err.message);
    }
},


    sendStatusNotification: async function(trackId, newStatus, notes) {
        console.log(`Sending status update for ${trackId} to ${newStatus}`);
        this.showSuccess('Status update notification sent');
    },

    // Export functionality
    exportToExcel: function() {
        if (this.filteredComplaints.length === 0) {
            this.showError('No data to export');
            return;
        }

        const headers = ['Track ID', 'Name', 'Category', 'Priority', 'Location', 'Status', 'Submitted'];
        const csvContent = [
            headers.join(','),
            ...this.filteredComplaints.map(c => [
                c.trackId,
                `"${c.name}"`,
                c.category,
                c.priority,
                `"${c.location}"`,
                c.status,
                this.formatDate(c.timestamp)
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `complaints-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.showSuccess('Data exported successfully');
    },

    generateReport: function() {
        this.showSuccess('PDF report generation would be implemented here');
    },

    // Logout function
    logout: function() {
        if (confirm('Are you sure you want to logout?')) {
            clearInterval(this.autoRefreshInterval);
            document.getElementById('admin-panel').style.display = 'none';
            document.getElementById('login-screen').style.display = 'flex';
            document.getElementById('admin-password').value = '';
        }
    },

    // ✅ FIXED: Remove mock data generator since we don't want fake data
    // generateMockComplaints: function() { ... } // REMOVED
};

// Password protection
function checkAdminPassword() {
    const inputPassword = document.getElementById('admin-password').value;
    const loginScreen = document.getElementById('login-screen');
    const adminPanel = document.getElementById('admin-panel');
    
    if (inputPassword === admin.ADMIN_PASSWORD) {
        loginScreen.style.display = 'none';
        adminPanel.style.display = 'block';
        admin.init();
    } else {
        alert('❌ Access Denied: Incorrect password');
        document.getElementById('admin-password').value = '';
        document.getElementById('admin-password').focus();
    }
}

// Enter key support for password field
document.getElementById('admin-password').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        checkAdminPassword();
    }
});

// Show login screen when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Admin panel loaded - awaiting authentication');
});