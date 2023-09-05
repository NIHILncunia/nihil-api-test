const button = document.querySelector('button#zoom');

const clientId = 'fuouXxh_RBSRaVIRvEsHHQ';
const clientSecret = 'BI7V4iJrQvs6dLVlqpxaHyskXM0mfU33';
const redirectUri = 'http://localhost:5500/auth/zoom';

const base84Key = 'ZnVvdVh4aF9SQlNSYVZJUnZFc0hIUTpCSTdWNGlKclF2czZkTFZscXB4YUh5c2tYTTBtZlUzMw==';

button.addEventListener('click', () => {
  let url = 'https://zoom.us/oauth/authorize?';
  url += `response_type=code`;
  url += `&redirect_uri=${redirectUri}`;
  url += `&client_id=${clientId}`;

  console.log(url);

  const windowFeatures = "left=100,top=100,width=400,height=680";
  window.open(url, "mozillaWindow", windowFeatures);
});

window.addEventListener('message', (event) => {
  console.log(event.data);

  if (event.data.provider !== 'zoom') {
    return;
  }

  fetch('https://zoom.us/oauth/token', {
    method: 'POST',
    body: JSON.stringify({
      code: event.data.code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
    headers: {
      "Host": "zoom.us",
      "Authorization": `Basic ${base84Key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then((response) => {
    return response.json();
  }).then((data) => {
    console.log('tokenData >> ', data);
    return data;
  });
});