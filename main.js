class BookingCalendar extends HTMLElement {
  formatTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

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
        displayEventTime: false, // <-- remove that repeated time on calendar
        selectable: false,

        events: async (fetchInfo, successCallback, failureCallback) => {
          try {
            const res = await fetch('/o/c/bookings?nestedFields=r_resourceRelationship_c_resource');
            const data = await res.json();

            const events = data.items.map(item => {
              const start = this.formatTime(item.startTime);
              const end = this.formatTime(item.endTime);
              const resource = item.r_resourceRelationship_c_resource?.name || 'Unknown';

              return {
                title: `${start} → ${end}<br>${resource}`, // use <br> instead of \n
                start: item.startTime,
                end: item.endTime
              };
            });

            successCallback(events);
          } catch (err) {
            console.error('Fetching events failed', err);
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
