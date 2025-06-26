<!-- Tailwind CSS -->
<link href="https://cdn.jsdelivr.net/npm/tailwindcss@3.3.2/dist/tailwind.min.css" rel="stylesheet">

<!-- FullCalendar Styles & Scripts -->
<link href="https://cdn.jsdelivr.net/npm/fullcalendar@6.1.17/index.global.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/fullcalendar@6.1.17/index.global.min.js"></script>

<div class="p-4 bg-gray-50 rounded-xl shadow-lg">
  <!-- Header with View Toggle -->
  <div class="flex justify-between items-center mb-4">
    <h2 class="text-2xl font-bold text-gray-800">Booking Calendar</h2>
    <div class="space-x-2">
      <button data-view="dayGridMonth" class="view-btn bg-blue-500 text-white px-3 py-1 rounded-md text-sm">Month</button>
      <button data-view="timeGridWeek" class="view-btn bg-gray-200 text-gray-800 px-3 py-1 rounded-md text-sm">Week</button>
      <button data-view="timeGridDay" class="view-btn bg-gray-200 text-gray-800 px-3 py-1 rounded-md text-sm">Day</button>
    </div>
  </div>

  <!-- Calendar -->
  <div id="calendar"></div>
</div>

<script>
(async () => {
  // Token
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", "id-dec3219b-34b3-7491-8698-40193ec681e7");
  params.append("client_secret", "secret-abfba0a2-3f8f-6d56-408e-f98f6a71691e");

  const tokenRes = await fetch("/o/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  });

  const token = (await tokenRes.json()).access_token;
  const fetchWithAuth = async (url) => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    return res.json();
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const settings = await fetchWithAuth("/o/c/booking-setting/resourcetype");
  const maxAdvanceDays = Math.max(...settings.items.map(i => i.MaxAdvanceBookingTime || 0));

  const maxAllowedDate = new Date(today);
  maxAllowedDate.setDate(today.getDate() + maxAdvanceDays);

  const bookings = (await fetchWithAuth("/o/c/bookings?nestedFields=resourceBooking")).items;

  // Generate color map by type.key
  const colorMap = {};
  let colorIndex = 0;
  const colors = ["#4f46e5", "#16a34a", "#dc2626", "#7c3aed", "#f59e0b", "#0ea5e9", "#d946ef"];

  bookings.forEach(b => {
    const key = b.resourceBooking?.type?.key;
    if (key && !colorMap[key]) {
      colorMap[key] = colors[colorIndex % colors.length];
      colorIndex++;
    }
  });

  const events = bookings.map(b => {
    const r = b.resourceBooking;
    const typeKey = r?.type?.key;
    return {
      title: r?.name || "Booking",
      start: b.startDateTime,
      end: b.endDateTime,
      backgroundColor: colorMap[typeKey] || "#64748b", // fallback gray
      borderColor: "transparent"
    };
  });

  const calendar = new FullCalendar.Calendar(document.getElementById("calendar"), {
    initialView: "dayGridMonth",
    height: "auto",
    selectable: true,
    headerToolbar: false,
    events: events,
    eventDisplay: "block",
    dayMaxEventRows: 3,
    dateClick: (info) => {
      const date = new Date(info.dateStr);
      date.setHours(0, 0, 0, 0);

      if (date < today) {
        alert("❌ You can’t book in the past.");
      } else if (date > maxAllowedDate) {
        alert("❌ You can’t book beyond the allowed range.");
      } else {
        alert(`✅ Booking modal would open for: ${info.dateStr}`);
      }
    }
  });

  calendar.render();

  // View switch handlers
  document.querySelectorAll(".view-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".view-btn").forEach(b => b.classList.remove("bg-blue-500", "text-white"));
      btn.classList.add("bg-blue-500", "text-white");
      calendar.changeView(btn.dataset.view);
    });
  });
})();
</script>
