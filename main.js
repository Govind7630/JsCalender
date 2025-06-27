class BookingCalendar extends HTMLElement {
  async getAccessToken() {
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("client_id", "id-dec3219b-34b3-7491-8698-40193ec681e7");
    params.append("client_secret", "secret-abfba0a2-3f8f-6d56-408e-f98f6a71691e");

    const res = await fetch("/o/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });

    const data = await res.json();
    return data.access_token;
  }

  connectedCallback() {
    this.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          box-sizing: border-box;
        }
        
        :host {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          --secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          --success-gradient: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          --dark-gradient: linear-gradient(135deg, #434343 0%, #000000 100%);
          --glass-bg: rgba(255, 255, 255, 0.25);
          --glass-border: rgba(255, 255, 255, 0.18);
          --shadow-soft: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
          --shadow-hover: 0 15px 35px rgba(31, 38, 135, 0.2);
          --border-radius: 20px;
          --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 2rem;
        }

        .calendar-container {
          max-width: 1400px;
          margin: 0 auto;
          background: var(--glass-bg);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid var(--glass-border);
          border-radius: var(--border-radius);
          box-shadow: var(--shadow-soft);
          padding: 2rem;
          animation: slideInUp 0.8s ease-out;
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes shimmer {
          0% { background-position: -200px 0; }
          100% { background-position: calc(200px + 100%) 0; }
        }

        .filter-bar {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
          margin-bottom: 2rem;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(20px);
          padding: 1.5rem;
          border-radius: 15px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .filter-bar label {
          font-weight: 600;
          color: #ffffff;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-size: 0.9rem;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
        }

        .filter-bar select, 
        .filter-bar input {
          padding: 12px 16px;
          border-radius: 12px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          font-size: 0.95rem;
          font-weight: 500;
          transition: var(--transition);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          color: #333;
        }

        .filter-bar select:focus, 
        .filter-bar input:focus {
          outline: none;
          border-color: #fff;
          background: rgba(255, 255, 255, 1);
          box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.3), 0 8px 25px rgba(0, 0, 0, 0.15);
          transform: translateY(-2px);
        }

        .filter-bar button {
          padding: 12px 24px;
          background: var(--secondary-gradient);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: var(--transition);
          box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          position: relative;
          overflow: hidden;
        }

        .filter-bar button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.5s;
        }

        .filter-bar button:hover::before {
          left: 100%;
        }

        .filter-bar button:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(245, 87, 108, 0.6);
        }

        .filter-bar button:active {
          transform: translateY(-1px);
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(15px);
          padding: 1.5rem 2rem;
          border-radius: 15px;
          border: 1px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        #calendarTitle {
          font-size: 2rem;
          font-weight: 700;
          color: #ffffff;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
        }

        .view-toggle {
          display: flex;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.2);
          padding: 0.5rem;
          border-radius: 12px;
          backdrop-filter: blur(15px);
        }

        .view-btn {
          width: 50px;
          height: 45px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.3);
          color: #ffffff;
          font-weight: 700;
          font-size: 1rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          cursor: pointer;
          transition: var(--transition);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }

        .view-btn::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          transition: var(--transition);
          transform: translate(-50%, -50%);
        }

        .view-btn:hover::before {
          width: 100%;
          height: 100%;
        }

        .view-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(255, 255, 255, 0.3);
          color: #ffffff;
        }

        .view-btn.active {
          background: var(--success-gradient);
          border-color: rgba(255, 255, 255, 0.6);
          box-shadow: 0 4px 15px rgba(79, 172, 254, 0.4);
          animation: pulse 2s infinite;
          color: #ffffff;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }

        #calendar {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          position: relative;
          overflow: hidden;
        }

        #calendar::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: var(--primary-gradient);
        }

        /* Force override FullCalendar table styles */
        #calendar table {
          border-collapse: separate !important;
          border-spacing: 4px !important;
        }

        #calendar .fc-scrollgrid-section-header > * {
          background: none !important;
        }

        #calendar .fc-scrollgrid-section-body {
          border: none !important;
        }

        #calendar .fc-scrollgrid-section-body table {
          border: none !important;
        }

        #calendar tbody tr td {
          border: none !important;
        }

        #calendar .fc-daygrid-body {
          border: none !important;
        }

        #calendar .fc-scrollgrid {
          border: none !important;
        }

        /* FullCalendar Custom Styling - High Specificity */
        #calendar .fc {
          font-family: 'Inter', sans-serif !important;
        }

        #calendar .fc-theme-standard .fc-scrollgrid {
          border: none !important;
          border-radius: 15px !important;
          overflow: hidden !important;
        }

        #calendar .fc-col-header-cell {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%) !important;
          color: white !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 1.5px !important;
          padding: 1.2rem 0.8rem !important;
          border: none !important;
          position: relative !important;
          font-size: 0.9rem !important;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3) !important;
        }

        #calendar .fc-col-header-cell::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 40px;
          height: 4px;
          background: rgba(255, 255, 255, 0.8);
          transform: translateX(-50%);
          border-radius: 3px;
        }

        #calendar .fc-col-header-cell:hover::after {
          width: 60px;
          background: white;
          transition: all 0.3s ease;
        }

        #calendar .fc-daygrid-day {
          background: white !important;
          border: 2px solid #f0f8ff !important;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
          position: relative !important;
          cursor: pointer !important;
          min-height: 120px !important;
        }

        #calendar .fc-daygrid-day:hover {
          background: linear-gradient(135deg, #f8fbff 0%, #e8f4f8 100%) !important;
          transform: translateY(-4px) scale(1.02) !important;
          box-shadow: 0 15px 40px rgba(102, 126, 234, 0.15) !important;
          z-index: 10 !important;
          border-color: #667eea !important;
        }

        #calendar .fc-daygrid-day-number {
          color: #333 !important;
          text-decoration: none !important;
          font-weight: 700 !important;
          font-size: 1.1rem !important;
          padding: 10px !important;
          border-radius: 50% !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          position: relative !important;
          z-index: 2 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 40px !important;
          height: 40px !important;
          margin: 8px !important;
        }

        #calendar .fc-daygrid-day-number:hover {
          background: var(--primary-gradient) !important;
          color: white !important;
          transform: scale(1.3) rotate(5deg) !important;
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5) !important;
        }

        #calendar .fc-day-today {
          background: linear-gradient(135deg, #667eea30 0%, #764ba230 100%) !important;
          border: 3px solid #667eea !important;
          box-shadow: 0 0 20px rgba(102, 126, 234, 0.3) !important;
        }

        #calendar .fc-day-today .fc-daygrid-day-number {
          background: var(--primary-gradient) !important;
          color: white !important;
          font-weight: 800 !important;
          animation: pulse 2s infinite !important;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.6) !important;
        }

        #calendar .fc-event {
          border: none !important;
          border-radius: 12px !important;
          padding: 6px 12px !important;
          margin: 3px !important;
          font-weight: 600 !important;
          font-size: 0.9rem !important;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          cursor: pointer !important;
          position: relative !important;
          overflow: hidden !important;
          backdrop-filter: blur(10px) !important;
        }

        #calendar .fc-event::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          transition: left 0.5s;
        }

        #calendar .fc-event:hover::before {
          left: 100%;
        }

        #calendar .fc-event:hover {
          transform: translateY(-3px) scale(1.08) !important;
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.3) !important;
          z-index: 100 !important;
        }

        #calendar .fc-event-title {
          font-weight: 700 !important;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
          letter-spacing: 0.5px !important;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          :host {
            padding: 1rem;
          }
          
          .calendar-container {
            padding: 1rem;
          }
          
          .filter-bar {
            gap: 1rem;
            padding: 1rem;
          }
          
          .calendar-header {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }
          
          #calendarTitle {
            font-size: 1.5rem;
          }
          
          .view-btn {
            width: 45px;
            height: 40px;
            font-size: 0.9rem;
          }
        }

        /* Loading Animation */
        .loading {
          position: relative;
          color: transparent !important;
        }

        .loading::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200px 100%;
          animation: shimmer 1.5s infinite;
          border-radius: inherit;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: var(--primary-gradient);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: var(--secondary-gradient);
        }
      </style>

      <div class="calendar-container">
        <div class="filter-bar">
          <label>
            <span>📋 Type</span>
            <select id="typeFilter"><option value="">All Types</option></select>
          </label>

          <label id="resourceLabel" style="display:none;">
            <span>🏢 Resource</span>
            <select id="resourceFilter"><option value="">All Resources</option></select>
          </label>

          <label>
            <span>📅 From Date</span>
            <input type="date" id="fromDate" />
          </label>

          <label>
            <span>📅 To Date</span>
            <input type="date" id="toDate" />
          </label>

          <button id="applyFilters">
            ✨ Apply Filters
          </button>
        </div>

        <div class="calendar-header">
          <span id="calendarTitle" class="loading">Loading Calendar...</span>
          <div class="view-toggle">
            <button class="view-btn" data-view="dayGridMonth" title="Month View">M</button>
            <button class="view-btn" data-view="timeGridWeek" title="Week View">W</button>
            <button class="view-btn" data-view="timeGridDay" title="Day View">D</button>
          </div>
        </div>

        <div id="calendar"></div>
      </div>
    `;

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.17/index.global.min.js';
    script.onload = async () => {
      const token = await this.getAccessToken();
      const fetchWithAuth = async (url) => {
        const res = await fetch(url, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        return res.json();
      };

      const calendarEl = this.querySelector('#calendar');
      const calendarTitleEl = this.querySelector('#calendarTitle');
      const typeFilter = this.querySelector('#typeFilter');
      const resourceFilter = this.querySelector('#resourceFilter');
      const resourceLabel = this.querySelector('#resourceLabel');
      const fromDateEl = this.querySelector('#fromDate');
      const toDateEl = this.querySelector('#toDate');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      // Custom notification system
      const showNotification = (message, type = "info") => {
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 1rem 2rem;
          border-radius: 12px;
          color: white;
          font-weight: 600;
          font-size: 0.9rem;
          z-index: 10000;
          transform: translateX(400px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        
        const colors = {
          success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          error: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          info: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        };
        
        notification.style.background = colors[type] || colors.info;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
          notification.style.transform = 'translateX(400px)';
          setTimeout(() => notification.remove(), 300);
        }, 3000);
      };

      try {
        const settingData = await fetchWithAuth('/o/c/bookingsettings');
        let maxAdvance = 0;
        const typeColorMap = {};

        settingData.items?.forEach(item => {
          const typeKey = item.resourceType?.key;
          const color = item.color;
          const advance = item.maxAdvanceBookingTime;
          if (advance > maxAdvance) maxAdvance = advance;
          if (typeKey && color) typeColorMap[typeKey] = color;
        });

        const maxDate = new Date(today);
        maxDate.setDate(today.getDate() + maxAdvance);
        const maxDateStr = maxDate.toISOString().split('T')[0];

        fromDateEl.value = todayStr;
        fromDateEl.min = todayStr;
        fromDateEl.max = maxDateStr;
        toDateEl.min = todayStr;
        toDateEl.max = maxDateStr;

        const picklistERC = "4313e15a-7721-b76a-6eb6-296d0c6d86b2";
        const typeMap = {};

        const picklistData = await fetchWithAuth(`/o/headless-admin-list-type/v1.0/list-type-definitions/by-external-reference-code/${picklistERC}/list-type-entries`);
        picklistData.items.forEach(entry => {
          if (!typeMap[entry.key]) {
            typeMap[entry.key] = entry.name;
            const opt = document.createElement('option');
            opt.value = entry.key;
            opt.textContent = entry.name;
            typeFilter.appendChild(opt);
          }
        });

        let allBookings = (await fetchWithAuth('/o/c/bookings?nestedFields=resourceBooking')).items;

        const calendar = new FullCalendar.Calendar(calendarEl, {
          initialView: 'dayGridMonth',
          headerToolbar: false,
          displayEventTime: false,
          events: [],
          datesSet: function(info) {
            const title = info.view.title;
            calendarTitleEl.textContent = title;
            calendarTitleEl.classList.remove('loading');
          },
          dateClick: function(info) {
            const clickedDate = new Date(info.dateStr);
            const btn = document.querySelector(`[data-date="${info.dateStr}"]`) || info.dayEl;
            
            // Add click animation
            if (btn) {
              btn.style.transform = 'scale(0.95)';
              setTimeout(() => {
                btn.style.transform = '';
              }, 150);
            }

            if (clickedDate < today) {
              showNotification("❌ You can't book in the past.", "error");
            } else if (clickedDate > maxDate) {
              showNotification("❌ You can't book beyond the allowed booking window.", "error");
            } else {
              showNotification(`✅ Opening booking modal for ${info.dateStr}`, "success");
            }
          },
          eventClick: function(info) {
            showNotification(`📋 Event: ${info.event.title}`, "info");
          }
        });

        calendar.render();

        const refreshCalendar = () => {
          const selectedType = typeFilter.value.trim();
          const selectedResource = resourceFilter.value.trim();
          const fromDate = fromDateEl.value;
          const toDate = toDateEl.value;
          const viewType = calendar.view?.type || 'dayGridMonth';

          const filtered = allBookings.filter(b => {
            const r = b.resourceBooking;
            if (!r) return false;

            const bookingTypeKey = r.type?.key || '';
            const bookingResId = (r.id || '').toString();
            const start = new Date(b.startDateTime);
            const end = new Date(b.endDateTime);
            const from = fromDate ? new Date(fromDate + 'T00:00:00') : null;
            const to = toDate ? new Date(toDate + 'T23:59:59') : null;

            if (selectedType && bookingTypeKey !== selectedType) return false;
            if (selectedResource && bookingResId !== selectedResource) return false;
            if (from && end < from) return false;
            if (to && start > to) return false;

            return true;
          }).map(b => {
            const typeKey = b.resourceBooking?.type?.key;
            const color = typeColorMap[typeKey] || '#667eea';

            return {
              title: `${b.resourceBooking?.name || 'Booking'}`,
              start: b.startDateTime,
              end: b.endDateTime,
              allDay: viewType === 'dayGridMonth',
              backgroundColor: color,
              borderColor: color,
              textColor: '#fff'
            };
          });

          calendar.removeAllEvents();
          calendar.addEventSource(filtered);
        };

        refreshCalendar();

        typeFilter.addEventListener('change', () => {
          const selectedType = typeFilter.value.trim();
          resourceFilter.innerHTML = '<option value="">All Resources</option>';
          if (!selectedType) {
            resourceLabel.style.display = 'none';
          } else {
            const resourceSet = new Map();
            allBookings.forEach(b => {
              const r = b.resourceBooking;
              if (r?.type?.key === selectedType) {
                resourceSet.set(r.id, r.name);
              }
            });
            resourceSet.forEach((name, id) => {
              const opt = document.createElement('option');
              opt.value = id;
              opt.textContent = name;
              resourceFilter.appendChild(opt);
            });
            resourceLabel.style.display = 'inline-block';
          }
        });

        this.querySelector('#applyFilters').addEventListener('click', () => {
          refreshCalendar();
          showNotification("🔄 Filters applied successfully!", "success");
        });

        this.querySelectorAll('.view-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            calendar.changeView(btn.dataset.view);
            setTimeout(refreshCalendar, 0);
          });
        });

        // Set initial active view button
        this.querySelector('.view-btn[data-view="dayGridMonth"]').classList.add('active');

      } catch (error) {
        console.error('Error loading calendar:', error);
        calendarTitleEl.textContent = 'Error loading calendar';
        calendarTitleEl.classList.remove('loading');
        showNotification("❌ Error loading calendar data", "error");
      }
    };

    document.body.appendChild(script);
  }
}

customElements.define('booking-calendar', BookingCalendar);
