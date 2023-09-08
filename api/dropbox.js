const getUserInfoButton = document.querySelector('button#get-user-info');
const createFolderButton = document.querySelector('button#create-folder');

const fileInput = document.querySelector('input#pick');
const uploadFileButton = document.querySelector('button#upload-file');

const getFileInfoButton = document.querySelector('button#get-file-info');
const downloadFileButton = document.querySelector('button#download-file');
const updateFileButton = document.querySelector('button#update-file');

getUserInfoButton?.addEventListener('click', () => {
  dropbox.getUserInfo();
});

createFolderButton?.addEventListener('click', () => {
  dropbox.createFolder();
});

uploadFileButton?.addEventListener('click', () => {
  /** @type {File} */
  const file = fileInput.files[0];
  dropbox.uploadFile(file);
});

getFileInfoButton?.addEventListener('click', () => {
  dropbox.getFileInfo().then((response) => {
    console.log(response);
    
    if (response) {
      console.log(response.name);
    }
  });
});

downloadFileButton?.addEventListener('click', () => {
  dropbox.getFileInfo()
    .then((response) => {
      return {
        id: response.id,
        name: response.name,
      };
  }).then((response) => {
    return dropbox.downloadFile(response.id)
      .then((downloadResponse) => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(downloadResponse);
        link.download = response.name;
        link.click();
      });
  });
});

updateFileButton?.addEventListener('click', () => {
  /** @type {File} */
  const file = fileInput.files[0];
  dropbox.updateFile(file);
});