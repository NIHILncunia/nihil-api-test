const getDriveInfo = document.querySelector('button#get-drive-info');
const getDrives = document.querySelector('button#get-drives');
const getTopLevelFolders = document.querySelector('button#get-top-level-folders');
const getFilesInFolder = document.querySelector('button#get-files-in-folder');
const uploadFile = document.querySelector('button#upload-file');
const fileInput = document.querySelector('input#file');
const updateFileInput = document.querySelector('input#update-file-input');
const updateFile = document.querySelector('button#update-file');

getDriveInfo.addEventListener('click', () => {
  const url = 'https://www.googleapis.com/drive/v3/about?fields=*';

  fetch(url, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('googleAccessToken')}`,
    }
  }).then((response) => {
    return response.json();
  }).then((data) => {
    console.log(data);
  });
});

getDrives.addEventListener('click', () => {
  const url = `https://www.googleapis.com/drive/v3/drives`;

  fetch(url, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('googleAccessToken')}`,
    }
  }).then((response) => {
    return response.json();
  }).then((data) => {
    console.log(data);
  });
});

getTopLevelFolders.addEventListener('click', () => {
  const url = `https://www.googleapis.com/drive/v3/files?corpora=user&q=mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false&orderBy=name&includeItemsFromAllDrives=false&pageSize=50&fields=*`;

  fetch(url, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('googleAccessToken')}`,
    }
  }).then((response) => {
    return response.json();
  }).then((data) => {
    console.log(data);
  });
});

getFilesInFolder.addEventListener('click', () => {
  const url = `https://www.googleapis.com/drive/v3/files?corpora=user&q='1ouV6zqSLHphG3sZkTRzIngwGE_IyIvwv' in parents and trashed=false&orderBy=name&includeItemsFromAllDrives=false&pageSize=50&fields=*`;

  fetch(url, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('googleAccessToken')}`,
    }
  }).then((response) => {
    return response.json();
  }).then((data) => {
    console.log(data);
  });
});

uploadFile.addEventListener('click', () => {
  const url = `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=*`;

  const file = fileInput.files[0];

  const metadata = {
    name: `${Date.now()}-${file.name}`,
    mimeType: file.type,
    parents: ['1ouV6zqSLHphG3sZkTRzIngwGE_IyIvwv'],
  };
  
  const formData = new FormData();

  formData.append('metadata', new Blob(
    [JSON.stringify(metadata)],
    { type: 'application/json' }
  ));
  formData.append('file', file);

  console.log(formData);

  fetch(url, {
    method: 'POST',
    headers: new Headers({
      Authorization: `Bearer ${localStorage.getItem('googleAccessToken')}`,
    }),
    body: formData,
  }).then((response) => {
    return response.json();
  }).then((data) => {
    console.log(data);
  }).catch((error) => {
    console.error(error);
  });
});

updateFile.addEventListener('click', () => {
  createPicker((data) => {
    console.log(resolve);
  }).then((response) => {
    console.log(response);
  });

  // const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart&fields=*`;

  // const file = updateFileInput.files[0];

  // const metadata = {
  //   name: `${Date.now()}-${file.name}`,
  //   mimeType: file.type,
  //   parents: ['1ouV6zqSLHphG3sZkTRzIngwGE_IyIvwv'],
  // };
  
  // const formData = new FormData();

  // formData.append('metadata', new Blob(
  //   [JSON.stringify(metadata)],
  //   { type: 'application/json' }
  // ));
  // formData.append('file', file);

  // console.log(formData);

  // fetch(url, {
  //   method: 'PTACH',
  //   headers: new Headers({
  //     Authorization: `Bearer ${localStorage.getItem('googleAccessToken')}`,
  //   }),
  //   body: formData,
  // }).then((response) => {
  //   return response.json();
  // }).then((data) => {
  //   console.log(data);
  // }).catch((error) => {
  //   console.error(error);
  // });
});