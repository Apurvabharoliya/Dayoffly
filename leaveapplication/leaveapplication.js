document.addEventListener('DOMContentLoaded', function() {
            // Toggle form visibility
            const applyButton = document.getElementById('applyButton');
            const applicationForm = document.getElementById('applicationForm');
            const cancelButton = document.getElementById('cancelButton');
            
            applyButton.addEventListener('click', function() {
                applicationForm.style.display = 'block';
                applyButton.style.display = 'none';
                // Scroll to form
                applicationForm.scrollIntoView({ behavior: 'smooth' });
            });
            
            cancelButton.addEventListener('click', function() {
                applicationForm.style.display = 'none';
                applyButton.style.display = 'block';
            });
            
            // Date calculation and calendar display
            const startDateInput = document.getElementById('startDate');
            const endDateInput = document.getElementById('endDate');
            
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
            
            startDateInput.value = formatDate(today);
            endDateInput.value = formatDate(tomorrow);
            
            // Half day option toggle
            const halfDayCheckbox = document.getElementById('halfDay');
            const halfDaySelect = document.getElementById('halfDayOption');
            
            halfDayCheckbox.addEventListener('change', function() {
                halfDaySelect.disabled = !this.checked;
            });
            
            // Leave type input
            const leaveTypeInput = document.getElementById('leaveType');
            const customLeaveType = document.getElementById('customLeaveType');
            
            // Update leave type when custom input changes
            customLeaveType.addEventListener('input', function() {
                if (this.value.trim() !== '') {
                    leaveTypeInput.value = this.value.trim();
                }
            });
            
            // Toast notification function
            function showToast(title, message, type = 'success') {
                const toastContainer = document.getElementById('toastContainer');
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
            
            // Form submission
            document.getElementById('leaveForm').addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Validate form
                const leaveType = customLeaveType.value.trim();
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