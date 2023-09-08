const allCalendarSelect = document.querySelector('select#all-calendar');
const getCalendarByIdButton = document.querySelector('button#get-calendar-by-id');
const getCalendarEventsButton = document.querySelector('button#get-calendar-events');

window.addEventListener('DOMContentLoaded', () => {
  googleApi.getAllCalendar()
    .then((response) => {
      const items = [...response.items];

      items.forEach((item) => {
        const opt = document.createElement('option');
        opt.textContent = item.summary;
        opt.value = item.id;

        allCalendarSelect?.appendChild(opt);
      });
    });
});

getCalendarByIdButton?.addEventListener('click', () => {
  const { value: calendarId } = allCalendarSelect;
  googleApi.getCalendarById(calendarId);
});

getCalendarEventsButton?.addEventListener('click', () => {
  const { value: calendarId } = allCalendarSelect;
  googleApi.getCalendarEvents(calendarId);
});