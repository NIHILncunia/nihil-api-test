class DropboxAPI {
  constructor() {
    this.resolve;
    this.accessToken = localStorage.getItem('dropBoxAccessToken') || null;
    this.tokenExp = localStorage.getItem('dropboxExp') || null;
    this.messageHandler = this.getMessage.bind(this);
    this.selectFile = null;

    this.options = {
      auth: {
        apiKey: 'boix6yfh386kdi8',
        apiSecret: 'mu7vkks46057bao',
        redirectUri: 'http://localhost:5500/auth/token',
        scope: [
          "account_info.write",
          "account_info.read",
          "files.metadata.write",
          "files.metadata.read",
          "files.content.write",
          "files.content.read",
          "sharing.write",
          "sharing.read",
          "file_requests.write",
          "file_requests.read",
          "contacts.write",
          "contacts.read",
        ],
      },
    };

    this.createScript();
  }

  getAuthCode() {
    let url = 'https://www.dropbox.com/oauth2/authorize';
    url += `?client_id=${this.options.auth.apiKey}`;
    url += `&state=${encodeURIComponent(location.href)}`;
    url += `&token_access_type=offline`;
    url += `&response_type=code`;
    url += `&redirect_uri=${this.options.auth.redirectUri}`;

    const windowFeatures = "left=100,top=100,width=400,height=680";
    window.open(url, "mozillaWindow", windowFeatures);

    window.addEventListener('message', this.messageHandler, false);
  }

  /** @param {MessageEvent} event */
  getMessage(event) {
    this.resolve(event.data.code);
    window.removeEventListener('message', this.messageHandler, false);
  }

  /** @param {string} code */
  getToken(code) {
    let url = `https://api.dropboxapi.com/oauth2/token`;
    url += `?client_id=${this.options.auth.apiKey}`;
    url += `&redirect_uri=${this.options.auth.redirectUri}`;
    url += `&client_secret=${this.options.auth.apiSecret}`;
    url += `&grant_type=authorization_code`;
    url += `&code=${code}`;

    return axios.post(url, {}, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
    }).then((response) => {
      console.log('getToken >> ', response.data);
      return response.data;
    });
  }

  getAccessToken() {
    this.getAuthCode();

    return new Promise((resolve, reject) => {
      this.resolve = resolve;
    }).then((code) => this.getToken(code).then((response) => {
      localStorage.setItem('dropBoxAccessToken', response.access_token);
      this.accessToken = response.access_token;

      const expDate = new Date(new Date().getTime() + (response.expires_in * 1000));
      localStorage.setItem('dropboxExp', expDate);
      this.tokenExp = expDate;

      return response.access_token;
    }));
  }

  tokenValidate() {
    if (!this.accessToken) {
      return false;
    }

    const expTime = new Date(this.tokenExp).getTime();
    const nowTime = new Date().getTime();
    
    const diff = parseInt((expTime - nowTime) / 1000, 10);
    
    console.log('토큰 만료시간까지 남은 시간 (초) >> ', diff);
    console.log('토큰 검증 여부 결과 >> ', diff <= 100 ? false : true);
    
    return diff <= 100 ? false : true;
  }

  signIn() {
    let promise;

    if(this.accessToken && this.tokenValidate()){
      promise = Promise.resolve(this.accessToken);
    }  else {
      promise = this.getAccessToken();
    }

    return promise;
  }

  getUserInfo() {
    const url = `https://api.dropboxapi.com/2/users/get_current_account`;

    return this.signIn().then(() => axios.post(url, {}, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    }).then((response) => {
      console.log('getUserInfo >> ', response.data);
      return response.data;
    }))
  }

  createFolder() {
    const url = `https://api.dropboxapi.com/2/files/create_folder_v2`;

    return this.signIn().then(() => axios.post(url, {
      autorename: false,
      path: '/myapps'
    }, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    }).then((response) => {
      console.log('createFolder >> ', response.data);
      return response.data;
    }));
  }

  /**
   * 파일 업로드를 위한 세션을 생성합니다.
   * @param {File} file
   * */
  uploadStart(file) {
    console.log('uploadStart file >> ', file);

    const url = `https://content.dropboxapi.com/2/files/upload_session/start`;

    // const formData = new FormData();
    // formData.append('file', file);

    return axios.post(url, file, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          close: false,
        }),
      },
    }).then((response) => {
      console.log('uploadStart >> ', response.data);
      return response.data;
    });
  }
  
  /**
   * 생성된 세션을 이용해서 파일을 업로드합니다.
   * @param {File} file
   * @param {string} sessionId
   * @param {string} mode
   * */
  uploadFinish(file, sessionId, mode = 'add', rev = '') {
    console.log('uploadFinish file >> ', file);
    const url = `https://content.dropboxapi.com/2/files/upload_session/finish`;

    const addObj = {
      mode: 'add',
    };

    const updateObj = {
      mode: {
        '.tag': 'update',
        update: rev,
      },
    };

    const obj = mode === 'add' ? addObj : updateObj;
    
    const metadata = {
      "commit": {
        "autorename": true,
        ...obj,
        "mute": false,
        "path": `/myapps/${encodeURIComponent(file.name)}`,
        "strict_conflict": false
      },
      "cursor": {
        "offset": file.size,
        "session_id": sessionId,
      }
    };

    return axios.post(url, file, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify(metadata),
      },
    }).then((response) => {
      console.log('uploadFinish >> ', response.data);
      return response.data;
    });
  }

  /**
   * 업로드한 파일의 이름을 다시 한글로 변경합니다. (도저히 방법이 안나와서 그냥 파일 이름을 바꾸기로.)
   * @param {string} path 
   * @param {string} fileName
   * @param {string} mode
   */
  fileNameChange(path, fileName, mode = 'decode') {
    const url = `https://api.dropboxapi.com/2/files/move_v2`;

    let to_path;

    if (mode === 'decode') {
      to_path = `/myapps/${fileName}`;
    } else if (mode === 'encode') {
      to_path = `/myapps/${encodeURIComponent(fileName)}`;
    }

    return axios.post(url, {
      allow_ownership_transfer: false,
      autorename: true,
      from_path: path,
      to_path,
    }, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
    }).then((response) => {
      console.log('fileNameChange >> ', response.data);
      return response.data;
    });
  }
  
  /**
   * 파일 업로드 과정을 한 번에 처리합니다.
   * @param {File} file
   * */
  uploadFile(file) {
    console.log('file >> ', file);
    return this.signIn().then(() => (
      this.uploadStart(file).then((response) => {
        return response.session_id;
      })
    )).then((sessionId) => (
      this.uploadFinish(file, sessionId)
    )).then((response) => (
      this.fileNameChange(response.path_display, file.name)
    ));
  }

  /**
   * 드롭박스 탐색기 라이브러리를 로드합니다.
   */
  createScript() {
    const chooser = document.createElement('script');
    chooser.src = 'https://www.dropbox.com/static/api/2/dropins.js';
    chooser.dataset.appKey = this.options.auth.apiKey;
    chooser.id = 'dropboxjs';
    document.body.appendChild(chooser);
  }

  /**
   * 드롭박스 탐색기에서 선택한 파일의 정보를 가져옵니다.
   */
  getFileInfo() {
    return new Promise((resolve, reject) => {
      Dropbox.choose({
        success(files) {
          this.selectFile = files[0];
          resolve(this.selectFile);
        },
        cancel() {
          resolve(null);
        },
        linkType: 'preview',
        folderselect: true,
        // extensions: [], // 여기에 확장자들 넣음.
      });
    });
  }

  /**
   * 드롭박스에서 파일을 얻어옵니다.
   * 이 파일 데이터를 이용해 로컬에 다운로드하거나, 마이앱스에 업로드 할 수 있습니다.
   * @param {string} fileId
   */
  downloadFile(fileId) {
    const url = 'https://content.dropboxapi.com/2/files/download';

    return axios.post(url, null, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/octet-stream; charset=utf-8',
        'Dropbox-API-Arg': JSON.stringify({
          path: fileId,
        }),
      },
      responseType: 'blob',
    }).then((response) => {
      console.log('downloadFile >> ', response.data);
      return response.data;
    });
  }

  /**
   * @param {File} file
   */
  updateFile(file) {
    const path = `/myapps/${file.name}`;
    return this.signIn()
      .then(() => this.fileNameChange(path, file.name, 'encode')
        .then((response) => {
          return response.metadata;
        }))
      .then((filemetaData) => this.uploadStart(file)
        .then((response) => ({
          sessionId: response.session_id,
          rev: filemetaData.rev,
        })))
      .then((response) => this.uploadFinish(file, response.sessionId, 'update', response.rev))
      .then((response) => (
        this.fileNameChange(response.path_display, file.name)
      ));
  }
}

const dropbox = new DropboxAPI();

const dropboxButton = document.querySelector('button#dropbox');
const getUserInfoButton = document.querySelector('button#get-user-info');
const createFolderButton = document.querySelector('button#create-folder');

const fileInput = document.querySelector('input#pick');
const uploadFileButton = document.querySelector('button#upload-file');

const getFileInfoButton = document.querySelector('button#get-file-info');
const downloadFileButton = document.querySelector('button#download-file');
const updateFileButton = document.querySelector('button#update-file');

dropboxButton?.addEventListener('click', () => {
  dropbox.getAccessToken();
});

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