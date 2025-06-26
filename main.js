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
        .filter-bar {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
          background: #eef1f5;
          padding: 1rem;
          border-radius: 10px;
        }
        .filter-bar label {
          font-weight: 500;
        }
        .filter-bar select, .filter-bar input {
          padding: 5px 10px;
          border-radius: 5px;
          border: 1px solid #ccc;
        }
        .filter-bar button {
          padding: 6px 14px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 6px;
        }
        #calendar {
          background: white;
          border-radius: 10px;
          padding: 1rem;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .fc-disabled-day {
          background-color: #f0f0f0 !important;
          color: #999 !important;
          pointer-events: none;
          cursor: not-allowed;
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

      <div id="calendar"></div>
    `;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.17/index.global.min.css';
    document.head.appendChild(link);

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
      const typeFilter = this.querySelector('#typeFilter');
      const resourceFilter = this.querySelector('#resourceFilter');
      const resourceLabel = this.querySelector('#resourceLabel');
      const fromDateEl = this.querySelector('#fromDate');
      const toDateEl = this.querySelector('#toDate');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      const settingData = await fetchWithAuth('/o/c/booking-setting/resourcetype');
      let maxAdvance = 0;
      settingData.items?.forEach(item => {
        if (item.MaxAdvanceBookingTime > maxAdvance) {
          maxAdvance = item.MaxAdvanceBookingTime;
        }
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
        displayEventTime: false,
        events: [],
        dayCellDidMount: (info) => {
          const date = new Date(info.date);
          date.setHours(0, 0, 0, 0);
          if (date < today || date > maxDate) {
            info.el.classList.add('fc-disabled-day');
          }
        },
        dateClick: (info) => {
          const clickedDate = new Date(info.dateStr);
          clickedDate.setHours(0, 0, 0, 0);
          if (clickedDate >= today && clickedDate <= maxDate) {
            alert(`Open modal here for date: ${info.dateStr}`);
          }
        }
      });

      calendar.render();

      const refreshCalendar = () => {
        const selectedType = typeFilter.value.trim();
        const selectedResource = resourceFilter.value.trim();
        const fromDate = fromDateEl.value;
        const toDate = toDateEl.value;

        const filtered = allBookings.filter(b => {
          const r = b.resourceBooking;
          if (!r) return false;

          const bookingTypeKey = r.type?.key?.trim?.() || '';
          const bookingResId = (r.id || '').toString();

          const start = new Date(b.startDateTime);
          const end = new Date(b.endDateTime);
          const from = fromDate ? new Date(fromDate + 'T00:00:00') : null;
          const to = toDate ? new Date(toDate + 'T23:59:59') : null;

          if (selectedType && bookingTypeKey !== selectedType) return false;
          if (selectedResource && bookingResId !== selectedResource) return false;
          if (from && start < from) return false;
          if (to && end > to) return false;

          return true;
        }).map(b => {
          return {
            title: `${b.resourceBooking?.name || 'Booking'}`,
            start: b.startDateTime,
            end: b.endDateTime
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
    };

    document.body.appendChild(script);
  }
}

customElements.define('booking-calendar', BookingCalendar);
