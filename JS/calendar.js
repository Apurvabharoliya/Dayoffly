document.addEventListener('DOMContentLoaded', function() {
        const monthCalendar = document.getElementById('month-calendar');
        const weekCalendar = document.getElementById('week-calendar');
        const dayViewContainer = document.getElementById('day-view-container');
        const weekGrid = document.getElementById('week-grid');
        const dayViewTitle = document.getElementById('day-view-title');
        const dayViewContent = document.getElementById('day-view-content');
        const currentMonthElement = document.querySelector('.current-month');
        const prevMonthBtn = document.getElementById('prev-month');
        const nextMonthBtn = document.getElementById('next-month');
        const monthViewBtn = document.getElementById('month-view');
        const weekViewBtn = document.getElementById('week-view');
        const dayViewBtn = document.getElementById('day-view');
        const toggleButtons = document.querySelectorAll('.toggle-btn');
        
        let currentDate = new Date();
        let currentMonth = currentDate.getMonth();
        let currentYear = currentDate.getFullYear();
        let selectedDate = new Date();
        let currentView = 'week'; // Default view
        
        // Enhanced sample leave data with more variety
        const leaveData = {
            // June 2025
            '2025-6-5': { type: 'vacation', title: 'Vacation', status: 'approved' },
            '2025-6-12': { type: 'sick', title: 'Sick Leave', status: 'approved' },
            '2025-6-13': { type: 'sick', title: 'Sick Leave', status: 'approved' },
            '2025-6-20': { type: 'public', title: 'Public Holiday', status: 'company' },
            '2025-6-25': { type: 'personal', title: 'Personal Day', status: 'pending' },
            
            // July 2025
            '2025-7-4': { type: 'public', title: 'Independence Day', status: 'company' },
            '2025-7-15': { type: 'vacation', title: 'Summer Vacation', status: 'approved' },
            '2025-7-16': { type: 'vacation', title: 'Summer Vacation', status: 'approved' },
            '2025-7-17': { type: 'vacation', title: 'Summer Vacation', status: 'approved' },
            '2025-7-18': { type: 'vacation', title: 'Summer Vacation', status: 'approved' },
            '2025-7-19': { type: 'vacation', title: 'Summer Vacation', status: 'approved' },
            '2025-7-28': { type: 'parental', title: 'Parental Leave', status: 'approved' },
            
            // August 2025
            '2025-8-5': { type: 'personal', title: 'Personal Day', status: 'pending' },
            '2025-8-12': { type: 'vacation', title: 'Weekend Getaway', status: 'approved' },
            '2025-8-13': { type: 'vacation', title: 'Weekend Getaway', status: 'approved' },
            '2025-8-21': { type: 'sick', title: 'Doctor Appointment', status: 'approved' },
            
            // September 2025
            '2025-9-4': { type: 'public', title: 'Labor Day', status: 'company' },
            '2025-9-15': { type: 'personal', title: 'Personal Day', status: 'pending' },
            '2025-9-22': { type: 'vacation', title: 'Family Event', status: 'approved' },
            
            // October 2025
            '2025-10-9': { type: 'public', title: 'Columbus Day', status: 'company' },
            '2025-10-20': { type: 'sick', title: 'Medical Leave', status: 'approved' },
            '2025-10-21': { type: 'sick', title: 'Medical Leave', status: 'approved' },
            '2025-10-31': { type: 'personal', title: 'Half Day - Halloween', status: 'approved' },
            
            // November 2025
            '2025-11-10': { type: 'public', title: 'Veterans Day', status: 'company' },
            '2025-11-23': { type: 'public', title: 'Thanksgiving', status: 'company' },
            '2025-11-24': { type: 'vacation', title: 'Day After Thanksgiving', status: 'approved' },
            
            // December 2025
            '2025-12-25': { type: 'public', title: 'Christmas Day', status: 'company' },
            '2025-12-26': { type: 'vacation', title: 'Year-End Break', status: 'approved' },
            '2025-12-27': { type: 'vacation', title: 'Year-End Break', status: 'approved' },
            '2025-12-28': { type: 'vacation', title: 'Year-End Break', status: 'approved' },
            '2025-12-29': { type: 'vacation', title: 'Year-End Break', status: 'approved' },
            
            // January 2024
            '2025-1-1': { type: 'public', title: 'New Year\'s Day', status: 'company' },
            '2025-1-15': { type: 'public', title: 'Martin Luther King Jr. Day', status: 'company' },
            '2025-1-22': { type: 'personal', title: 'Personal Day', status: 'pending' },
            
            // February 2024
            '2025-2-14': { type: 'personal', title: 'Half Day - Valentine\'s', status: 'approved' },
            '2025-2-19': { type: 'public', title: 'Presidents\' Day', status: 'company' },
            
            // March 2024
            '2025-3-15': { type: 'sick', title: 'Dental Appointment', status: 'approved' },
            '2025-3-29': { type: 'vacation', title: 'Spring Break', status: 'approved' },
            '2025-3-30': { type: 'vacation', title: 'Spring Break', status: 'approved' },
            
            // April 2024
            '2025-4-1': { type: 'vacation', title: 'Spring Break', status: 'approved' },
            '2025-4-2': { type: 'vacation', title: 'Spring Break', status: 'approved' },
            
            // May 2024
            '2025-5-27': { type: 'public', title: 'Memorial Day', status: 'company' },
            '2025-5-30': { type: 'personal', title: 'Personal Day', status: 'pending' },
        };
        
        // Team members' leaves for display in day view
        const teamLeaves = {
            '2025-6-12': [
                { name: 'Sarah Johnson', type: 'vacation', title: 'Vacation' },
                { name: 'Michael Chen', type: 'sick', title: 'Sick Leave' }
            ],
            '2025-7-4': [
                { name: 'Team', type: 'public', title: 'Independence Day' }
            ],
            '2025-7-17': [
                { name: 'Lisa Rodriguez', type: 'vacation', title: 'Summer Break' }
            ],
            '2025-9-4': [
                { name: 'Team', type: 'public', title: 'Labor Day' }
            ],
            '2025-11-23': [
                { name: 'Team', type: 'public', title: 'Thanksgiving' }
            ],
            '2025-12-25': [
                { name: 'Team', type: 'public', title: 'Christmas Day' }
            ]
        };
        
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
                dayElement.setAttribute('data-date', `${year}-${month+1}-${i}`);
                
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
                    dayElement.classList.add('today');
                }
                
                const dayNumber = document.createElement('div');
                dayNumber.className = 'day-number';
                dayNumber.textContent = i;
                dayElement.appendChild(dayNumber);
                
                // Add leave markers if applicable
                const dateKey = `${year}-${month+1}-${i}`;
                if (leaveData[dateKey]) {
                    const leaveMarker = document.createElement('div');
                    leaveMarker.className = `leave-marker ${leaveData[dateKey].type}-leave`;
                    leaveMarker.textContent = leaveData[dateKey].title;
                    dayElement.appendChild(leaveMarker);
                }
                
                // Add click event for day view
                dayElement.addEventListener('click', function() {
                    selectedDate = new Date(year, month, i);
                    if (currentView !== 'day') {
                        switchView('day');
                    } else {
                        showDayView(selectedDate);
                    }
                });
                
                monthCalendar.appendChild(dayElement);
            }
        }
        
        // Function to generate week view
        function generateWeekView(date) {
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay()); // Start from Sunday
            
            // Clear previous week view
            weekGrid.innerHTML = '';
            
            // Add days for the week
            for (let i = 0; i < 7; i++) {
                const currentDay = new Date(weekStart);
                currentDay.setDate(weekStart.getDate() + i);
                
                const dayElement = document.createElement('div');
                dayElement.className = 'week-day';
                dayElement.setAttribute('data-date', currentDay.toISOString().split('T')[0]);
                
                // Check if today
                const today = new Date();
                if (currentDay.getDate() === today.getDate() && 
                    currentDay.getMonth() === today.getMonth() && 
                    currentDay.getFullYear() === today.getFullYear()) {
                    dayElement.classList.add('today');
                }
                
                // Check if selected date
                if (currentDay.getDate() === selectedDate.getDate() && 
                    currentDay.getMonth() === selectedDate.getMonth() && 
                    currentDay.getFullYear() === selectedDate.getFullYear()) {
                    dayElement.classList.add('today');
                }
                
                const dayHeader = document.createElement('div');
                dayHeader.className = 'week-day-header';
                dayHeader.textContent = `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}, ${currentDay.getDate()}`;
                dayElement.appendChild(dayHeader);
                
                // Add leave markers if applicable
                const dateKey = `${currentDay.getFullYear()}-${currentDay.getMonth()+1}-${currentDay.getDate()}`;
                if (leaveData[dateKey]) {
                    const leaveMarker = document.createElement('div');
                    leaveMarker.className = `event-item ${leaveData[dateKey].type}-leave`;
                    leaveMarker.textContent = leaveData[dateKey].title;
                    dayElement.appendChild(leaveMarker);
                }
                
                // Add click event for day view
                dayElement.addEventListener('click', function() {
                    selectedDate = new Date(currentDay);
                    if (currentView !== 'day') {
                        switchView('day');
                    } else {
                        showDayView(selectedDate);
                    }
                });
                
                weekGrid.appendChild(dayElement);
            }
        }
        
        // Function to show day view
        function showDayView(date) {
            const dateKey = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
            const monthNames = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];
            
            dayViewTitle.textContent = `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
            
            let contentHTML = '';
            
            if (leaveData[dateKey]) {
                const leave = leaveData[dateKey];
                let statusBadge = '';
                
                if (leave.status === 'approved') {
                    statusBadge = '<span class="status-badge approved">Approved</span>';
                } else if (leave.status === 'pending') {
                    statusBadge = '<span class="status-badge pending">Pending</span>';
                } else if (leave.status === 'company') {
                    statusBadge = '<span class="status-badge company">Company Holiday</span>';
                }
                
                contentHTML += `
                    <div class="event-item ${leave.type}-leave">
                        <h3>${leave.title} ${statusBadge}</h3>
                        <p>You have a scheduled leave on this day.</p>
                    </div>
                `;
            }
            
            // Add team leaves if any
            if (teamLeaves[dateKey]) {
                contentHTML += `<div class="team-leaves-section"><h3>Team Leaves</h3>`;
                
                teamLeaves[dateKey].forEach(leave => {
                    contentHTML += `
                        <div class="team-leave-item ${leave.type}-leave">
                            <strong>${leave.name}:</strong> ${leave.title}
                        </div>
                    `;
                });
                
                contentHTML += `</div>`;
            }
            
            if (contentHTML === '') {
                contentHTML = `
                    <div class="no-events-message">
                        <i class="fas fa-calendar-check fa-3x" style="margin-bottom: 15px;"></i>
                        <h3>No Leaves Scheduled</h3>
                        <p>You have no leaves or holidays scheduled for this day.</p>
                    </div>
                `;
            }
            
            dayViewContent.innerHTML = contentHTML;
        }
        
        // Function to switch between views
        function switchView(view) {
            currentView = view;
            
            // Update toggle buttons
            toggleButtons.forEach(btn => btn.classList.remove('active'));
            document.getElementById(`${view}-view`).classList.add('active');
            
            // Show/hide appropriate views
            monthCalendar.style.display = view === 'month' ? 'grid' : 'none';
            weekCalendar.style.display = view === 'week' ? 'block' : 'none';
            dayViewContainer.style.display = view === 'day' ? 'block' : 'none';
            
            // Generate appropriate view
            if (view === 'month') {
                generateMonthCalendar(currentMonth, currentYear);
            } else if (view === 'week') {
                generateWeekView(selectedDate);
            } else if (view === 'day') {
                showDayView(selectedDate);
            }
        }
        
        // Initialize calendar
        generateMonthCalendar(currentMonth, currentYear);
        generateWeekView(selectedDate);
        
        // Navigation buttons
        prevMonthBtn.addEventListener('click', function() {
            if (currentView === 'month') {
                currentMonth--;
                if (currentMonth < 0) {
                    currentMonth = 11;
                    currentYear--;
                }
                generateMonthCalendar(currentMonth, currentYear);
            } else if (currentView === 'week') {
                selectedDate.setDate(selectedDate.getDate() - 7);
                generateWeekView(selectedDate);
            } else if (currentView === 'day') {
                selectedDate.setDate(selectedDate.getDate() - 1);
                showDayView(selectedDate);
            }
        });
        
        nextMonthBtn.addEventListener('click', function() {
            if (currentView === 'month') {
                currentMonth++;
                if (currentMonth > 11) {
                    currentMonth = 0;
                    currentYear++;
                }
                generateMonthCalendar(currentMonth, currentYear);
            } else if (currentView === 'week') {
                selectedDate.setDate(selectedDate.getDate() + 7);
                generateWeekView(selectedDate);
            } else if (currentView === 'day') {
                selectedDate.setDate(selectedDate.getDate() + 1);
                showDayView(selectedDate);
            }
        });
        
        // View toggle buttons
        monthViewBtn.addEventListener('click', function() {
            switchView('month');
        });
        
        weekViewBtn.addEventListener('click', function() {
            switchView('week');
        });
        
        dayViewBtn.addEventListener('click', function() {
            switchView('day');
        });
        
        // Quick action buttons
        const actionButtons = document.querySelectorAll('.action-btn');
        actionButtons.forEach(button => {
            if (!button.closest('a')) {
                button.addEventListener('click', function() {
                    alert('This functionality would open a request form in a real application.');
                });
            }
        });
    });