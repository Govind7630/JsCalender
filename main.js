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
      <link href="https://cdn.jsdelivr.net/npm/fullcalendar@6.1.8/main.min.css" rel="stylesheet">
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">

      <div class="p-4 space-y-4">
        <div class="flex flex-wrap items-center gap-4 bg-gray-100 p-4 rounded-lg">
          <label class="font-medium">Type:
            <select id="typeFilter" class="ml-2 px-2 py-1 rounded border">
              <option value="">All</option>
            </select>
          </label>

          <label id="resourceLabel" class="font-medium hidden">Resource:
            <select id="resourceFilter" class="ml-2 px-2 py-1 rounded border">
              <option value="">All</option>
            </select>
          </label>

          <label class="font-medium">From:
            <input type="date" id="fromDate" class="ml-2 px-2 py-1 rounded border" />
          </label>

          <label class="font-medium">To:
            <input type="date" id="toDate" class="ml-2 px-2 py-1 rounded border" />
          </label>

          <button id="applyFilters" class="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700">Apply Filters</button>
        </div>

        <div class="flex gap-2">
          <button class="view-btn bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded" data-view="dayGridMonth">M</button>
          <button class="view-btn bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded" data-view="timeGridWeek">W</button>
          <button class="view-btn bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded" data-view="timeGridDay">D</button>
        </div>

        <div id="calendar" class="bg-white p-4 rounded shadow"></div>
      </div>
    `;

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.8/main.global.min.js';
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
        if (item.maxAdvanceBookingTime > maxAdvance) maxAdvance = item.maxAdvanceBookingTime;
        if (typeKey && item.color) typeColorMap[typeKey] = item.color;
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
        typeMap[entry.key] = entry.name;
        const opt = document.createElement('option');
        opt.value = entry.key;
        opt.textContent = entry.name;
        typeFilter.appendChild(opt);
      });

      const allBookings = (await fetchWithAuth('/o/c/bookings?nestedFields=resourceBooking')).items;

      const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: false,
        displayEventTime: false,
        events: [],
        dateClick(info) {
          const clicked = new Date(info.dateStr);
          if (clicked < today) return alert("Can't book in past");
          if (clicked > maxDate) return alert("Can't book beyond advance window");
          alert(`Book for: ${info.dateStr}`);
        }
      });

      calendar.render();

      const refreshCalendar = () => {
        const viewType = calendar.view.type;
        const selectedType = typeFilter.value.trim();
        const selectedResource = resourceFilter.value.trim();
        const fromDate = fromDateEl.value;
        const toDate = toDateEl.value;

        const filtered = allBookings.filter(b => {
          const r = b.resourceBooking;
          if (!r) return false;

          const bookingType = r.type?.key || '';
          const bookingResId = (r.id || '').toString();
          const start = new Date(b.startDateTime);
          const end = new Date(b.endDateTime);
          const from = fromDate ? new Date(fromDate + 'T00:00:00') : null;
          const to = toDate ? new Date(toDate + 'T23:59:59') : null;

          if (selectedType && bookingType !== selectedType) return false;
          if (selectedResource && bookingResId !== selectedResource) return false;
          if (from && end < from) return false;
          if (to && start > to) return false;

          return true;
        }).map(b => {
          const color = typeColorMap[b.resourceBooking?.type?.key] || '#999';
          return {
            title: b.resourceBooking?.name || 'Booking',
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
          resourceLabel.classList.add('hidden');
        } else {
          const resourceSet = new Map();
          allBookings.forEach(b => {
            const r = b.resourceBooking;
            if (r?.type?.key === selectedType) resourceSet.set(r.id, r.name);
          });
          resourceSet.forEach((name, id) => {
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = name;
            resourceFilter.appendChild(opt);
          });
          resourceLabel.classList.remove('hidden');
        }
      });

      this.querySelector('#applyFilters').addEventListener('click', refreshCalendar);
      this.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          calendar.changeView(btn.dataset.view);
          refreshCalendar();
        });
      });
    };
    document.body.appendChild(script);
  }
}

customElements.define('booking-calendar', BookingCalendar);
