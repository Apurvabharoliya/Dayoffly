document.addEventListener('DOMContentLoaded', async function () {
    // Update user avatar
    await updateUserAvatar();

    const monthCalendar = document.getElementById('month-calendar');
    const currentMonthElement = document.querySelector('.current-month');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const syncBtn = document.getElementById('sync-btn');
    const appsBtn = document.getElementById('apps-btn');
    const reportsBtn = document.getElementById('reports-btn');
    const leaveStatusBtn = document.getElementById('leave-status-btn');
    const dateModal = document.getElementById('date-modal');
    const closeModal = document.getElementById('close-modal');
    const cancelBtn = document.getElementById('cancel-btn');
    const requestLeaveBtn = document.getElementById('request-leave-btn');
    const modalDateTitle = document.getElementById('modal-date-title');
    const modalBody = document.getElementById('modal-body');

    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let selectedDate = new Date();

    // Sample leave data - approved and pending leaves
    const leaveData = {
        // Current month - Approved leaves
        '2025-6-10': { type: 'vacation', title: 'Vacation', status: 'approved' },
        '2025-6-11': { type: 'vacation', title: 'Vacation', status: 'approved' },
        '2025-6-12': { type: 'vacation', title: 'Vacation', status: 'approved' },
        '2025-6-20': { type: 'sick', title: 'Sick Leave', status: 'approved' },

        // Current month - Pending leaves
        '2025-6-25': { type: 'personal', title: 'Personal Day', status: 'pending' },
        '2025-6-26': { type: 'personal', title: 'Personal Day', status: 'pending' },

        // Next month leaves
        '2025-7-5': { type: 'vacation', title: 'Summer Break', status: 'approved' },
        '2025-7-6': { type: 'vacation', title: 'Summer Break', status: 'approved' },
        '2025-7-7': { type: 'vacation', title: 'Summer Break', status: 'approved' },
        '2025-7-15': { type: 'sick', title: 'Medical', status: 'pending' },

        // Previous month leaves
        '2025-5-12': { type: 'personal', title: 'Family Event', status: 'approved' },
    };

    // Holiday data - will be fetched from API
    let holidayData = {};

    // Function to fetch holidays from dashboard API
    async function loadHolidays() {
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
            const holidays = data.holidays || [];

            // Convert holidays to the format expected by calendar
            holidays.forEach(holiday => {
                const dateKey = holiday.date; // Already in YYYY-MM-DD format
                holidayData[dateKey] = {
                    type: 'holiday',
                    title: holiday.name,
                    status: 'holiday'
                };
            });

            console.log('✓ Holidays loaded from API:', holidayData);
            return true;
        } catch (error) {
            console.error('Error fetching holidays:', error);
            // Use fallback holiday data if API fails
            holidayData = {
                '2025-01-26': { type: 'holiday', title: 'Republic Day', status: 'holiday' },
                '2025-03-14': { type: 'holiday', title: 'Holi', status: 'holiday' },
                '2025-08-15': { type: 'holiday', title: 'Independence Day', status: 'holiday' },
                '2025-10-02': { type: 'holiday', title: 'Gandhi Jayanti', status: 'holiday' },
                '2025-12-25': { type: 'holiday', title: 'Christmas', status: 'holiday' }
            };
            return false;
        }
    }

    // Function to generate calendar days for month view
    function generateMonthCalendar(month, year) {
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        currentMonthElement.textContent = `${monthNames[month]} ${year}`;

        // Clear previous calendar days
        while (monthCalendar.children.length > 7) {
            monthCalendar.removeChild(monthCalendar.lastChild);
        }

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Add empty days for the first week
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day';
            monthCalendar.appendChild(emptyDay);
        }

        // Add days for the month
        for (let i = 1; i <= daysInMonth; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            const dateKey = `${year}-${month + 1}-${i}`;
            dayElement.setAttribute('data-date', dateKey);

            // Check if weekend
            const dayOfWeek = new Date(year, month, i).getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                dayElement.classList.add('weekend');
            }

            // Check if today
            if (i === currentDate.getDate() && month === currentDate.getMonth() && year === currentDate.getFullYear()) {
                dayElement.classList.add('today');
            }

            // Check if selected date
            if (i === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear()) {
                dayElement.classList.add('selected');
            }

            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = i;
            dayElement.appendChild(dayNumber);

            // Add leave markers if applicable
            if (leaveData[dateKey]) {
                const leaveMarker = document.createElement('div');
                const leave = leaveData[dateKey];
                leaveMarker.className = `leave-marker ${leave.type}-leave ${leave.status}-status`;
                leaveMarker.textContent = leave.title;
                dayElement.appendChild(leaveMarker);

                // Add status indicator
                const statusIndicator = document.createElement('div');
                statusIndicator.className = `status-indicator ${leave.status}`;
                statusIndicator.title = leave.status === 'approved' ? 'Approved' : 'Pending';
                dayElement.appendChild(statusIndicator);
            }

            // Add holiday markers if applicable
            if (holidayData[dateKey]) {
                const holidayMarker = document.createElement('div');
                const holiday = holidayData[dateKey];
                holidayMarker.className = `leave-marker ${holiday.type}-leave ${holiday.status}-status`;
                holidayMarker.textContent = holiday.title;
                dayElement.appendChild(holidayMarker);

                // Add holiday indicator
                const holidayIndicator = document.createElement('div');
                holidayIndicator.className = `status-indicator ${holiday.status}`;
                holidayIndicator.title = 'Public Holiday';
                dayElement.appendChild(holidayIndicator);
            }

            // Add click event to select date
            dayElement.addEventListener('click', function () {
                // Remove selected class from all days
                document.querySelectorAll('.calendar-day').forEach(day => {
                    day.classList.remove('selected');
                });

                // Add selected class to clicked day
                dayElement.classList.add('selected');

                // Update selected date
                selectedDate = new Date(year, month, i);

                // Check if this date has leave or holiday - if so, show details modal
                const dateKey = `${year}-${month + 1}-${i}`;
                if (leaveData[dateKey] || holidayData[dateKey]) {
                    // Show date details modal for dates with leave/holiday
                    showDateDetails(year, month + 1, i);
                } else {
                    // For empty dates, redirect to leave application with pre-filled date
                    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

                    // Store selected date in localStorage for the leave application form
                    localStorage.setItem('selectedLeaveDate', formattedDate);

                    // Redirect to leave application page
                    window.location.href = '../leaveapplication/leaveapplication.html';
                }
            });

            monthCalendar.appendChild(dayElement);
        }

        // Update upcoming leaves sidebar
        updateUpcomingLeaves();
    }

    // Function to update upcoming leaves in sidebar
    function updateUpcomingLeaves() {
        const upcomingLeavesContainer = document.querySelector('.upcoming-leaves');
        // Remove existing items except the title
        const existingItems = upcomingLeavesContainer.querySelectorAll('.upcoming-item');
        existingItems.forEach(item => item.remove());

        // Get upcoming leaves (next 30 days)
        const today = new Date();
        const nextMonth = new Date(today);
        nextMonth.setDate(today.getDate() + 30);

        const upcomingLeaves = [];

        for (const dateKey in leaveData) {
            const [year, month, day] = dateKey.split('-').map(Number);
            const leaveDate = new Date(year, month - 1, day);

            if (leaveDate >= today && leaveDate <= nextMonth) {
                upcomingLeaves.push({
                    date: leaveDate,
                    data: leaveData[dateKey]
                });
            }
        }

        // Sort by date
        upcomingLeaves.sort((a, b) => a.date - b.date);

        // Display upcoming leaves (max 5)
        if (upcomingLeaves.length === 0) {
            const noLeavesItem = document.createElement('div');
            noLeavesItem.className = 'upcoming-item';
            noLeavesItem.innerHTML = `
                <div class="color-indicator"></div>
                <div>
                    <div class="upcoming-date">No upcoming leaves</div>
                    <div>All leaves are displayed on the calendar</div>
                </div>
            `;
            upcomingLeavesContainer.appendChild(noLeavesItem);
        } else {
            upcomingLeaves.slice(0, 5).forEach(leave => {
                const leaveItem = document.createElement('div');
                leaveItem.className = 'upcoming-item';

                const options = { month: 'short', day: 'numeric' };
                const formattedDate = leave.date.toLocaleDateString('en-US', options);

                leaveItem.innerHTML = `
                    <div class="color-indicator ${leave.data.type}"></div>
                    <div>
                        <div class="upcoming-date">${formattedDate}</div>
                        <div>${leave.data.title} (${leave.data.status})</div>
                    </div>
                `;
                upcomingLeavesContainer.appendChild(leaveItem);
            });
        }
    }

    // Function to show date details in modal
    function showDateDetails(year, month, day) {
        const dateKey = `${year}-${month}-${day}`;
        const date = new Date(year, month - 1, day);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = date.toLocaleDateString('en-US', options);

        modalDateTitle.textContent = formattedDate;

        let modalContent = '';

        if (leaveData[dateKey]) {
            const leave = leaveData[dateKey];
            const statusClass = leave.status === 'approved' ? 'status-approved' : 'status-pending';

            modalContent = `
                <div class="leave-details">
                    <p><strong>Leave Type:</strong> <span class="leave-type ${leave.type}">${leave.title}</span></p>
                    <p><strong>Status:</strong> <span class="status-badge ${statusClass}">${leave.status}</span></p>
                    <p><strong>Date:</strong> ${formattedDate}</p>
                </div>
            `;

            // Hide request leave button for dates with existing leaves
            requestLeaveBtn.style.display = 'none';
        } else if (holidayData[dateKey]) {
            const holiday = holidayData[dateKey];

            modalContent = `
                <div class="holiday-details">
                    <p><strong>Holiday:</strong> <span class="leave-type ${holiday.type}">${holiday.title}</span></p>
                    <p><strong>Type:</strong> <span class="status-badge status-holiday">Public Holiday</span></p>
                    <p><strong>Date:</strong> ${formattedDate}</p>
                </div>
            `;

            // Hide request leave button for holidays
            requestLeaveBtn.style.display = 'none';
        } else {
            modalContent = `
                <div class="no-leave-details">
                    <p>No scheduled leaves for this date.</p>
                    <p>You can request leave for this date.</p>
                </div>
            `;

            // Show request leave button for empty dates
            requestLeaveBtn.style.display = 'block';
        }

        modalBody.innerHTML = modalContent;
        dateModal.style.display = 'flex';
    }

    // Initialize calendar with holidays
    async function initializeCalendar() {
        await loadHolidays();
        generateMonthCalendar(currentMonth, currentYear);
    }

    initializeCalendar();

    // Navigation buttons
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', function () {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            generateMonthCalendar(currentMonth, currentYear);
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', function () {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            generateMonthCalendar(currentMonth, currentYear);
        });
    }

    // Sync Calendar button
    if (syncBtn) {
        syncBtn.addEventListener('click', function () {
            // Show loading state
            syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Syncing...';
            syncBtn.disabled = true;

            // Refresh calendar data by reloading holidays and regenerating calendar
            setTimeout(async function () {
                try {
                    // Reload holidays from API
                    await loadHolidays();

                    // Regenerate current month calendar
                    generateMonthCalendar(currentMonth, currentYear);

                    // Show success message
                    showToast('Success', 'Calendar synced successfully!', 'success');

                } catch (error) {
                    console.error('Error syncing calendar:', error);
                    showToast('Error', 'Failed to sync calendar. Please try again.', 'error');
                } finally {
                    // Reset button state
                    syncBtn.innerHTML = '<i class="fas fa-sync"></i> Sync Calendar';
                    syncBtn.disabled = false;
                }
            }, 1500);
        });
    }

    // Apps button
    if (appsBtn) {
        appsBtn.addEventListener('click', function () {
            alert('This would open the applications menu in a real application.');
        });
    }

    // Reports & Analytics button
    if (reportsBtn) {
        reportsBtn.addEventListener('click', function () {
            alert('This would navigate to the Reports & Analytics page in a real application.');
        });
    }

    // Leave Status button
    if (leaveStatusBtn) {
        leaveStatusBtn.addEventListener('click', function () {
            alert('This would navigate to the Leave Status page in a real application.');
        });
    }

    // Modal functionality
    if (closeModal) {
        closeModal.addEventListener('click', function () {
            dateModal.style.display = 'none';
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', function () {
            dateModal.style.display = 'none';
        });
    }

    if (requestLeaveBtn) {
        requestLeaveBtn.addEventListener('click', function () {
            // Redirect to leave application page
            window.location.href = '../leaveapplication/leaveapplication.html';
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', function (event) {
        if (dateModal && event.target === dateModal) {
            dateModal.style.display = 'none';
        }
    });
});

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
