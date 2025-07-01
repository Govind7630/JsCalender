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
          padding: 0.5rem;
          font-size: 13px;
          height: 100vh;
          overflow: hidden;
        }

        .calendar-container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 0.75rem;
          height: calc(100vh - 1rem);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .compact-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid #e1e5e9;
          flex-shrink: 0;
        }

        #calendarTitle {
          font-size: 1.1rem;
          font-weight: 600;
          color: #212529;
          margin: 0;
        }

        .header-controls {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .filter-toggle {
          background: #f8f9fa;
          border: 1px solid #e1e5e9;
          border-radius: 4px;
          padding: 0.4rem 0.75rem;
          font-size: 0.8rem;
          font-weight: 500;
          color: #495057;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .filter-toggle:hover {
          background: #e9ecef;
          border-color: #adb5bd;
        }

        .filter-toggle.active {
          background: #007bff;
          border-color: #007bff;
          color: white;
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
          width: 32px;
          height: 24px;
          border-radius: 3px;
          background: transparent;
          color: #6c757d;
          font-weight: 500;
          font-size: 0.75rem;
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

        .filter-panel {
          background: #f8f9fa;
          border: 1px solid #e1e5e9;
          border-radius: 6px;
          margin-bottom: 0.5rem;
          transition: all 0.3s ease;
          overflow: hidden;
          flex-shrink: 0;
        }

        .filter-panel.collapsed {
          max-height: 0;
          margin-bottom: 0;
          border: none;
          opacity: 0;
        }

        .filter-content {
          padding: 0.75rem;
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          align-items: flex-end;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          min-width: 100px;
        }

        .filter-group label {
          font-weight: 500;
          color: #495057;
          font-size: 0.75rem;
          white-space: nowrap;
        }

        .filter-group select, 
        .filter-group input {
          padding: 0.25rem 0.5rem;
          border-radius: 3px;
          border: 1px solid #ced4da;
          background: white;
          font-size: 0.75rem;
          color: #495057;
          height: 28px;
          transition: border-color 0.2s ease;
        }

        .filter-group select:focus, 
        .filter-group input:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 1px rgba(0, 123, 255, 0.25);
        }

        .apply-btn {
          padding: 0.25rem 0.75rem;
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
          color: white;
          border: none;
          border-radius: 4px;
          font-weight: 600;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          height: 28px;
          min-width: 80px;
        }

        .apply-btn:hover {
          background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 123, 255, 0.3);
        }

        #calendar {
          background: white;
          border-radius: 6px;
          padding: 0.5rem;
          border: 1px solid #e1e5e9;
          flex: 1;
          overflow: hidden;
          min-height: 0;
        }

        /* FullCalendar Custom Styling - Ultra Compact */
        #calendar .fc {
          font-family: 'Inter', sans-serif !important;
          font-size: 0.8rem !important;
          height: 100% !important;
        }

        #calendar .fc-view-harness {
          height: 100% !important;
        }

        #calendar .fc-theme-standard .fc-scrollgrid {
          border: 1px solid #e1e5e9 !important;
          border-radius: 4px !important;
        }

        /* Ultra compact header */
        #calendar .fc-col-header-cell {
          background: #f8f9fa !important;
          color: #495057 !important;
          font-weight: 600 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
          padding: 0.25rem 0.125rem !important;
          border-bottom: 1px solid #e1e5e9 !important;
          font-size: 0.65rem !important;
        }

        #calendar .fc-col-header-cell a {
          color: #495057 !important;
          text-decoration: none !important;
          cursor: default !important;
          pointer-events: none !important;
        }

        /* Ultra compact day cells */
        #calendar .fc-daygrid-day {
          background: white !important;
          border: 1px solid #e1e5e9 !important;
          min-height: 60px !important;
        }

        #calendar .fc-day-today {
          background: #f8f9fa !important;
          border: 1px solid #007bff !important;
        }

        /* Ultra compact day numbers */
        #calendar .fc-daygrid-day-number {
          color: #212529 !important;
          text-decoration: none !important;
          font-weight: 600 !important;
          font-size: 0.7rem !important;
          padding: 2px 6px !important;
          margin: 2px !important;
          border-radius: 3px !important;
          transition: all 0.3s ease !important;
          cursor: pointer !important;
          display: inline-block !important;
          min-width: 20px !important;
          text-align: center !important;
          background: transparent !important;
          border: 1px solid transparent !important;
        }

        #calendar .fc-daygrid-day-number:hover {
          background: linear-gradient(135deg, #007bff, #0056b3) !important;
          color: white !important;
          text-decoration: none !important;
          transform: translateY(-1px) scale(1.05) !important;
          box-shadow: 0 2px 6px rgba(0, 123, 255, 0.4) !important;
          border: 1px solid #007bff !important;
        }

        #calendar .fc-day-today .fc-daygrid-day-number {
          background: linear-gradient(135deg, #007bff, #0056b3) !important;
          color: white !important;
          border-radius: 3px !important;
          font-weight: 700 !important;
          border: 1px solid #007bff !important;
        }

        /* Ultra compact events */
        #calendar .fc-event {
          border: none !important;
          border-radius: 2px !important;
          padding: 0px 3px !important;
          margin: 0.5px !important;
          font-weight: 500 !important;
          font-size: 0.65rem !important;
          cursor: pointer !important;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
          transition: all 0.2s ease !important;
          line-height: 1.1 !important;
        }

        #calendar .fc-event:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
        }

        #calendar .fc-event-title {
          font-weight: 500 !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
        }

        /* Compact navigation */
        #calendar .fc-toolbar {
          margin-bottom: 0.5rem !important;
        }

        #calendar .fc-button-group > .fc-button {
          background: #f8f9fa !important;
          border: 1px solid #e1e5e9 !important;
          color: #495057 !important;
          font-size: 0.75rem !important;
          padding: 0.125rem 0.375rem !important;
          height: 24px !important;
        }

        #calendar .fc-button-group > .fc-button:hover {
          background: #e9ecef !important;
          border-color: #adb5bd !important;
          color: #495057 !important;
        }

        #calendar .fc-button-group > .fc-button.fc-button-active {
          background: #007bff !important;
          border-color: #007bff !important;
          color: white !important;
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          :host {
            padding: 0.25rem;
            font-size: 12px;
          }
          
          .calendar-container {
            padding: 0.5rem;
            height: calc(100vh - 0.5rem);
          }
          
          .filter-content {
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .filter-group {
            min-width: auto;
            width: 100%;
          }
          
          .compact-header {
            flex-direction: column;
            gap: 0.5rem;
            text-align: center;
          }
          
          .header-controls {
            justify-content: center;
          }
          
          #calendar .fc-daygrid-day {
            min-height: 45px !important;
          }
          
          #calendar .fc-event {
            font-size: 0.6rem !important;
            padding: 0px 2px !important;
          }
        }

        /* Loading state */
        .loading {
          color: #6c757d !important;
        }

        /* Filter icons */
        .filter-icon {
          font-size: 0.7rem;
          transition: transform 0.3s ease;
        }

        .filter-toggle.active .filter-icon {
          transform: rotate(180deg);
        }
      </style>

      <div class="calendar-container">
        <div class="compact-header">
          <h2 id="calendarTitle" class="loading">Loading Calendar...</h2>
          <div class="header-controls">
            <button class="filter-toggle" id="filterToggle">
              <span>🔍 Filters</span>
              <span class="filter-icon">▼</span>
            </button>
            <div class="view-toggle">
              <button class="view-btn" data-view="dayGridMonth" title="Month">M</button>
              <button class="view-btn" data-view="timeGridWeek" title="Week">W</button>
              <button class="view-btn" data-view="timeGridDay" title="Day">D</button>
            </div>
          </div>
        </div>

        <div class="filter-panel collapsed" id="filterPanel">
          <div class="filter-content">
            <div class="filter-group">
              <label>📋 Type</label>
              <select id="typeFilter"><option value="">All Types</option></select>
            </div>

            <div class="filter-group" id="resourceGroup" style="display:none;">
              <label>🏢 Resource</label>
              <select id="resourceFilter"><option value="">All Resources</option></select>
            </div>

            <div class="filter-group">
              <label>📅 From</label>
              <input type="date" id="fromDate" />
            </div>

            <div class="filter-group">
              <label>📅 To</label>
              <input type="date" id="toDate" />
            </div>

            <button class="apply-btn" id="applyFilters">Apply</button>
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
      const resourceGroup = this.querySelector('#resourceGroup');
      const fromDateEl = this.querySelector('#fromDate');
      const toDateEl = this.querySelector('#toDate');
      const filterToggle = this.querySelector('#filterToggle');
      const filterPanel = this.querySelector('#filterPanel');

      // Filter toggle functionality
      filterToggle.addEventListener('click', () => {
        filterPanel.classList.toggle('collapsed');
        filterToggle.classList.toggle('active');
      });

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
          padding: 0.5rem 0.75rem;
          border-radius: 4px;
          color: white;
          font-weight: 500;
          font-size: 0.8rem;
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
            center: false,
            right: ''
          },
          height: '100%',
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
              showNotification("Can't book in the past", "error");
            } else if (clickedDate > maxDate) {
              showNotification("Beyond booking window", "error");
            } else {
                openModal();
                const now = new Date();
                const clickedDate = new Date(info.dateStr);
                clickedDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
                const endDate = new Date(clickedDate.getTime() + 60 * 60 * 1000);

                const format = date => date.toISOString().slice(0, 16);
                document.getElementById('startDateTime').value = format(clickedDate);
                document.getElementById('endDateTime').value = format(endDate);}
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
                end: currentView === 'dayGridMonth'? new Date(new Date(b.endDateTime).getTime() + 86400000).toISOString() : b.endDateTime,
                allDay: currentView === 'dayGridMonth',
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
            resourceGroup.style.display = 'none';
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
            resourceGroup.style.display = 'block';
          }
        });

        this.querySelector('#applyFilters').addEventListener('click', () => {
          refreshCalendar();
          showNotification("Filters applied!", "success");
          // Auto-collapse filters after applying
          filterPanel.classList.add('collapsed');
          filterToggle.classList.remove('active');
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
        showNotification("Error loading calendar", "error");
      }
    };

    document.body.appendChild(script);
  }
}

customElements.define('booking-calendar', BookingCalendar);
