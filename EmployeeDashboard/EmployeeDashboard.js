// EmployeeDashboard.js - Complete Fixed File with Enhanced Debugging
(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  console.log('🚀 EmployeeDashboard.js loaded');

  // Test Chart.js availability
  function testChartJs() {
    console.log('🧪 Testing Chart.js availability...');
    console.log('Chart object:', typeof Chart);
    console.log('Chart version:', Chart.version);

    // Test if we can create a simple chart
    const testCanvas = document.createElement('canvas');
    document.body.appendChild(testCanvas);

    try {
      const testChart = new Chart(testCanvas, {
        type: 'bar',
        data: {
          labels: ['Test'],
          datasets: [{
            label: 'Test Data',
            data: [1],
            backgroundColor: '#60a5fa'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
      console.log('✅ Chart.js is working correctly');
      testChart.destroy();
      document.body.removeChild(testCanvas);
    } catch (error) {
      console.error('❌ Chart.js test failed:', error);
    }
  }

  function animateCount(el, to, duration = 900) {
    if (!el) {
      console.warn('⚠️ animateCount: element not found');
      return;
    }
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
    if (!ctx) {
      console.error('❌ createBarChart: Canvas context is null or undefined');
      return null;
    }

    try {
      console.log('🎨 Creating bar chart with data:', {
        labels: labels,
        data: data,
        options: opts
      });

      const c = ctx.getContext("2d");
      if (!c) {
        console.error('❌ Could not get 2D context from canvas');
        return null;
      }

      // Create gradient
      let gradient = c.createLinearGradient(0, 0, 0, ctx.height || 300);
      gradient.addColorStop(0, opts.colorStart || "#60a5fa");
      gradient.addColorStop(1, opts.colorEnd || "#2563eb");

      console.log('📊 Chart configuration ready, creating Chart instance...');

      const chart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: labels || [],
          datasets: [{
            label: opts.label || "Data",
            data: data || [],
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
            legend: {
              display: false
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              }
            },
            y: {
              beginAtZero: true
            }
          },
          animation: {
            duration: 1000,
            easing: 'easeInOutQuart'
          }
        }
      });

      console.log('✅ Bar chart created successfully');
      return chart;
    } catch (error) {
      console.error('❌ Error creating bar chart:', error);
      console.error('Error stack:', error.stack);
      return null;
    }
  }

  function createPieChart(ctx, labels, data, colors = []) {
    if (!ctx) {
      console.error('❌ createPieChart: Canvas context is null or undefined');
      return null;
    }

    try {
      console.log('🥧 Creating pie chart with data:', { labels, data });

      return new Chart(ctx, {
        type: "pie",
        data: {
          labels: labels || [],
          datasets: [{
            data: data || [],
            backgroundColor: colors.length ? colors : ["#10b981", "#ef4444", "#3b82f6", "#f59e0b"]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom"
            }
          }
        }
      });
    } catch (error) {
      console.error('❌ Error creating pie chart:', error);
      return null;
    }
  }

  // Function to fetch dashboard data from API
  async function fetchDashboardData() {
    try {
      console.log('🔄 Fetching dashboard data from API...');
      const token = localStorage.getItem('authToken');
      const headers = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔑 Using token for authentication');
      } else {
        console.log('⚠️ No auth token found');
      }

      const response = await fetch('http://127.0.0.1:5000/api/dashboard-data', {
        credentials: 'include',
        headers: headers
      });

      console.log('📊 API Response status:', response.status);
      console.log('📊 API Response ok:', response.ok);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Dashboard data received successfully');

      // Debug chart data specifically
      if (data.chartData) {
        console.log('📈 Chart data details:', {
          months: data.chartData.months,
          leavesTaken: data.chartData.leavesTaken,
          daysPresent: data.chartData.daysPresent,
          monthsLength: data.chartData.months?.length,
          leavesTakenLength: data.chartData.leavesTaken?.length,
          daysPresentLength: data.chartData.daysPresent?.length
        });
      } else {
        console.warn('⚠️ No chartData in response');
      }

      return data;
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      // Return mock data as fallback
      const mockData = {
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
      console.log('🔄 Using mock data due to error');
      return mockData;
    }
  }

  // Authentication helper
  async function ensureAuthentication() {
    console.log('🔐 Checking authentication...');
    const token = localStorage.getItem('authToken');

    if (!token) {
      console.warn('⚠️ No auth token found, redirecting to login');
      window.location.href = '/login-page';
      return false;
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/api/dashboard-data', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      console.log('✅ Authentication successful');
      return true;
    } catch (error) {
      console.error('❌ Authentication error:', error);
      localStorage.removeItem('authToken');
      window.location.href = '/login-page';
      return false;
    }
  }

  function showErrorState() {
    console.error('🛑 Showing error state');
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Unable to Load Dashboard</h3>
          <p>Please check your connection and try again</p>
          <button onclick="location.reload()">Retry</button>
        </div>
      `;
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    console.log('📄 DOM Content Loaded - Initializing dashboard');

    // Test Chart.js first
    testChartJs();

    // Check authentication first
    const isAuthenticated = await ensureAuthentication();
    if (!isAuthenticated) {
      console.error('❌ Authentication failed, stopping initialization');
      return;
    }

    try {
      // Fetch dashboard data
      console.log('📥 Fetching dashboard data...');
      const dashboardData = await fetchDashboardData();
      console.log('✅ Dashboard data loaded:', dashboardData);

      // Extract data with proper error handling
      const { user_info, stats, chartData, holidays } = dashboardData;
      console.log('📋 Extracted data:', { user_info, stats, chartData, holidays });

      // Add null checks for chartData to prevent "months" undefined error
      const months = chartData?.months || ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const leavesTaken = chartData?.leavesTaken || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const daysPresent = chartData?.daysPresent || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

      console.log('📊 Final chart data:', {
        months: months,
        leavesTaken: leavesTaken,
        daysPresent: daysPresent
      });

      // Add null checks for stats
      const totalLeaves = stats?.totalUsed || 0;
      const totalAllowed = stats?.totalAllowed || 0;
      const totalRemaining = stats?.totalRemaining || 0;
      const upcomingHolidaysCount = stats?.upcomingHolidays || 0;

      console.log('📈 Stats data:', {
        totalLeaves, totalAllowed, totalRemaining, upcomingHolidaysCount
      });

      // Update header with user information
      const employeeNameEl = $("#employeeName");
      const employeeDesignationEl = $("#employeeDesignation");
      if (employeeNameEl && user_info && user_info.user_name) {
        employeeNameEl.textContent = `Welcome, ${user_info.user_name}`;
        console.log('✅ Updated employee name');
      }
      if (employeeDesignationEl && user_info && user_info.designation) {
        employeeDesignationEl.textContent = user_info.designation;
        console.log('✅ Updated employee designation');
      }

      // Update user avatar
      const avatarImg = $("#user-avatar-img");
      if (avatarImg && user_info && user_info.user_name) {
        const userName = user_info.user_name;
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=667eea&color=fff&size=36`;
        avatarImg.src = avatarUrl;
        avatarImg.alt = `${userName}'s Avatar`;
        console.log('✅ Updated user avatar');
      }

      // Calculate carry forward (simple calculation based on remaining)
      const carryForward = Math.max(0, totalAllowed - 20); // Assuming base is 20

      // Update stats
      animateCount($("#carryForward"), carryForward);
      animateCount($("#totalLeaves"), totalRemaining);
      animateCount($("#totalAllowed"), totalAllowed);
      animateCount($("#upcomingHolidays"), upcomingHolidaysCount);
      console.log('✅ Updated stats counters');

      // Initialize charts
      console.log('🎨 Initializing charts...');

      let barChart = null;
      const monthlyCanvas = $("#monthlyAttendanceChart");

      console.log('📊 Monthly canvas element:', monthlyCanvas);

      if (!monthlyCanvas) {
        console.error('❌ Monthly attendance chart canvas not found!');
        console.log('🔍 Available elements:', {
          chartsRow: document.querySelector('.charts-row'),
          chartCards: document.querySelectorAll('.chart-card'),
          canvases: document.querySelectorAll('canvas')
        });
      } else {
        console.log('✅ Monthly canvas found, proceeding with chart creation');
      }

      function renderBarChart(type = "present") {
        console.log(`🔄 Rendering bar chart type: ${type}`);

        if (!monthlyCanvas) {
          console.error('❌ Canvas not available for chart rendering');
          return;
        }

        try {
          // Destroy existing chart
          if (barChart) {
            console.log('🗑️ Destroying existing bar chart');
            barChart.destroy();
          }

          const data = type === "present" ? daysPresent : leavesTaken;
          const label = type === "present" ? "Days Present" : "Leaves Taken";
          const colorStart = type === "present" ? "#6ea8fe" : "#f87171";
          const colorEnd = type === "present" ? "#2563eb" : "#dc2626";

          console.log(`📊 Rendering ${type} chart with:`, {
            labels: months,
            data: data,
            label: label
          });

          barChart = createBarChart(monthlyCanvas, months, data, {
            label, colorStart, colorEnd, borderRadius: 8
          });

          if (barChart) {
            console.log('✅ Bar chart rendered successfully');
          } else {
            console.error('❌ Bar chart creation returned null');
          }
        } catch (error) {
          console.error('❌ Error rendering bar chart:', error);
          console.error('Error stack:', error.stack);
        }
      }

      // Initial render with slight delay to ensure DOM is fully ready
      console.log('⏰ Scheduling initial chart render...');
      setTimeout(() => {
        console.log('🎯 Starting initial chart render');
        renderBarChart("present");
      }, 100);

      // Dropdown event
      const attendanceTypeSelect = $("#attendanceType");
      if (attendanceTypeSelect) {
        attendanceTypeSelect.addEventListener("change", (e) => {
          console.log('🔄 Changing chart type to:', e.target.value);
          renderBarChart(e.target.value);
        });
        console.log('✅ Attendance dropdown event listener added');
      } else {
        console.error('❌ Attendance type dropdown not found');
      }

      // Pie chart - updated to show available vs used leaves
      console.log('🥧 Creating pie chart...');
      const pieCanvas = $("#attendancePieChart");
      console.log('📊 Pie canvas element:', pieCanvas);

      if (pieCanvas) {
        // Calculate available leaves based on base allowance plus carry forward
        const availableLeaves = totalAllowed - totalLeaves;
        console.log('📊 Pie chart data:', {
          availableLeaves: availableLeaves,
          totalLeaves: totalLeaves
        });

        const pieChart = createPieChart(pieCanvas, ["Available Leaves", "Leaves Taken"], [availableLeaves, totalLeaves], ["#10b981", "#ef4444"]);
        if (pieChart) {
          console.log('✅ Pie chart created successfully');
        } else {
          console.error('❌ Pie chart creation failed');
        }
      } else {
        console.error('❌ Pie chart canvas not found');
      }

      // ---- Holidays Data ----
      console.log('🎉 Processing holidays data...');
      const holidayList = $("#holidayList");
      const filterSelect = $("#holidayFilter");

      console.log('📋 Holiday elements:', {
        holidayList: holidayList,
        filterSelect: filterSelect
      });

      function renderHolidays(filter) {
        console.log(`📅 Rendering holidays with filter: ${filter}`);

        if (!holidayList) {
          console.error('❌ Holiday list element not found');
          return;
        }

        holidayList.innerHTML = "";
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time part for accurate comparison

        let filtered = holidays || [];
        console.log('📅 Total holidays:', filtered.length);

        if (filter === "upcoming") {
          filtered = filtered.filter(h => new Date(h.date) >= today);
        } else if (filter === "3months") {
          const limit = new Date();
          limit.setMonth(limit.getMonth() + 3);
          filtered = filtered.filter(h => {
            const holidayDate = new Date(h.date);
            return holidayDate >= today && holidayDate <= limit;
          });
        } else if (filter === "6months") {
          const limit = new Date();
          limit.setMonth(limit.getMonth() + 6);
          filtered = filtered.filter(h => {
            const holidayDate = new Date(h.date);
            return holidayDate >= today && holidayDate <= limit;
          });
        }

        console.log(`📅 Filtered holidays (${filter}):`, filtered.length);

        // Sort by date
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

        if (filtered.length === 0) {
          holidayList.innerHTML = `<li class="no-holidays">No holidays found for the selected period</li>`;
          console.log('📅 No holidays to display');
          return;
        }

        filtered.forEach((h, index) => {
          const li = document.createElement("li");
          const holidayDate = new Date(h.date);
          const isNextHoliday = index === 0; // First holiday is the next one

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
        console.log('✅ Holidays rendered successfully');
      }

      // Initial holidays render
      if (holidayList && filterSelect) {
        renderHolidays("upcoming");
        console.log('✅ Initial holidays rendered');

        // Filter change
        filterSelect.addEventListener("change", (e) => {
          console.log('🔄 Changing holiday filter to:', e.target.value);
          renderHolidays(e.target.value);
        });
      } else {
        console.error('❌ Holiday elements not found for rendering');
      }

      // Update remaining leaves stat
      if (stats && stats.totalRemaining !== undefined) {
        animateCount($("#totalLeaves"), stats.totalRemaining);
        console.log('✅ Updated remaining leaves stat');
      }

      console.log('🎊 Dashboard initialization completed successfully!');

    } catch (error) {
      console.error('❌ Dashboard initialization error:', error);
      console.error('Error stack:', error.stack);
      showErrorState();
    }
  });

  // Add global error handler for uncaught errors
  window.addEventListener('error', function (e) {
    console.error('🛑 Global error caught:', e.error);
    console.error('Error stack:', e.error.stack);
  });

})();