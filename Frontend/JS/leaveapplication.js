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
    const totalDaysElement = document.getElementById('totalDays');
    const calendarPreview = document.getElementById('calendarPreview');
    
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
    
    // Calculate days function
    function calculateDays() {
        const startDate = new Date(startDateInput.value);
        const endDate = new Date(endDateInput.value);
        
        if (startDate && endDate && startDate <= endDate) {
            const timeDiff = endDate.getTime() - startDate.getTime();
            const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
            totalDaysElement.textContent = `Total days: ${dayDiff}`;
            
            // Show calendar if more than one day is selected
            if (dayDiff > 1) {
                calendarPreview.style.display = 'block';
                renderCalendars(startDate, endDate);
            } else {
                calendarPreview.style.display = 'none';
            }
        } else {
            totalDaysElement.textContent = 'Total days: 0';
            calendarPreview.style.display = 'none';
        }
    }
    
    // Initial calculation
    calculateDays();
    
    // Add event listeners for date changes
    startDateInput.addEventListener('change', calculateDays);
    endDateInput.addEventListener('change', calculateDays);
    
    // Calendar functionality
    let currentStartMonth = new Date().getMonth();
    let currentStartYear = new Date().getFullYear();
    let currentEndMonth = new Date().getMonth();
    let currentEndYear = new Date().getFullYear();
    
    // Initialize calendars
    renderCalendar('start', currentStartMonth, currentStartYear);
    renderCalendar('end', currentEndMonth, currentEndYear);
    
    // Navigation buttons
    document.getElementById('prevMonthStart').addEventListener('click', function() {
        currentStartMonth--;
        if (currentStartMonth < 0) {
            currentStartMonth = 11;
            currentStartYear--;
        }
        renderCalendar('start', currentStartMonth, currentStartYear);
    });
    
    document.getElementById('nextMonthStart').addEventListener('click', function() {
        currentStartMonth++;
        if (currentStartMonth > 11) {
            currentStartMonth = 0;
            currentStartYear++;
        }
        renderCalendar('start', currentStartMonth, currentStartYear);
    });
    
    document.getElementById('prevMonthEnd').addEventListener('click', function() {
        currentEndMonth--;
        if (currentEndMonth < 0) {
            currentEndMonth = 11;
            currentEndYear--;
        }
        renderCalendar('end', currentEndMonth, currentEndYear);
    });
    
    document.getElementById('nextMonthEnd').addEventListener('click', function() {
        currentEndMonth++;
        if (currentEndMonth > 11) {
            currentEndMonth = 0;
            currentEndYear++;
        }
        renderCalendar('end', currentEndMonth, currentEndYear);
    });
    
    // Render calendar function
    function renderCalendar(type, month, year) {
        const calendarGrid = document.getElementById(`${type}CalendarGrid`);
        const monthHeader = document.getElementById(`${type}Month`);
        
        // Set month header
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        monthHeader.textContent = `${monthNames[month]} ${year}`;
        
        // Clear previous calendar
        calendarGrid.innerHTML = '';
        
        // Add day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            const headerCell = document.createElement('div');
            headerCell.className = 'calendar-cell header';
            headerCell.textContent = day;
            calendarGrid.appendChild(headerCell);
        });
        
        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-cell';
            calendarGrid.appendChild(emptyCell);
        }
        
        // Add days of the month
        const startDate = new Date(startDateInput.value);
        const endDate = new Date(endDateInput.value);
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-cell day';
            dayCell.textContent = day;
            
            const cellDate = new Date(year, month, day);
            
            // Check if this day is selected
            if (startDate && endDate) {
                if (cellDate.getTime() === startDate.getTime()) {
                    dayCell.classList.add('selected');
                } else if (cellDate > startDate && cellDate < endDate) {
                    dayCell.classList.add('in-range');
                } else if (cellDate.getTime() === endDate.getTime()) {
                    dayCell.classList.add('selected');
                }
            }
            
            // Add click event to select date
            dayCell.addEventListener('click', function() {
                if (type === 'start') {
                    startDateInput.value = formatDate(cellDate);
                    // If start date is after end date, update end date
                    if (endDateInput.value && cellDate > new Date(endDateInput.value)) {
                        endDateInput.value = formatDate(cellDate);
                    }
                } else {
                    endDateInput.value = formatDate(cellDate);
                    // If end date is before start date, update start date
                    if (startDateInput.value && cellDate < new Date(startDateInput.value)) {
                        startDateInput.value = formatDate(cellDate);
                    }
                }
                calculateDays();
            });
            
            calendarGrid.appendChild(dayCell);
        }
    }
    
    // Render both calendars with selected dates highlighted
    function renderCalendars(start, end) {
        // Update start calendar to show start date's month
        currentStartMonth = start.getMonth();
        currentStartYear = start.getFullYear();
        renderCalendar('start', currentStartMonth, currentStartYear);
        
        // Update end calendar to show end date's month
        currentEndMonth = end.getMonth();
        currentEndYear = end.getFullYear();
        renderCalendar('end', currentEndMonth, currentEndYear);
    }
    
    // Half day option toggle
    const halfDayCheckbox = document.getElementById('halfDay');
    const halfDaySelect = document.getElementById('halfDayOption');
    
    halfDayCheckbox.addEventListener('change', function() {
        halfDaySelect.disabled = !this.checked;
        calculateDays(); // Recalculate days if half day is selected
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
        
        // Create and show custom popup
        const popup = document.createElement('div');
        popup.className = 'custom-popup';
        popup.innerHTML = `
            <div class="popup-content">
                <div class="popup-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h3>Application Submitted</h3>
                <p>Your leave application has been submitted successfully!</p>
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
        });
        
        // Also close when clicking outside the popup content
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                closeButton.click();
            }
        });
    });
});