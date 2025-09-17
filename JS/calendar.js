document.addEventListener('DOMContentLoaded', function() {
            const calendar = document.querySelector('.calendar');
            const currentMonthElement = document.querySelector('.current-month');
            const navButtons = document.querySelectorAll('.nav-btn');
            
            let currentDate = new Date();
            let currentMonth = currentDate.getMonth();
            let currentYear = currentDate.getFullYear();
            
            // Function to generate calendar days
            function generateCalendar(month, year) {
                const monthNames = ["January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                ];
                
                currentMonthElement.textContent = `${monthNames[month]} ${year}`;
                
                // Clear previous calendar days
                for (let i = 7; i < calendar.children.length; i++) {
                    calendar.removeChild(calendar.children[i]);
                }
                
                const firstDay = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                
                // Add empty days for the first week
                for (let i = 0; i < firstDay; i++) {
                    const emptyDay = document.createElement('div');
                    emptyDay.className = 'calendar-day';
                    calendar.appendChild(emptyDay);
                }
                
                // Add days for the month
                for (let i = 1; i <= daysInMonth; i++) {
                    const dayElement = document.createElement('div');
                    dayElement.className = 'calendar-day';
                    
                    // Check if weekend
                    const dayOfWeek = new Date(year, month, i).getDay();
                    if (dayOfWeek === 0 || dayOfWeek === 6) {
                        dayElement.classList.add('weekend');
                    }
                    
                    // Check if today
                    if (i === currentDate.getDate() && month === currentDate.getMonth() && year === currentDate.getFullYear()) {
                        dayElement.classList.add('today');
                    }
                    
                    const dayNumber = document.createElement('div');
                    dayNumber.className = 'day-number';
                    dayNumber.textContent = i;
                    dayElement.appendChild(dayNumber);
                    
                    // Add sample leave markers (in a real app, this would come from data)
                    if (i === 5) {
                        const leaveMarker = document.createElement('div');
                        leaveMarker.className = 'leave-marker vacation-leave';
                        leaveMarker.textContent = 'Vacation';
                        dayElement.appendChild(leaveMarker);
                    }
                    
                    if (i === 12 || i === 13) {
                        const leaveMarker = document.createElement('div');
                        leaveMarker.className = 'leave-marker sick-leave';
                        leaveMarker.textContent = 'Sick Leave';
                        dayElement.appendChild(leaveMarker);
                    }
                    
                    if (i === 20) {
                        const leaveMarker = document.createElement('div');
                        leaveMarker.className = 'leave-marker public-holiday';
                        leaveMarker.textContent = 'Public Holiday';
                        dayElement.appendChild(leaveMarker);
                    }
                    
                    if (i === 25) {
                        const leaveMarker = document.createElement('div');
                        leaveMarker.className = 'leave-marker personal-leave';
                        leaveMarker.textContent = 'Personal';
                        dayElement.appendChild(leaveMarker);
                    }
                    
                    calendar.appendChild(dayElement);
                }
            }
            
            // Initialize calendar
            generateCalendar(currentMonth, currentYear);
            
            // Navigation buttons
            navButtons.forEach(button => {
                button.addEventListener('click', function() {
                    if (this.querySelector('.fa-chevron-left')) {
                        currentMonth--;
                        if (currentMonth < 0) {
                            currentMonth = 11;
                            currentYear--;
                        }
                    } else {
                        currentMonth++;
                        if (currentMonth > 11) {
                            currentMonth = 0;
                            currentYear++;
                        }
                    }
                    generateCalendar(currentMonth, currentYear);
                });
            });
            
            // View toggle buttons
            const toggleButtons = document.querySelectorAll('.toggle-btn');
            toggleButtons.forEach(button => {
                button.addEventListener('click', function() {
                    toggleButtons.forEach(btn => btn.classList.remove('active'));
                    this.classList.add('active');
                });
            });
            
            // Quick action buttons
            const actionButtons = document.querySelectorAll('.action-btn');
            actionButtons.forEach(button => {
                button.addEventListener('click', function() {
                    alert('This functionality would open a request form in a real application.');
                });
            });
        });