const getChannelVidoesButton = document.querySelector('button#get-channel-vidoes');
const uploadVideo = document.querySelector('button#upload');
const fileInput = document.querySelector('input#file');
    
getChannelVidoesButton.addEventListener('click', async () => {
  const channelId = 'UCvc8kv-i5fvFTJBFAk6n1SA';

  let url = 'https://www.googleapis.com/youtube/v3/search';
  url += `?part=snippet`;
  url += `&channelId=${channelId}`;
  url += `&maxResults=50`;
  url += `&order=date`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('googleAccessToken')}`,
    }
  });

  const data = await response.json();

  console.log('list >> ', data);
});



uploadVideo.addEventListener('click', async (event) => {
  const url = `https://www.googleapis.com/upload/youtube/v3/videos?&part=snippet,status`;

  const file = fileInput.files[0];

  const metadata = {
    snippet: {
      title: '제목',
      description: '설명',
    },
    status: {
      privacyStatus: 'private',
    },
  };

  const formData = new FormData();

  formData.append('metadata', new Blob([metadata], { type: 'application/json' }));
  formData.append('file', file);

  fetch(url, {
    method: 'POST',
    body: formData,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('googleAccessToken')}`,
      origin: 'http://localhost:5500',
    },
  }).then((response) => {
    return response.json();
  }).then((data) => {
    console.log(data);
    return data;
  });
});