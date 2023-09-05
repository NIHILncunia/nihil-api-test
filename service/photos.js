const getAllPhotos = document.querySelector('button#get-all-photos');
const getNextPhotos = document.querySelector('button#next-photos');
const createAlbum = document.querySelector('button#crate-album');
const getAlbums = document.querySelector('button#get-albums');
const uploadPhotoImage = document.querySelector('button#upload-photo-image');

const fileInput = document.querySelector('input#file');

function getPhotos(nextPage = null) {
  let url = 'https://photoslibrary.googleapis.com/v1/mediaItems';
  url += `?pageSize=25`;

  if (nextPage) {
    url += `&pageToken=${nextPage}`;
  }

  fetch(url, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('googleAccessToken')}`,
    }
  }).then((response) => {
    return response.json();
  }).then((data) => {
    console.log(data);
    console.log(data.nextPageToken);
    localStorage.setItem('nextPageToken', data.nextPageToken);
    return data;
  }).catch(console.error);
}

getAllPhotos.addEventListener('click', () => {
  getPhotos();
});

getNextPhotos?.addEventListener('click', () => {
  const nextPage = localStorage.getItem('nextPageToken');
  getPhotos(nextPage);
});

createAlbum?.addEventListener('click', () => {
  const url = 'https://photoslibrary.googleapis.com/v1/albums';
  const title = '그냥제목';

  fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      album: {
        title,
      },
    }),
    headers: {
      Authorization: `Bearer ${localStorage.getItem('googleAccessToken')}`,
    },
  }).then((response) => {
    return response.json();
  }).then((data) => {
    console.log('생성 결과 >> ', data);
  });
});

getAlbums?.addEventListener('click', () => {
  let url = 'https://photoslibrary.googleapis.com/v1/albums';
  url += `?pageSize=50`;

  fetch(url, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('googleAccessToken')}`,
    },
  }).then((response) => {
    return response.json();
  }).then((data) => {
    console.log('앨범 리스트 >> ', data);
  });
});

uploadPhotoImage?.addEventListener('click', () => {
  const step1 = 'https://photoslibrary.googleapis.com/v1/uploads';
  const step2 = 'https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate';

  const albumId = 'AJCvZPSqDQ_l0Gg-L5PxsXQaEksLvTvFTWAQzyCziEs0dHeQEsBRiD4u0qOZ40px_QX6rjjwJUVl';

  const file = fileInput.files[0];

  fetch(step1, {
    method: 'POST',
    body: file,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('googleAccessToken')}`,
      'Content-type': 'application/octet-stream',
      'X-Goog-Upload-Content-Type': file.type,
      'X-Goog-Upload-Protocol': 'raw',
    },
  }).then((response) => {
    return response.text();
  }).then((data) => {
    return fetch(step2, {
      method: 'POST',
      body: JSON.stringify({
        albumId,
        newMediaItems: [{
          simpleMediaItem: {
            fileName: file.name,
            uploadToken: data,
          },
        }],
      }),
      headers: {
        Authorization: `Bearer ${localStorage.getItem('googleAccessToken')}`,
      }
    }).then((response) => {
      return response.json();
    }).then((data) => {
      console.log('data >> ', data);
      return data;
    });
  });
});