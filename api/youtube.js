const getChannelVidoesButton = document.querySelector('button#get-channel-vidoes');
const uploadVideo = document.querySelector('button#upload');
const fileInput = document.querySelector('input#file');

getChannelVidoesButton.addEventListener('click', () => {
  const channelId = 'UCvc8kv-i5fvFTJBFAk6n1SA';

  googleApi.getVideosByChannelId(channelId);
});



uploadVideo.addEventListener('click', async (event) => {
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

  googleApi.uploadVideo(file, metadata);
});