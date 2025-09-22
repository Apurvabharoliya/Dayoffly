document.addEventListener('DOMContentLoaded', function() {
    const monthCalendar = document.getElementById('month-calendar');
    const currentMonthElement = document.querySelector('.current-month');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let selectedDate = new Date();
    
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
            
            monthCalendar.appendChild(dayElement);
        }
    }
    
    // Initialize calendar
    generateMonthCalendar(currentMonth, currentYear);
    
    // Navigation buttons
    prevMonthBtn.addEventListener('click', function() {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        generateMonthCalendar(currentMonth, currentYear);
    });
    
    nextMonthBtn.addEventListener('click', function() {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        generateMonthCalendar(currentMonth, currentYear);
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