(function () {
  const calendarEl = document.createElement('div');
  calendarEl.id = 'calendar';
  calendarEl.style.margin = '1rem';
  document.body.appendChild(calendarEl);

  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.8/index.global.min.js';
  script.onload = () => {
    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'timeGridWeek',
      selectable: true,
      events: '/o/c/bookings',
      select: function (info) {
        const title = prompt('Enter Booking Title:');
        if (title) {
          fetch('/o/c/bookings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              bookingTitle: title,
              startTime: info.startStr,
              endTime: info.endStr,
              // Add more fields like resourceId if needed
            }),
          }).then(() => location.reload());
        }
      },
    });
    calendar.render();
  };

  document.head.appendChild(script);
})();
