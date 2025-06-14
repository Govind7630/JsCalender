class BookingCalendar extends HTMLElement {
  connectedCallback() {
    const container = document.createElement('div');
    container.id = 'calendar';
    container.style.margin = '1rem';
    container.textContent = 'Calendar loading...';

    this.appendChild(container);

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.8/index.global.min.js';
    script.onload = () => {
      const calendar = new FullCalendar.Calendar(container, {
        initialView: 'dayGridMonth',
        events: [], // Replace with fetch if needed
      });
      calendar.render();
    };
    document.head.appendChild(script);
  }
}

customElements.define('booking-calendar', BookingCalendar);
