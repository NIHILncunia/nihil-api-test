const allCalendarSelect = document.querySelector('select#all-calendar');

window.addEventListener('load', () => {
  googleApi.getAllCalendar()
    .then((response) => {
      console.log(response);
    });
});