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
          display: block;
          background: #f8f9fa;
          min-height: 100vh;
          padding: 2rem;
        }

        .calendar-container {
          max-width: 1400px;
          margin: 0 auto;
          background: white;
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 2rem;
        }

        .filter-bar {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
          margin-bottom: 2rem;
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 6px;
          border: 1px solid #e1e5e9;
        }

        .filter-bar label {
          font-weight: 500;
          color: #495057;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-size: 0.9rem;
        }

        .filter-bar select, 
        .filter-bar input {
          padding: 8px 12px;
          border-radius: 4px;
          border: 1px solid #ced4da;
          background: white;
          font-size: 0.9rem;
          transition: border-color 0.2s ease;
          color: #495057;
        }

        .filter-bar select:focus, 
        .filter-bar input:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }

        .filter-bar button {
          padding: 8px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          font-weight: 500;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .filter-bar button:hover {
          background: #0056b3;
        }

        .filter-bar button:active {
          background: #004085;
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding: 1rem 0;
          border-bottom: 1px solid #e1e5e9;
        }

        #calendarTitle {
          font-size: 1.5rem;
          font-weight: 600;
          color: #212529;
        }

        .view-toggle {
          display: flex;
          gap: 0.25rem;
          background: #f8f9fa;
          padding: 0.25rem;
          border-radius: 4px;
          border: 1px solid #e1e5e9;
        }

        .view-btn {
          width: 40px;
          height: 32px;
          border-radius: 3px;
          background: transparent;
          color: #6c757d;
          font-weight: 500;
          font-size: 0.85rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .view-btn:hover {
          background: #e9ecef;
          color: #495057;
        }

        .view-btn.active {
          background: #007bff;
          color: white;
        }

        #calendar {
          background: white;
          border-radius: 6px;
          padding: 1rem;
          border: 1px solid #e1e5e9;
        }

        /* FullCalendar Custom Styling */
        #calendar .fc {
          font-family: 'Inter', sans-serif !important;
        }

        #calendar .fc-theme-standard .fc-scrollgrid {
          border: 1px solid #e1e5e9 !important;
          border-radius: 4px !important;
        }

        /* Header styling - simple and clean */
        #calendar .fc-col-header-cell {
          background: #f8f9fa !important;
          color: #495057 !important;
          font-weight: 600 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
          padding: 0.75rem 0.5rem !important;
          border-bottom: 1px solid #e1e5e9 !important;
          font-size: 0.75rem !important;
        }

        /* Day cells - remove hover effects to prevent event hiding */
        #calendar .fc-daygrid-day {
          background: white !important;
          border: 1px solid #e1e5e9 !important;
          min-height: 120px !important;
        }

        /* Remove today highlighting that was too blue */
        #calendar .fc-day-today {
          background: #f8f9fa !important;
          border: 1px solid #007bff !important;
        }

        /* Day number styling - Remove anchor behavior and improve appearance */
        #calendar .fc-daygrid-day-number {
          color: #212529 !important;
          text-decoration: none !important;
          font-weight: 600 !important;
          font-size: 0.9rem !important;
          padding: 6px 10px !important;
          margin: 4px !important;
          border-radius: 4px !important;
          transition: all 0.2s ease !important;
          cursor: pointer !important;
          display: inline-block !important;
          min-width: 28px !important;
          text-align: center !important;
        }

        /* Hover effect for day numbers */
        #calendar .fc-daygrid-day-number:hover {
          background: #f8f9fa !important;
          color: #495057 !important;
          text-decoration: none !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
        }

        /* Remove any link styling */
        #calendar .fc-daygrid-day-number:link,
        #calendar .fc-daygrid-day-number:visited {
          color: #212529 !important;
          text-decoration: none !important;
        }

        #calendar .fc-day-today .fc-daygrid-day-number {
          background: #007bff !important;
          color: white !important;
          border-radius: 4px !important;
          font-weight: 700 !important;
        }

        #calendar .fc-day-today .fc-daygrid-day-number:hover {
          background: #0056b3 !important;
          color: white !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3) !important;
        }

        #calendar .fc-event {
          border: none !important;
          border-radius: 3px !important;
          padding: 2px 6px !important;
          margin: 1px !important;
          font-weight: 500 !important;
          font-size: 0.8rem !important;
          cursor: pointer !important;
        }

        #calendar .fc-event-title {
          font-weight: 500 !important;
        }

        /* Navigation buttons */
        #calendar .fc-toolbar {
          margin-bottom: 1rem !important;
        }

        #calendar .fc-button-group > .fc-button {
          background: #f8f9fa !important;
          border: 1px solid #e1e5e9 !important;
          color: #495057 !important;
          font-size: 0.9rem !important;
          padding: 0.375rem 0.75rem !important;
        }

        #calendar .fc-button-group > .fc-button:hover {
          background: #e9ecef !important;
          border-color: #adb5bd !important;
          color: #495057 !important;
        }

        #calendar .fc-button-group > .fc-button:focus {
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25) !important;
        }

        #calendar .fc-button-group > .fc-button.fc-button-active {
          background: #007bff !important;
          border-color: #007bff !important;
          color: white !important;
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
            font-size: 1.25rem;
          }
          
          .view-btn {
            width: 36px;
            height: 28px;
            font-size: 0.8rem;
          }
        }

        /* Loading Animation */
        .loading {
          color: #6c757d !important;
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
            Apply Filters
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

      // Simple notification system
      const showNotification = (message, type = "info") => {
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 0.75rem 1rem;
          border-radius: 4px;
          color: white;
          font-weight: 500;
          font-size: 0.9rem;
          z-index: 10000;
          transform: translateX(100%);
          transition: transform 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;
        
        const colors = {
          success: '#28a745',
          error: '#dc3545',
          info: '#007bff'
        };
        
        notification.style.background = colors[type] || colors.info;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
          notification.style.transform = 'translateX(100%)';
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
          headerToolbar: {
            left: 'prev,next today',
            center: false, // We handle title in our custom header
            right: ''
          },
          displayEventTime: false,
          events: [],
          datesSet: function(info) {
            const title = info.view.title;
            calendarTitleEl.textContent = title;
            calendarTitleEl.classList.remove('loading');
          },
          dateClick: function(info) {
            const clickedDate = new Date(info.dateStr);

            if (clickedDate < today) {
              showNotification("You can't book in the past.", "error");
            } else if (clickedDate > maxDate) {
              showNotification("You can't book beyond the allowed booking window.", "error");
            } else {
              showNotification(`Opening booking modal for ${info.dateStr}`, "success");
            }
          },
          eventClick: function(info) {
            showNotification(`Event: ${info.event.title}`, "info");
          }
        });

        calendar.render();

        const refreshCalendar = () => {
          const selectedType = typeFilter.value.trim();
          const selectedResource = resourceFilter.value.trim();
          const fromDate = fromDateEl.value;
          const toDate = toDateEl.value;
          const currentView = calendar.view?.type || 'dayGridMonth';

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
            const color = typeColorMap[typeKey] || '#007bff';

            return {
              title: `${b.resourceBooking?.name || 'Booking'}`,
              start: b.startDateTime,
              end: b.endDateTime,
              allDay: currentView === 'dayGridMonth', // Set allDay only for month view
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
          showNotification("Filters applied successfully!", "success");
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
        showNotification("Error loading calendar data", "error");
      }
    };

    document.body.appendChild(script);
  }
}

customElements.define('booking-calendar', BookingCalendar);
