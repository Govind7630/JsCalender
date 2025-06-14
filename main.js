class BookingCalendar extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `<div id="calendar"></div>`;

    // Load FullCalendar CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.17/index.global.min.css';
    document.head.appendChild(link);

    // Load FullCalendar JS
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.17/index.global.min.js';
    script.onload = () => {
      const calendar = new FullCalendar.Calendar(this.querySelector('#calendar'), {
        initialView: 'dayGridMonth',
        selectable: false,

        // Fetch and display bookings
        events: async function(fetchInfo, successCallback, failureCallback) {
          try {
            const res = await fetch('http://localhost:8080/o/c/bookings', {
              headers: {
                'Authorization': 'Basic ' + btoa('test@liferay.com:test'),
                'Content-Type': 'application/json'
              }
            });

            const data = await res.json();

            const events = data.items
              .filter(item => item.status === 'APPROVED') // Optional: only show approved bookings
              .map(item => ({
                title: item.purpose || 'No Title',
                start: item.startDateTime,
                end: item.endDateTime,
                extendedProps: {
                  resource: item.resourceRelationship
                }
              }));

            successCallback(events);
          } catch (err) {
            console.error("Failed to fetch bookings:", err);
            failureCallback(err);
          }
        }
      });

      calendar.render();
    };

    document.body.appendChild(script);
  }
}

customElements.define('booking-calendar', BookingCalendar);
