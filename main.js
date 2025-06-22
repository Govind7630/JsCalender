class BookingCalendar extends HTMLElement {
  formatTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  connectedCallback() {
    this.innerHTML = `
      <div style="padding: 1rem; background: #f5f7fa; border-radius: 8px; margin-bottom: 1rem;">
        <label style="margin-right: 1rem;">Type:
          <select id="typeFilter" style="padding: 4px 8px;">
            <option value="">All</option>
          </select>
        </label>

        <label id="resourceFilterWrapper" style="margin-right: 1rem; display:none;">Resource:
          <select id="resourceFilter" style="padding: 4px 8px;">
            <option value="">All</option>
          </select>
        </label>

        <label style="margin-right: 1rem;">From:
          <input type="date" id="fromDate" style="padding: 4px 6px;" />
        </label>

        <label style="margin-right: 1rem;">To:
          <input type="date" id="toDate" style="padding: 4px 6px;" />
        </label>

        <button id="applyFilters" style="padding: 6px 12px; background-color: #1976d2; color: white; border: none; border-radius: 4px;">Apply Filters</button>
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
      const calendarEl = this.querySelector('#calendar');
      const typeFilter = this.querySelector('#typeFilter');
      const resourceFilter = this.querySelector('#resourceFilter');
      const resourceFilterWrapper = this.querySelector('#resourceFilterWrapper');
      const fromDateEl = this.querySelector('#fromDate');
      const toDateEl = this.querySelector('#toDate');

      const picklistERC = "4313e15a-7721-b76a-6eb6-296d0c6d86b2";
      const typeMap = {};

      const picklistRes = await fetch(`/o/headless-admin-list-type/v1.0/list-type-definitions/by-external-reference-code/${picklistERC}/list-type-entries`);
      const picklistData = await picklistRes.json();

      picklistData.items.forEach(entry => {
        typeMap[entry.key] = entry.name;
        const opt = document.createElement('option');
        opt.value = entry.key;
        opt.textContent = entry.name;
        typeFilter.appendChild(opt);
      });

      const allBookingsRes = await fetch('/o/c/bookings?nestedFields=resourceBooking');
      const allBookings = (await allBookingsRes.json()).items.filter(b => new Date(b.endDateTime) >= new Date());

      // Default fromDate = today
      const today = new Date().toISOString().split('T')[0];
      fromDateEl.value = today;
      fromDateEl.min = today;
      toDateEl.setAttribute('disabled', 'true');

      const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        displayEventTime: false,
        events: [],

        eventContent: function (arg) {
          const { start, end, resource } = arg.event.extendedProps;
          const container = document.createElement('div');
          container.innerHTML = `
            <div style="font-weight:bold;">${start} → ${end}</div>
            <div style="font-size: 0.9em; color: #555;">${resource}</div>
          `;
          return { domNodes: [container] };
        }
      });

      calendar.render();

      function applyFilters() {
        const selectedType = typeFilter.value;
        const selectedResource = resourceFilter.value;
        const fromDate = fromDateEl.value || today;
        const toDate = toDateEl.value;

        const filtered = allBookings
          .filter(item => {
            const res = item.resourceBooking;
            const start = new Date(item.startDateTime);
            const end = new Date(item.endDateTime);

            if (selectedType && res?.type !== selectedType) return false;
            if (selectedResource && res?.id?.toString() !== selectedResource) return false;
            if (fromDate && start < new Date(fromDate)) return false;
            if (toDate && end > new Date(toDate + "T23:59:59")) return false;

            return true;
          })
          .map(item => {
            const startTime = this.formatTime(item.startDateTime);
            const endTime = this.formatTime(item.endDateTime);
            const resourceName = item.resourceBooking?.name || 'Unknown';

            return {
              title: '',
              start: item.startDateTime,
              end: item.endDateTime,
              extendedProps: {
                start: startTime,
                end: endTime,
                resource: resourceName
              }
            };
          });

        calendar.removeAllEvents();
        calendar.addEventSource(filtered);
      }

      // Bind this so we can use `this.formatTime` inside applyFilters
      applyFilters = applyFilters.bind(this);
      applyFilters();

      // Filter: Type change
      typeFilter.addEventListener('change', () => {
        const selectedType = typeFilter.value;
        resourceFilter.innerHTML = `<option value="">All</option>`;
        if (!selectedType) {
          resourceFilterWrapper.style.display = 'none';
        } else {
          const resSet = new Map();
          allBookings.forEach(b => {
            const r = b.resourceBooking;
            if (r?.type === selectedType) resSet.set(r.id, r.name);
          });
          resSet.forEach((name, id) => {
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = name;
            resourceFilter.appendChild(opt);
          });
          resourceFilterWrapper.style.display = 'inline-block';
        }
      });

      // Filter: From date change
      fromDateEl.addEventListener('change', () => {
        if (fromDateEl.value) {
          toDateEl.removeAttribute('disabled');
          toDateEl.min = fromDateEl.value;
        } else {
          toDateEl.value = '';
          toDateEl.setAttribute('disabled', 'true');
        }
      });

      // Apply filters on button click
      this.querySelector('#applyFilters').addEventListener('click', () => {
        applyFilters();
      });
    };

    document.body.appendChild(script);
  }
}

customElements.define('booking-calendar', BookingCalendar);
