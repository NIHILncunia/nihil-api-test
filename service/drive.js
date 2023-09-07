const getDriveInfo = document.querySelector('button#get-drive-info');

const getTopLevelFolders = document.querySelector('button#get-top-level-folders');
const getFilesInFolder = document.querySelector('button#get-files-in-folder');
const createFolder = document.querySelector('button#create-folder');
const getFileInfo = document.querySelector('button#get-file-info');
const downloadFile = document.querySelector('button#download-file');

const uploadFile = document.querySelector('button#upload-file');
const fileInput = document.querySelector('input#file');
const updateFileInput = document.querySelector('input#update-file-input');
const updateFile = document.querySelector('button#update-file');

getDriveInfo.addEventListener('click', () => {
  googleApi.getDriveInfo();
});

getTopLevelFolders.addEventListener('click', () => {
  googleApi.getTopLevelFolders();
});

getFilesInFolder.addEventListener('click', () => {
  googleApi.createPicker()
    .then((response) => {
      return googleApi.getFilesInFolder(response.fileId);
    });
});

getFileInfo?.addEventListener('click', () => {
  googleApi.createPicker();
});

createFolder?.addEventListener('click', () => {
  const folderName = prompt('폴더 이름을 입력하세요.');
  googleApi.createFolder(folderName);
});

uploadFile.addEventListener('click', () => {
  const file = fileInput.files[0];

  const foldersResponse = googleApi.getTopLevelFolders();
  googleApi.getTopLevelFolders().then((foldersResponse) => {
    const folder = foldersResponse.files.find((item) => item.name === 'myapps');

    const metadata = {
      name: `${Date.now()}-${file.name}`,
      mimeType: file.type,
      parents: [folder.id],
    };

    return googleApi.uploadToDrive(metadata, file);
  });
});

updateFile.addEventListener('click', () => {
  const file = updateFileInput.files[0];

  googleApi.createPicker().then((fileInfo) => {
    const metadata = {};

    googleApi.syncAppToDrive(fileInfo.fileId, metadata, file);
  });
});

downloadFile?.addEventListener('click', () => {
  googleApi.createPicker().then((fileInfo) => {
    return googleApi.downloadFile(fileInfo.fileId).then((response) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(response);
      link.download = fileInfo.name;
      link.click();
    });
  });
});