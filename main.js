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
        displayEventTime: false, // disables default time display

        events: async (fetchInfo, successCallback, failureCallback) => {
          try {
            const res = await fetch('/o/c/bookings?nestedFields=r_resourceRelationship_c_resource');
            const data = await res.json();

            const events = data.items.map(item => {
              const start = this.formatTime(item.startTime);
              const end = this.formatTime(item.endTime);
              const resource = item.r_resourceRelationship_c_resource?.name || 'Unknown';

              return {
                title: '', // leave empty, we use eventContent
                start: item.startTime,
                end: item.endTime,
                extendedProps: {
                  start,
                  end,
                  resource
                }
              };
            });

            successCallback(events);
          } catch (err) {
            console.error('Fetching events failed', err);
            failureCallback(err);
          }
        },

        eventContent: function(arg) {
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
    };

    document.body.appendChild(script);
  }
}

customElements.define('booking-calendar', BookingCalendar);
