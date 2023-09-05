const openPicker = document.querySelector('button#open-picker');

const CLIENT_ID = '718068923695-areq6bk2cvp10fgj436ed5aeqd951nf9.apps.googleusercontent.com';
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/photoslibrary',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata'
];
const API_KEY = 'AIzaSyBho2dfP43njvUCBn1dHriOtm61fF98h-s';

let tokenClient;
let accessToken = null;
let pickerInited = false;
let gisInited = false;

function onApiLoad() {
  gapi.load('picker', onPickerApiLoad);
  gapi.load('client', function () {
    gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"]
    });
  });
}

function onPickerApiLoad() {
  pickerInited = true;
}

function gisLoaded() {
  if (this.tokenValidate()) {
    return;
  }

  // TODO(developer): Replace with your client ID and required scopes.
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES.join(' '),
    callback: '', // defined later
  });
  gisInited = true;
}

// Create and render a Google Picker object for selecting from Drive.
function createPicker() {
  const showPicker = (callback) => {
    // TODO(developer): Replace with your API key
    const picker = new google.picker.PickerBuilder()
      .addView(google.picker.ViewId.DOCS)
      .setOAuthToken(accessToken)
      .setDeveloperKey(API_KEY)
      .setCallback(callback)
      .build();
    picker.setVisible(true);
  }

  return new Promise(
    (resolve, reject) => {
      if (this.tokenValidate()) {
        accessToken = localStorage.getItem('googleAccessToken');
        showPicker((data) => {
          const fileData = data[google.picker.Response.DOCUMENTS][0];

          resolve(fileData.id);
        });
      } else {
        // Request an access token.
        tokenClient.callback = async (response) => {
          if (response.error !== undefined) {
            reject(response);
          }

          accessToken = response.access_token;
          localStorage.setItem('googleAccessToken', response.access_token);
          showPicker((data) => {
            const fileData = data[google.picker.Response.DOCUMENTS][0];

            resolve(fileData.id);
          });
        };
      }
    }

    if (!this.tokenValidate()) {
      // Prompt the user to select a Google Account and ask for consent to share their data
      // when establishing a new session.
      tokenClient.requestAccessToken({prompt: 'consent'});
    }
  );
}

// A simple callback implementation.
function pickerCallback(data) {
  const fileData = data[google.picker.Response.DOCUMENTS][0];

  console.log(fileData);
  console.log(fileData.mimeType);
  console.log(fileData.id);

  gapi.client.drive.files.get({
    fileId: fileData.id,
    alt: 'media',
    supportsAllDrives: true,
  })
    .then((response) => {
      console.log('response >> ', response);
      return response.body;
    })
    // .then((response) => {
    //   const blob = new Blob([response], { type: fileData.mimeType });
      
    //   const link = document.createElement('a');
    //   link.href = window.URL.createObjectURL(blob);
    //   link.download = "test";
    //   link.click();
    // });
}

openPicker?.addEventListener('click', () => {
  createPicker();
})