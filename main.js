class BookingCalendar extends HTMLElement {
  connectedCallback() {
    // Inject HTML structure
    this.innerHTML = `<div id="calendar"></div>`;

    // Add FullCalendar CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.17/index.global.min.css';
    document.head.appendChild(link);

    // Add FullCalendar JS
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.17/index.global.min.js';
    script.onload = () => {
      const calendarEl = this.querySelector('#calendar');
      const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        selectable: true,
        dateClick: function(info) {
          alert('Clicked on: ' + info.dateStr);
        }
      });
      calendar.render();
    };
    document.body.appendChild(script);
  }
}

customElements.define('booking-calendar', BookingCalendar);
