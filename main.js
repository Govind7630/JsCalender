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
        selectable: true,
        dateClick(info) {
          alert("Clicked on: " + info.dateStr);
        },
      });

      calendar.render();
    };
    document.body.appendChild(script);
  }
}

customElements.define('booking-calendar', BookingCalendar);
