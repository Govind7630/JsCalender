class BookingCalendar extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `<div id="calendar"></div>`;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.17/index.global.min.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.17/index.global.min.js';
    script.onload = () => {
      const calendar = new FullCalendar.Calendar(this.querySelector('#calendar'), {
        initialView: 'dayGridMonth',
        selectable: false,

        events: async function (fetchInfo, successCallback, failureCallback) {
          try {
            const res = await fetch('/o/c/bookings');
            const data = await res.json();

            const events = data.items.map(item => ({
              title: item.purpose || 'No Title',
              start: item.startTime,
              end: item.endTime
            }));

            successCallback(events);
          } catch (err) {
            console.error("Fetching events failed", err);
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
