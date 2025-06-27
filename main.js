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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        :host {
          font-family: "Inter", sans-serif;
        }

        .filter-bar {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
          background: #f9f9f9;
          padding: 1rem;
          border-radius: 12px;
          box-shadow: 0 1px 5px rgba(0,0,0,0.05);
        }

        .filter-bar label {
          font-weight: 500;
        }

        .filter-bar select, .filter-bar input {
          padding: 6px 10px;
          border-radius: 6px;
          border: 1px solid #ccc;
        }

        .filter-bar button {
          padding: 6px 14px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        .view-toggle {
          display: flex;
          justify-content: flex-start;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .view-btn {
          background: #e5f4ee;
          border: none;
          padding: 6px 14px;
          border-radius: 999px;
          color: #057a55;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .view-btn:hover,
        .view-btn.active {
          background: #057a55;
          color: white;
        }

        #calendar {
          background: white;
          border-radius: 12px;
          padding: 1rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .fc .fc-day-today {
          background-color: transparent !important;
          position: relative;
        }

        .fc .fc-day-today::after {
          content: '';
          position: absolute;
          top: 5px;
          left: 5px;
          right: 5px;
          bottom: 5px;
          border: 2px solid #057a55;
          border-radius: 50%;
          pointer-events: none;
        }

        .fc-toolbar-title {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .fc .fc-button {
          background: transparent;
          border: none;
          color: #333;
          font-size: 1.2rem;
        }

        .fc .fc-button:hover {
          color: #057a55;
        }

        .fc-daygrid-day-number {
          font-weight: 600;
          font-size: 0.875rem;
          padding: 4px;
        }
      </style>

      <div class="filter-bar">
        <label>Type:
          <select id="typeFilter">
            <option value="">All</option>
          </select>
        </label>

        <label id="resourceLabel" style="display:none;">Resource:
          <select id="resourceFilter">
            <option value="">All</option>
          </select>
        </label>

        <label>From:
          <input type="date" id="fromDate" />
        </label>

        <label>To:
          <input type="date" id="toDate" />
        </label>

        <button id="applyFilters">Apply Filters</button>
      </div>

      <div class="view-toggle">
        <button class="view-btn active" data-view="dayGridMonth">M</button>
        <button class="view-btn" data-view="timeGridWeek">W</button>
        <button class="view-btn" data-view="timeGridDay">D</button>
      </div>

      <div id="calendar"></div>
    `;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/@fullcalendar/core@6.1.8/index.global.min.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.8/index.global.min.js';
    script.onload = async () => {
      const token = await this.getAccessToken();
      const fetchWithAuth = async (url) => {
        const res = await fetch(url, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        return res.json();
      };

      const calendarEl = this.querySelector('#calendar');
      const typeFilter = this.querySelector('#typeFilter');
      const resourceFilter = this.querySelector('#resourceFilter');
      const resourceLabel = this.querySelector('#resourceLabel');
      const fromDateEl = this.querySelector('#fromDate');
      const toDateEl = this.querySelector('#toDate');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

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
        displayEventTime: true,
        events: [],
        dateClick: function(info) {
          const clickedDate = new Date(info.dateStr);
          if (clickedDate < today) {
            alert("❌ You can't book in the past.");
          } else if (clickedDate > maxDate) {
            alert("❌ You can't book beyond the allowed booking window.");
          } else {
            alert(`✅ Open booking modal for: ${info.dateStr}`);
          }
        }
      });

      calendar.render();

      const refreshCalendar = () => {
        const selectedType = typeFilter.value.trim();
        const selectedResource = resourceFilter.value.trim();
        const fromDate = fromDateEl.value;
        const toDate = toDateEl.value;
        const viewType = calendar.view.type;

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
          const color = typeColorMap[typeKey] || '#999';

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
        resourceFilter.innerHTML = '<option value="">All</option>';
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

      this.querySelector('#applyFilters').addEventListener('click', refreshCalendar);

      this.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          calendar.changeView(btn.dataset.view);
          refreshCalendar();
        });
      });
    };

    document.body.appendChild(script);
  }
}

customElements.define('booking-calendar', BookingCalendar);
