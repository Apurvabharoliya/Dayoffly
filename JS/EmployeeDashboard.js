(function () {
      "use strict";

      const $ = (sel, root = document) => root.querySelector(sel);
      const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

      function animateCount(el, to, duration = 900) {
        if (!el) return;
        const start = 0;
        const startTime = performance.now();
        function tick(now) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const current = Math.round(start + (to - start) * (1 - Math.pow(1 - progress, 3)));
          el.textContent = current;
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }

      function createBarChart(ctx, labels, data, opts = {}) {
        if (!ctx) return null;
        const c = ctx.getContext("2d");
        let gradient = c.createLinearGradient(0, 0, 0, ctx.height || 300);
        gradient.addColorStop(0, opts.colorStart || "#60a5fa");
        gradient.addColorStop(1, opts.colorEnd || "#2563eb");

        return new Chart(ctx, {
          type: "bar",
          data: {
            labels,
            datasets: [{
              label: opts.label || "Data",
              data,
              backgroundColor: gradient,
              borderRadius: opts.borderRadius ?? 6,
              barPercentage: 0.7,
              categoryPercentage: 0.9
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { grid: { display: false } }, y: { beginAtZero: true } }
          }
        });
      }

      function createPieChart(ctx, labels, data, colors = []) {
        if (!ctx) return null;
        return new Chart(ctx, {
          type: "pie",
          data: {
            labels,
            datasets: [{ data, backgroundColor: colors.length ? colors : ["#10b981", "#ef4444"] }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: "bottom" } }
          }
        });
      }

      // Function to calculate carry forward leaves
      function calculateCarryForward() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Get the last day of the previous month
        const lastMonth = new Date(currentYear, currentMonth, 0);
        const lastDayOfPrevMonth = lastMonth.getDate();
        
        // Get the current day of the month
        const currentDay = now.getDate();
        
        // If it's the first week of the month, add carry forward
        if (currentDay <= 7) {
          // Calculate unused leaves from previous month (for demonstration, using a fixed value)
          const unusedLeaves = 5; // This would normally come from your backend
          
          // Maximum carry forward limit (e.g., 50% of allowed leaves)
          const maxCarryForward = Math.floor(20 * 0.5); // 10 leaves
          
          return Math.min(unusedLeaves, maxCarryForward);
        }
        
        return 0; // No carry forward after the first week
      }

      document.addEventListener("DOMContentLoaded", () => {
        // ---- Leaves Data ----
        const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        const leaves = [4, 6, 5, 4, 3, 4, 2, 3, 4, 5, 3, 2];
        const totalLeaves = leaves.reduce((a, b) => a + b, 0);
        
        // Calculate carry forward
        const carryForward = calculateCarryForward();
        const baseAllowed = 20;
        const totalAllowed = baseAllowed + carryForward; // Base 20 + carry forward

        // Update stats
        animateCount($("#carryForward"), carryForward);
        animateCount($("#totalLeaves"), totalLeaves);
        animateCount($("#totalAllowed"), totalAllowed);

        let barChart = null;
        const monthlyCanvas = $("#monthlyAttendanceChart");

        function renderBarChart(type = "present") {
          if (barChart) barChart.destroy();
          const data = type === "present" ? months.map((_, i) => 22 - leaves[i]) : leaves;
          const label = type === "present" ? "Days Present" : "Leaves Taken";
          const colorStart = type === "present" ? "#6ea8fe" : "#f87171";
          const colorEnd = type === "present" ? "#2563eb" : "#dc2626";
          barChart = createBarChart(monthlyCanvas, months, data, {
            label, colorStart, colorEnd, borderRadius: 8
          });
        }

        // Initial render
        renderBarChart("present");

        // Dropdown event
        $("#attendanceType").addEventListener("change", (e) => {
          renderBarChart(e.target.value);
        });

        // Pie chart - updated to show available vs used leaves
        // Calculate available leaves based on base allowance plus carry forward
        const availableLeaves = totalAllowed - totalLeaves;
        createPieChart($("#attendancePieChart"), ["Available Leaves", "Leaves Taken"], [availableLeaves, totalLeaves], ["#10b981", "#ef4444"]);

        // ---- Holidays Data ----
        const holidays = [
          { name: "Makar Sankranti", date: "2025-01-14" },
          { name: "Republic Day", date: "2025-01-26" },
          { name: "Holi", date: "2025-03-14" },
          { name: "Good Friday", date: "2025-04-18" },
          { name: "Eid al-Fitr", date: "2025-03-31" },
          { name: "Independence Day", date: "2025-08-15" },
          { name: "Ganesh Chaturthi", date: "2025-09-01" },
          { name: "Dussehra", date: "2025-10-02" },
          { name: "Diwali", date: "2025-10-20" },
          { name: "Christmas", date: "2025-12-25" },
          { name: "New Year's Day", date: "2026-01-01" }
        ];

        const holidayList = $("#holidayList");
        const filterSelect = $("#holidayFilter");

        function renderHolidays(filter) {
          holidayList.innerHTML = "";
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Reset time part for accurate comparison
          
          let filtered = holidays;

          if (filter === "upcoming") {
            filtered = holidays.filter(h => new Date(h.date) >= today);
          } else if (filter === "3months") {
            const limit = new Date();
            limit.setMonth(limit.getMonth() + 3);
            filtered = holidays.filter(h => {
              const holidayDate = new Date(h.date);
              return holidayDate >= today && holidayDate <= limit;
            });
          } else if (filter === "6months") {
            const limit = new Date();
            limit.setMonth(limit.getMonth() + 6);
            filtered = holidays.filter(h => {
              const holidayDate = new Date(h.date);
              return holidayDate >= today && holidayDate <= limit;
            });
          }

          // Sort by date
          filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

          if (filtered.length === 0) {
            holidayList.innerHTML = `<li class="no-holidays">No holidays found for the selected period</li>`;
            return;
          }

          filtered.forEach(h => {
            const li = document.createElement("li");
            const holidayDate = new Date(h.date);
            const isNextHoliday = filtered[0] === h;
            
            li.innerHTML = `
              <span class="holiday-name">
                ${isNextHoliday ? '<i class="fas fa-star" style="color: #f59e0b;"></i>' : ''}
                ${h.name}
              </span>
              <span class="holiday-date">${holidayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
            `;
            
            if (isNextHoliday) {
              li.style.background = "linear-gradient(to right, #fffbeb, #fef3c7)";
              li.style.borderLeft = "4px solid #f59e0b";
            }
            
            holidayList.appendChild(li);
          });

          // Update stats card count
          animateCount($("#upcomingHolidays"), filtered.length);
        }

        // Initial holidays render
        renderHolidays("upcoming");

        // Filter change
        filterSelect.addEventListener("change", (e) => {
          renderHolidays(e.target.value);
        });
      });
    })();