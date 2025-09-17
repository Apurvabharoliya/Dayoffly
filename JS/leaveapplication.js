document.addEventListener('DOMContentLoaded', function() {
            // Toggle form visibility
            const applyButton = document.getElementById('applyButton');
            const applicationForm = document.getElementById('applicationForm');
            
            applyButton.addEventListener('click', function() {
                applicationForm.scrollIntoView({ behavior: 'smooth' });
            });

            // Handle half-day option
            const halfDayCheckbox = document.getElementById('halfDay');
            const halfDayOption = document.getElementById('halfDayOption');
            
            halfDayCheckbox.addEventListener('change', function() {
                halfDayOption.disabled = !this.checked;
                calculateDays();
            });

            // Show attachment field for sick leave
            const leaveType = document.getElementById('leaveType');
            const attachmentSection = document.getElementById('attachmentSection');
            
            leaveType.addEventListener('change', function() {
                if (this.value === 'sick') {
                    attachmentSection.style.display = 'block';
                } else {
                    attachmentSection.style.display = 'none';
                }
            });

            // Calculate days between dates
            const startDate = document.getElementById('startDate');
            const endDate = document.getElementById('endDate');
            const totalDaysElement = document.getElementById('totalDays');
            
            startDate.addEventListener('change', calculateDays);
            endDate.addEventListener('change', calculateDays);
            
            function calculateDays() {
                if (startDate.value && endDate.value) {
                    const start = new Date(startDate.value);
                    const end = new Date(endDate.value);
                    const diffTime = Math.abs(end - start);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                    
                    let totalDays = diffDays;
                    
                    if (halfDayCheckbox.checked) {
                        totalDays = totalDays - 0.5;
                    }
                    
                    totalDaysElement.textContent = `Total days: ${totalDays}`;
                }
            }

            // Form submission
            const leaveForm = document.getElementById('leaveForm');
            
            leaveForm.addEventListener('submit', function(e) {
                e.preventDefault();
                alert('Leave application submitted successfully!');
                leaveForm.reset();
                halfDayOption.disabled = true;
                attachmentSection.style.display = 'none';
                totalDaysElement.textContent = 'Total days: 0';
            });

            // Cancel button
            const cancelButton = document.getElementById('cancelButton');
            
            cancelButton.addEventListener('click', function() {
                leaveForm.reset();
                halfDayOption.disabled = true;
                attachmentSection.style.display = 'none';
                totalDaysElement.textContent = 'Total days: 0';
            });

            // Tab switching
            const tabs = document.querySelectorAll('.tab');
            
            tabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    const tabName = this.getAttribute('data-tab');
                    
                    // Update active tab
                    tabs.forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Show active tab content
                    document.querySelectorAll('.tab-content').forEach(content => {
                        content.classList.remove('active');
                    });
                    document.getElementById(tabName + 'Tab').classList.add('active');
                });
            });

            // Set minimum date to today
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            const todayStr = `${yyyy}-${mm}-${dd}`;
            
            startDate.setAttribute('min', todayStr);
            endDate.setAttribute('min', todayStr);
        });