class BookingCalendar extends HTMLElement {
  async getAccessToken() {
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("client_id", "your-client-id");
    params.append("client_secret", "your-client-secret");

    const res = await fetch("/o/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });

    const data = await res.json();
    return data.access_token;
  }

  connectedCallback() {
    this.innerHTML = `
      <div class="p-4 bg-gray-100 rounded-lg shadow-md">
        <div class="mb-4 flex flex-wrap gap-4 items-center">
          <label class="font-medium">Type:
            <select id="typeFilter" class="ml-2 px-2 py-1 border rounded">
              <option value="">All</option>
            </select>
          </label>
          <label class="font-medium hidden" id="resourceLabel">Resource:
            <select id="resourceFilter" class="ml-2 px-2 py-1 border rounded">
              <option value="">All</option>
            </select>
          </label>
          <label class="font-medium">From:
            <input type="date" id="fromDate" class="ml-2 px-2 py-1 border rounded" />
          </label>
          <label class="font-medium">To:
            <input type="date" id="toDate" class="ml-2 px-2 py-1 border rounded" />
          </label>
          <button id="applyFilters" class="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700">Apply</button>
        </div>

        <div class="flex space-x-2 mb-2">
          <button class="view-btn px-3 py-1 rounded-full bg-gray-200 hover:bg-gray-300" data-view="dayGridMonth">M</button>
          <button class="view-btn px-3 py-1 rounded-full bg-gray-200 hover:bg-gray-300" data-view="timeGridWeek">W</button>
          <button class="view-btn px-3 py-1 rounded-full bg-gray-200 hover:bg-gray-300" data-view="timeGridDay">D</button>
        </div>

        <div id="calendar" class="bg-white rounded-lg shadow overflow-hidden"></div>
      </div>
    `;

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/fullcalendar@6.1.8/index.global.min.js";
    script.onload = async () => {
      const token = await this.getAccessToken();
      const fetchWithAuth = async (url) =>
        fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.json());

      const calendarEl = this.querySelector("#calendar");
      const typeFilter = this.querySelector("#typeFilter");
      const resourceFilter = this.querySelector("#resourceFilter");
      const resourceLabel = this.querySelector("#resourceLabel");
      const fromDateEl = this.querySelector("#fromDate");
      const toDateEl = this.querySelector("#toDate");

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split("T")[0];

      const settingData = await fetchWithAuth("/o/c/bookingsettings");
      const typeColorMap = {};
      let maxAdvance = 0;
      settingData.items?.forEach((item) => {
        const typeKey = item.resourceType?.key;
        if (typeKey) {
          typeColorMap[typeKey] = item.color || "#999";
          maxAdvance = Math.max(maxAdvance, item.maxAdvanceBookingTime || 0);
        }
      });

      const maxDate = new Date(today);
      maxDate.setDate(today.getDate() + maxAdvance);
      const maxDateStr = maxDate.toISOString().split("T")[0];

      fromDateEl.value = todayStr;
      fromDateEl.min = todayStr;
      fromDateEl.max = maxDateStr;
      toDateEl.min = todayStr;
      toDateEl.max = maxDateStr;

      const picklistData = await fetchWithAuth(
        "/o/headless-admin-list-type/v1.0/list-type-definitions/by-external-reference-code/4313e15a-7721-b76a-6eb6-296d0c6d86b2/list-type-entries"
      );
      picklistData.items?.forEach((entry) => {
        const opt = document.createElement("option");
        opt.value = entry.key;
        opt.textContent = entry.name;
        typeFilter.appendChild(opt);
      });

      const allBookings = (await fetchWithAuth("/o/c/bookings?nestedFields=resourceBooking")).items;

      const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        headerToolbar: false,
        events: [],
        displayEventTime: true,
        dateClick(info) {
          const clicked = new Date(info.dateStr);
          if (clicked < today) return alert("❌ Can't book in the past");
          if (clicked > maxDate) return alert("❌ Too far in advance");
          alert(`✅ Open booking modal for: ${info.dateStr}`);
        },
      });

      calendar.render();

      const refreshCalendar = () => {
        const viewType = calendar.view.type;
        const selectedType = typeFilter.value.trim();
        const selectedResource = resourceFilter.value.trim();
        const from = fromDateEl.value ? new Date(fromDateEl.value) : null;
        const to = toDateEl.value ? new Date(toDateEl.value + "T23:59:59") : null;

        const filtered = allBookings
          .filter((b) => {
            const r = b.resourceBooking;
            if (!r) return false;

            const matchesType = !selectedType || r.type?.key === selectedType;
            const matchesResource = !selectedResource || r.id.toString() === selectedResource;
            const bookingStart = new Date(b.startDateTime);
            const bookingEnd = new Date(b.endDateTime);

            return (
              matchesType &&
              matchesResource &&
              (!from || bookingEnd >= from) &&
              (!to || bookingStart <= to)
            );
          })
          .map((b) => ({
            title: b.resourceBooking?.name || "Booking",
            start: b.startDateTime,
            end: b.endDateTime,
            allDay: viewType === "dayGridMonth",
            backgroundColor: typeColorMap[b.resourceBooking?.type?.key] || "#999",
            borderColor: "#000",
            textColor: "#fff",
          }));

        calendar.removeAllEvents();
        calendar.addEventSource(filtered);
      };

      refreshCalendar();

      typeFilter.addEventListener("change", () => {
        const selectedType = typeFilter.value.trim();
        resourceFilter.innerHTML = '<option value="">All</option>';
        if (!selectedType) {
          resourceLabel.classList.add("hidden");
        } else {
          const resourceSet = new Map();
          allBookings.forEach((b) => {
            const r = b.resourceBooking;
            if (r?.type?.key === selectedType) resourceSet.set(r.id, r.name);
          });
          resourceSet.forEach((name, id) => {
            const opt = document.createElement("option");
            opt.value = id;
            opt.textContent = name;
            resourceFilter.appendChild(opt);
          });
          resourceLabel.classList.remove("hidden");
        }
      });

      this.querySelector("#applyFilters").addEventListener("click", refreshCalendar);
      this.querySelectorAll(".view-btn").forEach((btn) =>
        btn.addEventListener("click", () => {
          calendar.changeView(btn.dataset.view);
          refreshCalendar();
        })
      );
    };

    document.body.appendChild(script);
  }
}

customElements.define("booking-calendar", BookingCalendar);
