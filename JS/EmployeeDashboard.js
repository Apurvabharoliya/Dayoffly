// HeroPage.js — improved
(function () {
  "use strict";

  // Utility: safe query
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Animated counter: counts to `to` over duration (ms)
  function animateCount(el, to, duration = 900) {
    if (!el) return;
    const start = 0;
    const startTime = performance.now();

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.round(start + (to - start) * easeOutCubic(progress));
      el.textContent = current;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }
  }

  // Format date to "Mon dd"
  function formatDate(dateStr) {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  // Add months helper (keeps day-of-month logic intact)
  function addMonths(date, months) {
    const copy = new Date(date.getTime());
    const targetMonth = copy.getMonth() + months;
    copy.setMonth(targetMonth);
    return copy;
  }

  // Create chart with gradient when possible
  function createBarChart(ctx, labels, data, opts = {}) {
    if (!ctx) return null;
    const canvas = ctx;
    const c = canvas.getContext("2d");
    // create gradient fill
    let gradient = null;
    try {
      gradient = c.createLinearGradient(0, 0, 0, canvas.height || 300);
      gradient.addColorStop(0, opts.colorStart || "#60a5fa");
      gradient.addColorStop(1, opts.colorEnd || "#2563eb");
    } catch (e) {
      gradient = opts.colorEnd || "#2563eb";
    }

    return new Chart(canvas, {
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
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `${context.parsed.y} ${opts.unit || ""}`.trim()
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            beginAtZero: true,
            ticks: { stepSize: opts.stepSize || undefined }
          }
        }
      }
    });
  }

  function createPieChart(ctx, labels, data, colors = []) {
    if (!ctx) return null;
    return new Chart(ctx, {
      type: "pie",
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors.length ? colors : ["#10b981", "#ef4444"]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 12, usePointStyle: true } },
          tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed}` } }
        }
      }
    });
  }

  // Main initialiser
  document.addEventListener("DOMContentLoaded", () => {
    // ===== Sidebar / nav handling =====
    const navItems = $$(".sidebar .nav-item");
    navItems.forEach(btn => {
      // set title for tooltip (useful when sidebar is collapsed)
      const txtEl = btn.querySelector("span");
      if (txtEl && !btn.getAttribute("title")) {
        btn.setAttribute("title", txtEl.textContent.trim());
      }

      // click to activate
      btn.addEventListener("click", (e) => {
        navItems.forEach(n => n.classList.remove("active"));
        btn.classList.add("active");
      });

      // keyboard access
      btn.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          btn.click();
        }
      });
    });

    // Optional toggle button (works if present)
    const sidebarToggle = $("#sidebarToggle");
    const sidebarEl = $(".sidebar");
    if (sidebarToggle && sidebarEl) {
      sidebarToggle.addEventListener("click", () => {
        sidebarEl.classList.toggle("collapsed");
        const expanded = String(!sidebarEl.classList.contains("collapsed"));
        sidebarToggle.setAttribute("aria-expanded", expanded);
      });
    }

    // ===== Attendance data / stats =====
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const attendance = [27, 24, 26, 25, 27, 26, 28, 27, 26, 25, 27, 28];

    const totalPresent = attendance.reduce((a, b) => a + b, 0);
    const totalLeaves = Math.max(0, 365 - totalPresent);

    // animate counters (if elements exist)
    const totalPresentEl = $("#totalPresent");
    const totalLeavesEl = $("#totalLeaves");
    const upcomingHolidaysEl = $("#upcomingHolidays");

    animateCount(totalPresentEl, totalPresent, 900);
    animateCount(totalLeavesEl, totalLeaves, 900);

    // ===== Charts =====
    let barChart = null;
    let pieChart = null;
    const monthlyCanvas = $("#monthlyAttendanceChart");
    const pieCanvas = $("#attendancePieChart");

    // create bar chart
    if (monthlyCanvas) {
      barChart = createBarChart(monthlyCanvas, months, attendance, {
        label: "Days Present",
        colorStart: "#6ea8fe",
        colorEnd: "#2563eb",
        unit: "days",
        borderRadius: 8,
        stepSize: 5
      });
    }

    // create pie chart
    if (pieCanvas) {
      pieChart = createPieChart(pieCanvas, ["Present Days", "Leaves Taken"], [totalPresent, totalLeaves], ["#10b981", "#ef4444"]);
    }

    // responsive: when window resizes, update/destroy charts gracefully to refresh gradients
    let resizeTimer = null;
    window.addEventListener("resize", () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (barChart) { barChart.resize(); barChart.update(); }
        if (pieChart) { pieChart.resize(); pieChart.update(); }
      }, 200);
    });

    // ===== Holidays (sample data & filtering) =====
    // Keep timezone-neutral yyyy-mm-dd format for clarity
    const holidays = [
      {
        name: "New Year's Day",
        date: "2025-01-01",
        type: "Public",
        emoji: "🎉",
      },
      {
        name: "Spring Festival",
        date: "2025-03-25",
        type: "Optional",
        emoji: "🌸",
      },
      {
        name: "Independence Day",
        date: "2025-08-15",
        type: "Public",
        emoji: "🇮🇳",
      },
      { name: "Halloween", date: "2025-10-31", type: "Fun", emoji: "🎃" },
      { name: "Diwali", date: "2025-11-12", type: "Public", emoji: "🪔" },
      { name: "Christmas", date: "2025-12-25", type: "Public", emoji: "🎄" },
    ];

    const holidayListEl = $("#holidayList");
    const holidayFilterEl = $("#holidayFilter");

    function renderHolidays(filter = "upcoming") {
      if (!holidayListEl) return;
      holidayListEl.innerHTML = "";

      const now = new Date();
      let filtered;

      switch (filter) {
        case "all":
          filtered = holidays; // includes past + future
          break;
        case "3months":
          filtered = holidays.filter((h) => {
            const d = new Date(h.date);
            return d >= now && d <= addMonths(now, 3);
          });
          break;
        case "6months":
          filtered = holidays.filter((h) => {
            const d = new Date(h.date);
            return d >= now && d <= addMonths(now, 6);
          });
          break;
        case "upcoming":
        default:
          filtered = holidays.filter((h) => new Date(h.date) >= now);
          break;
      }

      // Sort by date
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Render list
      if (filtered.length === 0) {
        const li = document.createElement("li");
        li.textContent = "No holidays found.";
        holidayListEl.appendChild(li);
      } else {
        for (const h of filtered) {
          const li = document.createElement("li");
          li.className = "holiday-item";
          li.innerHTML = `
        <div class="holiday-name">
          <span class="holiday-emoji">${h.emoji || ""}</span>
          <span class="holiday-title">${escapeHtml(h.name)}</span>
          <small class="holiday-badge">${escapeHtml(h.type)}</small>
        </div>
        <div class="holiday-right">
          <time datetime="${h.date}">${formatDate(h.date)}</time>
        </div>
      `;
          holidayListEl.appendChild(li);
        }
      }

      // 🔥 Count matches what’s displayed below
      const upcomingCount = filtered.length;
      if (upcomingHolidaysEl)
        animateCount(upcomingHolidaysEl, upcomingCount, 700);
    }



    // small helper to guard against HTML injection
    function escapeHtml(s) {
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    // initial render
    renderHolidays(holidayFilterEl ? holidayFilterEl.value : "all");

    // filter change
    if (holidayFilterEl) {
      holidayFilterEl.addEventListener("change", (e) => {
        renderHolidays(e.target.value);
      });
    }

    // make nav function available for inline onclick from older HTML (keeps compatibility)
    window.setActiveNav = function (element) {
      if (!element) return;
      navItems.forEach(n => n.classList.remove("active"));
      element.classList.add("active");
      // set focus for keyboard users
      element.focus();
      // log navigation (can be replaced with real routing)
      console.log("Navigated to:", element.textContent.trim());
    };

    // expose a tiny API for other scripts if needed
    window.__HeroPage = {
      renderHolidays,
      refreshCharts: () => {
        if (barChart) { barChart.update(); }
        if (pieChart) { pieChart.update(); }
      }
    };
  });
})();
