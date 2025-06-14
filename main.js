function formatTime(dateTimeString) {
  const date = new Date(dateTimeString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

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
              title: '', // leave empty, we’ll use eventContent instead
              start: item.startTime,
              end: item.endTime,
              extendedProps: {
                startTime: formatTime(item.startTime),
                endTime: formatTime(item.endTime),
                resource: item.resourceRelationship?.name || 'Unknown'
              }
            }));

            successCallback(events);
          } catch (err) {
            console.error("Fetching events failed", err);
            failureCallback(err);
          }
        },

        eventContent: function(arg) {
          const start = arg.event.extendedProps.startTime;
          const end = arg.event.extendedProps.endTime;
          const resource = arg.event.extendedProps.resource;

          return {
            html: `
              <div style="white-space: normal;">
                <strong>${start} → ${end}</strong><br/>
                <span style="font-size: 0.85em;">Resource: ${resource}</span>
              </div>
            `
          };
        }
      });

      calendar.render();
    };

    document.body.appendChild(script);
  }
}

customElements.define('booking-calendar', BookingCalendar);
