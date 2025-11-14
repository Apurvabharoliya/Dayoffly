// Toast notification function (moved outside DOMContentLoaded for global scope)
function showToast(title, message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return; // Guard clause if container doesn't exist

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    toast.innerHTML = `
                <div class="toast-icon">
                    <i class="fas fa-check"></i>
                </div>
                <div class="toast-content">
                    <div class="toast-title">${title}</div>
                    <div class="toast-message">${message}</div>
                </div>
                <button class="toast-close">&times;</button>
            `;

    toastContainer.appendChild(toast);

    // Show toast with animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Close button event
    const closeButton = toast.querySelector('.toast-close');
    closeButton.addEventListener('click', () => {
        hideToast(toast);
    });

    // Auto hide after 5 seconds
    setTimeout(() => {
        hideToast(toast);
    }, 5000);
}

function hideToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => {
        toast.remove();
    }, 300);
}

document.addEventListener('DOMContentLoaded', async function () {
    // Update user avatar
    await updateUserAvatar();

    // Fetch and display live leave balance data
    await loadLeaveBalance();

    // Fetch and display leave history
    await loadLeaveHistory();

    // Load leave types from database
    await loadLeaveTypes();
    // Toggle form visibility
    const applyButton = document.getElementById('applyButton');
    const applicationForm = document.getElementById('applicationForm');
    const cancelButton = document.getElementById('cancelButton');

    applyButton.addEventListener('click', function () {
        applicationForm.style.display = 'block';
        applyButton.style.display = 'none';
        // Scroll to form
        applicationForm.scrollIntoView({ behavior: 'smooth' });
    });

    cancelButton.addEventListener('click', function () {
        applicationForm.style.display = 'none';
        applyButton.style.display = 'block';
    });

    // Date calculation and calendar display
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const leaveTypeInput = document.getElementById('leaveType');

    // Set default dates (today and tomorrow)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Format dates for input fields (YYYY-MM-DD)
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Check if a date was selected from calendar
    const selectedLeaveDate = localStorage.getItem('selectedLeaveDate');
    if (selectedLeaveDate) {
        // Pre-fill the start date with selected date
        startDateInput.value = selectedLeaveDate;

        // Set end date to the same date (single day leave)
        endDateInput.value = selectedLeaveDate;

        // Clear the stored date
        localStorage.removeItem('selectedLeaveDate');

        // Show a toast notification
        setTimeout(() => {
            showToast('Info', 'Date pre-filled from calendar selection', 'success');
        }, 500);
    } else {
        // Default behavior - today and tomorrow
        startDateInput.value = formatDate(today);
        endDateInput.value = formatDate(tomorrow);
    }

    // Half day option toggle
    const halfDayCheckbox = document.getElementById('halfDay');
    const halfDaySelect = document.getElementById('halfDayOption');

    halfDayCheckbox.addEventListener('change', function () {
        halfDaySelect.disabled = !this.checked;
    });

    // Leave type select is now handled by loadLeaveTypes function

    // File upload handling
    const fileInput = document.getElementById('attachment');
    const fileLabel = document.querySelector('.file-label');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const removeFileBtn = document.getElementById('removeFile');

    if (fileInput && fileLabel && fileInfo && fileName && removeFileBtn) {
        fileInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                // Validate file size (max 5MB)
                const maxSize = 5 * 1024 * 1024; // 5MB in bytes
                if (file.size > maxSize) {
                    showToast('Error', 'File size must be less than 5MB', 'error');
                    fileInput.value = '';
                    return;
                }

                // Validate file type
                const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
                if (!allowedTypes.includes(file.type)) {
                    showToast('Error', 'Please upload a valid file type (PDF, JPG, PNG, DOC, DOCX)', 'error');
                    fileInput.value = '';
                    return;
                }

                fileName.textContent = file.name;
                fileInfo.style.display = 'flex';
                fileLabel.style.display = 'none';
            }
        });

        removeFileBtn.addEventListener('click', function () {
            fileInput.value = '';
            fileInfo.style.display = 'none';
            fileLabel.style.display = 'block';
        });
    }

    // Form submission
    document.getElementById('leaveForm').addEventListener('submit', function (e) {
        e.preventDefault();

        // Validate form
        const leaveType = leaveTypeInput.value;
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        const reason = document.getElementById('reason').value;

        if (!leaveType || !startDate || !endDate || !reason) {
            showToast('Error', 'Please fill in all required fields', 'error');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            showToast('Error', 'End date must be after start date', 'error');
            return;
        }

        // Create and show custom popup
        const popup = document.createElement('div');
        popup.className = 'custom-popup';
        popup.innerHTML = `
                    <div class="popup-content">
                        <div class="popup-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <h3>Application Submitted</h3>
                        <p>Your leave application for <strong>${leaveType}</strong> has been submitted successfully!</p>
                        <button class="popup-close-btn">OK</button>
                    </div>
                `;

        // Submit the form data to backend
        submitLeaveApplication({
            leaveType: leaveType,
            startDate: startDate,
            endDate: endDate,
            reason: reason,
            halfDay: halfDayCheckbox.checked,
            halfDayOption: halfDayCheckbox.checked ? halfDaySelect.value : null,
            handover: document.getElementById('handover').value,
            attachment: document.getElementById('attachment').files[0] || null
        });

        document.body.appendChild(popup);

        // Add show class after a small delay for animation
        setTimeout(() => {
            popup.classList.add('show');
        }, 10);

        // Close button event
        const closeButton = popup.querySelector('.popup-close-btn');
        closeButton.addEventListener('click', () => {
            popup.classList.remove('show');
            setTimeout(() => {
                popup.remove();
            }, 300);

            // Hide form and show apply button
            applicationForm.style.display = 'none';
            applyButton.style.display = 'block';

            // Reset form
            document.getElementById('leaveForm').reset();
            // Reset dates to defaults
            startDateInput.value = formatDate(today);
            endDateInput.value = formatDate(tomorrow);
        });

        // Also close when clicking outside the popup content
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                closeButton.click();
            }
        });
    });
});

// Function to fetch and display live leave balance
async function loadLeaveBalance() {
    try {
        const token = localStorage.getItem('authToken');
        const headers = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('http://127.0.0.1:5000/api/dashboard-data', {
            credentials: 'include',
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Update leave balance cards with live data
        const stats = data.stats;

        // Update Annual Leave (assuming this is total allowed)
        const annualLeaveCard = document.querySelector('.card.annual-leave .card-value');
        if (annualLeaveCard) {
            annualLeaveCard.textContent = stats.totalAllowed || 20;
        }

        // Update Total Taken (this year)
        const totalTakenCard = document.querySelector('.card.total-taken .card-value');
        if (totalTakenCard) {
            totalTakenCard.textContent = stats.totalUsed || 0;
        }

        // Calculate and display remaining leaves
        const remainingLeaves = (stats.totalAllowed || 20) - (stats.totalUsed || 0);
        const remainingCard = document.querySelector('.card.sick-leave .card-value');
        if (remainingCard) {
            remainingCard.textContent = Math.max(0, remainingLeaves);
        }

        console.log('✓ Leave balance updated with live data');

    } catch (error) {
        console.error('Error fetching leave balance:', error);
        // Keep default values if API fails
    }
}

// Function to fetch and display leave history
async function loadLeaveHistory() {
    try {
        const token = localStorage.getItem('authToken');
        const headers = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Use the leave status API to get leave requests
        const response = await fetch('http://127.0.0.1:5000/api/leave-status-data', {
            credentials: 'include',
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const leaveRequests = data.leaveRequests || [];

        // Update leave history table
        const tableBody = document.querySelector('.history-table tbody');
        if (tableBody && leaveRequests.length > 0) {
            tableBody.innerHTML = ''; // Clear existing rows

            leaveRequests.slice(0, 10).forEach(request => { // Show last 10 requests
                const row = document.createElement('tr');

                // Status badge
                const statusClass = `status-${request.status.toLowerCase()}`;
                const statusText = request.status.charAt(0).toUpperCase() + request.status.slice(1);

                row.innerHTML = `
                            <td><span class="status ${statusClass}">${statusText}</span></td>
                            <td>${request.leaveType}</td>
                            <td>${request.totalDays} days</td>
                            <td>${request.appliedDate}</td>
                        `;

                tableBody.appendChild(row);
            });
        }

        console.log('✓ Leave history updated with live data');

    } catch (error) {
        console.error('Error fetching leave history:', error);
        // Keep default table if API fails
    }
}

// Function to load leave types from database
async function loadLeaveTypes() {
    try {
        const token = localStorage.getItem('authToken');
        const headers = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('http://127.0.0.1:5000/api/leave-types', {
            credentials: 'include',
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const leaveTypes = data.leaveTypes || [];

        // Populate the leave type select dropdown
        const leaveTypeSelect = document.getElementById('leaveType');
        if (leaveTypeSelect && leaveTypes.length > 0) {
            // Clear existing options except the first one
            leaveTypeSelect.innerHTML = '<option value="">Select Leave Type</option>';

            // Add options from database
            leaveTypes.forEach(leaveType => {
                const option = document.createElement('option');
                option.value = leaveType.leave_name || leaveType.leave_type;
                option.textContent = leaveType.leave_name || leaveType.leave_type;
                option.title = leaveType.rules || 'Standard leave rules apply';
                // Store additional data for validation
                option.setAttribute('data-requires-document', leaveType.requires_document);
                option.setAttribute('data-max-days', leaveType.max_days);
                option.setAttribute('data-is-paid', leaveType.is_paid);
                leaveTypeSelect.appendChild(option);
            });
        }

        console.log('✓ Leave types loaded from database');

    } catch (error) {
        console.error('Error fetching leave types:', error);
        // Fallback to default options if API fails
        const leaveTypeSelect = document.getElementById('leaveType');
        if (leaveTypeSelect) {
            leaveTypeSelect.innerHTML = `
                <option value="">Select Leave Type</option>
                <option value="Casual Leave">Casual Leave</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Vacation">Vacation</option>
                <option value="Maternity Leave">Maternity Leave</option>
                <option value="Paternity Leave">Paternity Leave</option>
            `;
        }
    }
}

// Function to submit leave application to backend
async function submitLeaveApplication(formData) {
    try {
        const token = localStorage.getItem('authToken');
        const headers = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Prepare form data for submission
        const submitData = {
            leaveType: formData.leaveType,
            startDate: formData.startDate,
            endDate: formData.endDate,
            reason: formData.reason,
            halfDay: formData.halfDay,
            halfDayOption: formData.halfDayOption,
            handover: formData.handover,
            employeeType: document.getElementById('employeeType').value,
            leaveCategory: document.getElementById('leaveCategory').value,
            contactInfo: document.getElementById('contactInfo').value
        };

        // Handle file attachment if present
        if (formData.attachment) {
            // Convert file to base64 for storage in database
            const base64File = await fileToBase64(formData.attachment);
            submitData.attachment = base64File;
            submitData.attachmentName = formData.attachment.name;
            submitData.attachmentType = formData.attachment.type;
        }

        console.log('Submitting leave application:', submitData);

        // Submit to backend API
        const response = await fetch('http://127.0.0.1:5000/api/leave-application', {
            method: 'POST',
            credentials: 'include',
            headers: headers,
            body: JSON.stringify(submitData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Leave application submitted successfully:', result);

        // Show success message
        showToast('Success', 'Leave application submitted successfully!', 'success');

    } catch (error) {
        console.error('Error submitting leave application:', error);
        // Show error toast if submission fails
        showToast('Error', 'Failed to submit leave application. Please try again.', 'error');
    }
}

// Function to update user avatar
async function updateUserAvatar() {
    try {
        const token = localStorage.getItem('authToken');
        const headers = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('http://127.0.0.1:5000/api/dashboard-data', {
            credentials: 'include',
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const userInfo = data.user_info;

        if (userInfo && userInfo.user_name) {
            const avatarImg = document.getElementById('user-avatar-img');
            if (avatarImg) {
                const userName = userInfo.user_name;
                const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=667eea&color=fff&size=36`;
                avatarImg.src = avatarUrl;
                avatarImg.alt = `${userName}'s Avatar`;
            }
        }
    } catch (error) {
        console.error('Error updating user avatar:', error);
        // Keep default avatar if API fails
    }
}

// Helper function to convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}