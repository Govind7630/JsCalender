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
        events: async function(fetchInfo, successCallback, failureCallback) {
  try {
    const res = await fetch(
      'http://localhost:8080/o/c/bookings', // Replace with your object name
      {
        headers: {
          'Authorization': 'Basic ' + btoa('test@liferay.com:test'), // or use OAuth/token
          'Content-Type': 'application/json'
        }
      }
    );
    const data = await res.json();
    const events = data.items.map(item => ({
      title: item.title,
      start: item.startDateTime,
      end: item.endDateTime
    }));
    successCallback(events);
  } catch (err) {
    failureCallback(err);
  }
},
        dateClick: function(info) {
  const title = prompt('Enter booking title:');
  if (title) {
    fetch('http://localhost:8080/o/c/bookings', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa('test@liferay.com:test'),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: title,
        startDateTime: info.dateStr,
        endDateTime: info.dateStr // or add +1hr logic
      })
    })
    .then(res => res.json())
    .then(data => {
      calendar.refetchEvents(); // Reload events
      alert('Booking added!');
    });
  }
}
      });

      calendar.render();
    };
    document.body.appendChild(script);
  }
}

customElements.define('booking-calendar', BookingCalendar);
