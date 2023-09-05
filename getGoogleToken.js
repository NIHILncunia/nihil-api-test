const googleButton = document.querySelector('button#google');

const CLIENT_ID = '718068923695-areq6bk2cvp10fgj436ed5aeqd951nf9.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost:5500/auth/token';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/photoslibrary',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata'
];

googleButton.addEventListener('click', () => {
  let url = 'https://accounts.google.com/o/oauth2/auth';
  url += `?client_id=${CLIENT_ID}`;
  url += `&scope=${SCOPES.join(' ')}`;
  url += `&access_type=offline`;
  url += `&include_granted_scopes=true`;
  url += `&response_type=code`;
  url += `&redirect_uri=${REDIRECT_URI}`;

  const windowFeatures = "left=100,top=100,width=400,height=680";
  window.open(url, "mozillaWindow", windowFeatures);
});

window.addEventListener('message', (event) => {
  if (event.data.provider !== 'google') {
    return;
  }

  fetch(`https://accounts.google.com/o/oauth2/token`, {
    method: 'POST',
    body: JSON.stringify({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: event.data.code,
    }),
  })
    .then((response) => response.json())
    .then((result) => {

      let url = 'https://oauth2.googleapis.com/tokeninfo';
      url += `?access_token=${result.access_token}`;

      fetch(url).then((tokenInfo) => {
        return tokenInfo.json();
      }).then((data) => {
        localStorage.setItem('tokenExp', new Date(parseInt(data.exp, 10) * 1000));
      });

      localStorage.setItem('googleAccessToken', result.access_token);
      return result.access_token;
    });
});