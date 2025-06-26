class BookingCalendar extends HTMLElement {
  constructor() {
    super();
    this.token = null;
    this.allBookings = [];
    this.calendar = null;
    this.elements = {};
  }

  async getAccessToken() {
    try {
      // TODO: Move this to backend endpoint that handles auth securely
      const response = await fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Auth failed: ${response.status}`);
      }
      
      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Authentication failed:', error);
      this.showError('Failed to authenticate. Please try again.');
      return null;
    }
  }

  async fetchWithAuth(url) {
    try {
      if (!this.token) {
        this.token = await this.getAccessToken();
        if (!this.token) return null;
      }

      const response = await fetch(url, {
        headers: { "Authorization": `Bearer ${this.token}` }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          this.token = await this.getAccessToken();
          if (this.token) {
            const retryResponse = await fetch(url, {
              headers: { "Authorization": `Bearer ${this.token}` }
            });
            return retryResponse.ok ? retryResponse.json() : null;
          }
        }
        throw new Error(`API request failed: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      this.showError('Failed to load data. Please refresh the page.');
      return null;
    }
  }

  showError(message) {
    const errorDiv = this.querySelector('#errorMessage') || document.createElement('div');
    errorDiv.id = 'errorMessage';
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      background: #fee; 
      color: #c33; 
      padding: 1rem; 
      border-radius: 5px; 
      margin-bottom: 1rem;
      border: 1px solid #fcc;
    `;
    this.insertBefore(errorDiv, this.firstChild);
  }

  hideError() {
    const errorDiv = this.querySelector('#errorMessage');
    if (errorDiv) errorDiv.remove();
  }

  async loadExternalResources() {
    return new Promise((resolve, reject) => {
      // Check if FullCalendar is already loaded
      if (window.FullCalendar) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.17/index.global.min.css';
      
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.17/index.global.min.js';
      
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load FullCalendar'));
      
      document.head.appendChild(link);
      document.body.appendChild(script);
    });
  }

  connectedCallback() {
    this.render();
    this.init();
  }

  render() {
    this.innerHTML = `
      <style>
        .booking-calendar {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .filter-bar {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }
        .filter-bar label {
          font-weight: 500;
          font-size: 0.9rem;
          color: #495057;
        }
        .filter-bar select, .filter-bar input {
          padding: 6px 12px;
          border-radius: 4px;
          border: 1px solid #ced4da;
          margin-left: 0.5rem;
          font-size: 0.9rem;
        }
        .filter-bar select:focus, .filter-bar input:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
        }
        .filter-bar button {
          padding: 6px 16px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: background-color 0.2s;
        }
        .filter-bar button:hover {
          background-color: #0056b3;
        }
        .filter-bar button:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
        }
        #calendar {
          background: white;
          border-radius: 8px;
          padding: 1rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border: 1px solid #e9ecef;
        }
        .fc-disabled-day {
          background-color: #f8f9fa !important;
          pointer-events: none;
          color: #6c757d !important;
          cursor: not-allowed;
        }
        .fc-disabled-day .fc-daygrid-day-number {
          opacity: 0.5 !important;
        }
        .loading {
          text-align: center;
          padding: 2rem;
          color: #6c757d;
        }
        .error-message {
          margin-bottom: 1rem;
        }
      </style>

      <div class="booking-calendar">
        <div class="filter-bar">
          <label>Type:
            <select id="typeFilter">
              <option value="">All Types</option>
            </select>
          </label>

          <label id="resourceLabel" style="display:none;">Resource:
            <select id="resourceFilter">
              <option value="">All Resources</option>
            </select>
          </label>

          <label>From:
            <input type="date" id="fromDate" />
          </label>

          <label>To:
            <input type="date" id="toDate" />
          </label>

          <button id="applyFilters">Apply Filters</button>
        </div>

        <div id="calendar">
          <div class="loading">Loading calendar...</div>
        </div>
      </div>
    `;

    // Cache DOM elements
    this.elements = {
      calendar: this.querySelector('#calendar'),
      typeFilter: this.querySelector('#typeFilter'),
      resourceFilter: this.querySelector('#resourceFilter'),
      resourceLabel: this.querySelector('#resourceLabel'),
      fromDate: this.querySelector('#fromDate'),
      toDate: this.querySelector('#toDate'),
      applyButton: this.querySelector('#applyFilters')
    };
  }

  async init() {
    try {
      this.hideError();
      
      // Load external resources
      await this.loadExternalResources();
      
      // Get authentication token
      this.token = await this.getAccessToken();
      if (!this.token) return;

      // Initialize date constraints
      await this.initializeDateConstraints();
      
      // Load initial data
      await Promise.all([
        this.loadResourceTypes(),
        this.loadBookings()
      ]);

      // Initialize calendar
      this.initializeCalendar();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Initial render
      this.refreshCalendar();

    } catch (error) {
      console.error('Calendar initialization failed:', error);
      this.showError('Failed to initialize calendar. Please refresh the page.');
    }
  }

  async initializeDateConstraints() {
    const settingData = await this.fetchWithAuth('/o/c/booking-setting/resourcetype');
    if (!settingData) return;

    let maxAdvance = 30; // Default fallback
    settingData.items?.forEach(item => {
      if (item.MaxAdvanceBookingTime > maxAdvance) {
        maxAdvance = item.MaxAdvanceBookingTime;
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + maxAdvance);
    const maxDateStr = maxDate.toISOString().split('T')[0];

    // Set date input constraints
    this.elements.fromDate.value = todayStr;
    this.elements.fromDate.min = todayStr;
    this.elements.fromDate.max = maxDateStr;
    this.elements.toDate.min = todayStr;
    this.elements.toDate.max = maxDateStr;

    // Store for calendar use
    this.dateConstraints = { today, maxDate, todayStr, maxDateStr };
  }

  async loadResourceTypes() {
    const picklistERC = "4313e15a-7721-b76a-6eb6-296d0c6d86b2";
    const picklistData = await this.fetchWithAuth(
      `/o/headless-admin-list-type/v1.0/list-type-definitions/by-external-reference-code/${picklistERC}/list-type-entries`
    );
    
    if (!picklistData) return;

    const typeMap = new Map();
    picklistData.items?.forEach(entry => {
      if (!typeMap.has(entry.key)) {
        typeMap.set(entry.key, entry.name);
        const option = document.createElement('option');
        option.value = entry.key;
        option.textContent = entry.name;
        this.elements.typeFilter.appendChild(option);
      }
    });

    this.typeMap = typeMap;
  }

  async loadBookings() {
    const bookingsData = await this.fetchWithAuth('/o/c/bookings?nestedFields=resourceBooking');
    this.allBookings = bookingsData?.items || [];
  }

  initializeCalendar() {
    if (!this.dateConstraints) return;

    const { todayStr, maxDateStr, today, maxDate } = this.dateConstraints;

    this.calendar = new FullCalendar.Calendar(this.elements.calendar, {
      initialView: 'dayGridMonth',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,listWeek'
      },
      displayEventTime: true,
      events: [],
      validRange: {
        start: todayStr,
        end: maxDateStr
      },
      dayCellDidMount: (info) => {
        const date = new Date(info.date);
        date.setHours(0, 0, 0, 0);
        const isDisabled = date < today || date > maxDate;

        if (isDisabled) {
          info.el.classList.add('fc-disabled-day');
        }
      },
      dateClick: (info) => {
        const clickedDate = new Date(info.dateStr);
        clickedDate.setHours(0, 0, 0, 0);
        if (clickedDate >= today && clickedDate <= maxDate) {
          this.handleDateClick(info.dateStr);
        }
      },
      eventClick: (info) => {
        this.handleEventClick(info.event);
      }
    });

    this.calendar.render();
  }

  setupEventListeners() {
    this.elements.typeFilter.addEventListener('change', () => {
      this.updateResourceFilter();
    });

    this.elements.applyButton.addEventListener('click', () => {
      this.refreshCalendar();
    });

    // Auto-apply filters on date change
    [this.elements.fromDate, this.elements.toDate].forEach(input => {
      input.addEventListener('change', () => {
        this.refreshCalendar();
      });
    });
  }

  updateResourceFilter() {
    const selectedType = this.elements.typeFilter.value.trim();
    this.elements.resourceFilter.innerHTML = '<option value="">All Resources</option>';
    
    if (!selectedType) {
      this.elements.resourceLabel.style.display = 'none';
      return;
    }

    const resourceSet = new Map();
    this.allBookings.forEach(booking => {
      const resource = booking.resourceBooking;
      if (resource?.type?.key === selectedType) {
        resourceSet.set(resource.id, resource.name);
      }
    });

    if (resourceSet.size > 0) {
      resourceSet.forEach((name, id) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = name;
        this.elements.resourceFilter.appendChild(option);
      });
      this.elements.resourceLabel.style.display = 'inline-block';
    } else {
      this.elements.resourceLabel.style.display = 'none';
    }
  }

  refreshCalendar() {
    if (!this.calendar) return;

    const selectedType = this.elements.typeFilter.value.trim();
    const selectedResource = this.elements.resourceFilter.value.trim();
    const fromDate = this.elements.fromDate.value;
    const toDate = this.elements.toDate.value;

    const filteredBookings = this.allBookings.filter(booking => {
      const resource = booking.resourceBooking;
      if (!resource) return false;

      // Type filter
      if (selectedType && resource.type?.key?.trim() !== selectedType) {
        return false;
      }

      // Resource filter
      if (selectedResource && resource.id?.toString() !== selectedResource) {
        return false;
      }

      // Date range filter
      const start = new Date(booking.startDateTime);
      const end = new Date(booking.endDateTime);
      
      if (fromDate) {
        const from = new Date(fromDate + 'T00:00:00');
        if (start < from) return false;
      }
      
      if (toDate) {
        const to = new Date(toDate + 'T23:59:59');
        if (end > to) return false;
      }

      return true;
    });

    const events = filteredBookings.map(booking => ({
      id: booking.id,
      title: booking.resourceBooking?.name || 'Booking',
      start: booking.startDateTime,
      end: booking.endDateTime,
      extendedProps: {
        booking: booking
      }
    }));

    this.calendar.removeAllEvents();
    this.calendar.addEventSource(events);
  }

  handleDateClick(dateStr) {
    // TODO: Replace with actual modal implementation
    console.log('Date clicked:', dateStr);
    alert(`Open booking modal for date: ${dateStr}`);
  }

  handleEventClick(event) {
    // TODO: Replace with actual event details modal
    const booking = event.extendedProps.booking;
    console.log('Event clicked:', booking);
    alert(`Booking Details:\nResource: ${booking.resourceBooking?.name}\nStart: ${event.start}\nEnd: ${event.end}`);
  }

  // Public methods for external interaction
  getSelectedBookings() {
    return this.calendar ? this.calendar.getEvents() : [];
  }

  refreshData() {
    this.init();
  }
}

customElements.define('booking-calendar', BookingCalendar);
