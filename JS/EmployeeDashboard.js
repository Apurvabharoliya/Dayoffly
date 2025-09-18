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

  document.addEventListener("DOMContentLoaded", () => {
    // ---- Attendance Data ----
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const attendance = [27, 24, 26, 25, 27, 26, 28, 27, 26, 25, 27, 28];
    const leaves =    [ 4,  6,  5,  4,  3,  4,  2,  3,  4,  5,  3,  2];

    const totalPresent = attendance.reduce((a, b) => a + b, 0);
    const totalLeaves = leaves.reduce((a, b) => a + b, 0);

    animateCount($("#totalPresent"), totalPresent);
    animateCount($("#totalLeaves"), totalLeaves);

    let barChart = null;
    const monthlyCanvas = $("#monthlyAttendanceChart");

    function renderBarChart(type = "present") {
      if (barChart) barChart.destroy();
      const data = type === "present" ? attendance : leaves;
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

    // Pie chart
    createPieChart($("#attendancePieChart"), ["Present Days", "Leaves Taken"], [totalPresent, totalLeaves], ["#10b981", "#ef4444"]);

    // ---- Holidays Data ----
    const holidays = [
      { name: "Makar Sankranti", date: "2025-01-14" },
      { name: "Republic Day", date: "2025-01-26" },
      { name: "Holi", date: "2025-03-14" },
      { name: "Independence Day", date: "2025-08-15" },
      { name: "Diwali", date: "2025-10-20" },
      { name: "Christmas", date: "2025-12-25" }
    ];

    const holidayList = $("#holidayList");
    const filterSelect = $("#holidayFilter");

    function renderHolidays(filter) {
      holidayList.innerHTML = "";
      const today = new Date();
      let filtered = holidays;

      if (filter === "upcoming") {
        filtered = holidays.filter(h => new Date(h.date) >= today);
      } else if (filter === "3months") {
        const limit = new Date();
        limit.setMonth(limit.getMonth() + 3);
        filtered = holidays.filter(h => new Date(h.date) >= today && new Date(h.date) <= limit);
      } else if (filter === "6months") {
        const limit = new Date();
        limit.setMonth(limit.getMonth() + 6);
        filtered = holidays.filter(h => new Date(h.date) >= today && new Date(h.date) <= limit);
      }

      if (filtered.length === 0) {
        holidayList.innerHTML = `<li>No holidays found</li>`;
        return;
      }

      filtered.forEach(h => {
        const li = document.createElement("li");
        li.innerHTML = `
          <span>${h.name}</span>
          <span class="holiday-date">${new Date(h.date).toDateString()}</span>
        `;
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
