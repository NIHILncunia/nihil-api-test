const getMyInfoButton = document.querySelector('button#get-my-info');
// const getFeedButton = document.querySelector('button#get-feed');
const pageNameInput = document.querySelector('input#page-name');
const getAccountDataButton = document.querySelector('button#get-accounts-data');
const fileInput = document.querySelector('input#file-input');
const uploadvideoButton = document.querySelector('button#upload-vieod');

getMyInfoButton?.addEventListener('click', () => {
  facebook.getFacebookInfo();
});

// getFeedButton?.addEventListener('click', () => {
//   facebook.getFacebookInfo().then((user) => {
//     return facebook.getFacebookFeed(user.id);
//   });
// })

uploadvideoButton?.addEventListener('click', () => {
  const file = fileInput.files[0];

  facebook.uploadVideo(file);
});

getAccountDataButton?.addEventListener('click', () => {
  const pageName = pageNameInput.value;
  facebook.getAccountData().then((response) => {
    const pageId = response.data.find((item) => item.name === pageName).id;
    console.log(pageId);
  });
});