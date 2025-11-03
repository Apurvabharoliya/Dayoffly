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

  // Function to fetch dashboard data from API
  async function fetchDashboardData() {
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
      return data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Return mock data as fallback
      return {
        user_info: { user_name: "Employee User", designation: "Web Developer" },
        stats: { totalAllowed: 20, totalUsed: 15, totalRemaining: 5, upcomingHolidays: 4 },
        chartData: {
          months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
          leavesTaken: [2, 3, 1, 4, 2, 3, 1, 2, 3, 2, 1, 0],
          daysPresent: [20, 19, 21, 18, 20, 19, 21, 20, 19, 20, 21, 22]
        },
        holidays: [
          { name: "Republic Day", date: "2024-01-26" },
          { name: "Holi", date: "2024-03-25" },
          { name: "Independence Day", date: "2024-08-15" },
          { name: "Diwali", date: "2024-11-12" }
        ]
      };
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    // Fetch dashboard data
    const dashboardData = await fetchDashboardData();

    // Extract data
    const { user_info, stats, chartData, holidays } = dashboardData;
    const months = chartData.months;
    const leavesTaken = chartData.leavesTaken;
    const daysPresent = chartData.daysPresent;
    const totalLeaves = stats.totalUsed;
    const totalAllowed = stats.totalAllowed;
    const totalRemaining = stats.totalRemaining;
    const upcomingHolidaysCount = stats.upcomingHolidays;

    // Update header with user information
    const employeeNameEl = $("#employeeName");
    const employeeDesignationEl = $("#employeeDesignation");
    if (employeeNameEl && user_info && user_info.user_name) {
      employeeNameEl.textContent = `Welcome, ${user_info.user_name}`;
    }
    if (employeeDesignationEl && user_info && user_info.designation) {
      employeeDesignationEl.textContent = user_info.designation;
    }

    // Calculate carry forward (simple calculation based on remaining)
    const carryForward = Math.max(0, totalAllowed - 20); // Assuming base is 20

    // Update stats
    animateCount($("#carryForward"), carryForward);
    animateCount($("#totalLeaves"), totalRemaining);
    animateCount($("#totalAllowed"), totalAllowed);
    animateCount($("#upcomingHolidays"), upcomingHolidaysCount);

    let barChart = null;
    const monthlyCanvas = $("#monthlyAttendanceChart");

    function renderBarChart(type = "present") {
      if (barChart) barChart.destroy();
      const data = type === "present" ? daysPresent : leavesTaken;
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
    // holidays variable is now extracted from dashboardData above

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

    // Update remaining leaves stat
    if (data.stats && data.stats.totalRemaining !== undefined) {
      animateCount($("#totalLeaves"), data.stats.totalRemaining);
    }
  });
})();