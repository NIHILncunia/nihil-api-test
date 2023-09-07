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

  /**
   * 토큰 발급에 필요한 코드를 가져옵니다.
   */
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

  /**
   * 코드를 가져오기 위한 메시지 처리를 합니다.
   * @param {MessageEvent} event
   */
  getMessage(event) {
    this.resolve(event.data.code);
    window.removeEventListener('message', this.messageHandler, false);
  }

  /**
   * 가져온 코드로 토큰을 얻습니다.
   * @param {string} code
   */
  getToken(code) {
    let url = `https://api.dropboxapi.com/oauth2/token`;
    url += `?client_id=${this.options.auth.apiKey}`;
    url += `&redirect_uri=${this.options.auth.redirectUri}`;
    url += `&client_secret=${this.options.auth.apiSecret}`;
    url += `&grant_type=authorization_code`;
    url += `&code=${code}`;

    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
    }).then((response) => {
      return response.json();
    }).then((response) => {
      return response;
    });
  }

  /**
   * 발급한 토큰을 저장합니다.
   */
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

  /**
   * 토큰의 유효시간을 체크합니다.
   */
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

  /**
   * 토큰이 발급되었는지 체크합니다.
   */
  signIn() {
    let promise;

    if(this.accessToken && this.tokenValidate()){
      promise = Promise.resolve(this.accessToken);
    }  else {
      promise = this.getAccessToken();
    }

    return promise;
  }

  /**
   * 유저 정보를 가져옵니다.
   */
  getUserInfo() {
    const url = `https://api.dropboxapi.com/2/users/get_current_account`;
    
    return this.signIn().then(() => fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    }).then((response) => {
      return response.json();
    }).then((response) => {
      console.log(response);
      
      return response;
    }));
  }

  /**
   * 새로운 폴더를 생성합니다.
   */
  createFolder() {
    const url = `https://api.dropboxapi.com/2/files/create_folder_v2`;

    const utf8FileName = iconv.decode(Buffer.from(localFilePath, 'binary'), 'ISO-8859-1');

    return this.signIn().then(() => fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        autorename: false,
        path: '/myapps'
      }),
    }).then((response) => {
      return response.json();
    }).then((response) => {
      console.log(response);

      return response;
    }));
  }

  /**
   * 파일 업로드를 위한 세션을 생성합니다.
   * @param {File} file
   * */
  uploadStart(file) {
    const url = `https://content.dropboxapi.com/2/files/upload_session/start`;
    
    return fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          close: false,
        }),
      },
      body: file,
    }).then((response) => {
      return response.json();
    });
  }
  
  /**
   * 생성된 세션을 이용해서 파일을 업로드합니다.
   * @param {File} file
   * @param {string} sessionId
   * @param {string} mode
   * */
  uploadFinish(file, sessionId, mode = 'add', rev = '') {
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
        "autorename": false,
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
    
    return fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify(metadata),
      },
      body: file,
    }).then((response) => {
      return response.json();
    }).catch(console.error);
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
    
    return fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        allow_ownership_transfer: false,
        autorename: true,
        from_path: path,
        to_path,
      }),
    }).then((response) => {
      return response.json();
    }).then((response) => {
      return response;
    });
  }
  
  /**
   * 파일 업로드 과정을 한 번에 처리합니다.
   * @param {File} file
   * */
  uploadFile(file) {
    return this.signIn().then(() => (
      this.uploadStart(file).then((response) => {
        return response.session_id;
      })
    )).then((sessionId) => (
      this.uploadFinish(file, sessionId).then((response) => {
        console.log('파일 업로드 결과 >> ', response);
        return response;
      })
    )).then((response) => (
      this.fileNameChange(response.path_display, file.name).then((response) => {
        console.log('파일 업데이트 결과 >> ', response);
        return response;
      })
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
        linkType: 'direct',
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

    return fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/octet-stream; charset=utf-8',
        'Dropbox-API-Arg': JSON.stringify({
          path: fileId,
        }),
      },
    }).then((response) => {
      return response.blob();
    });
  }

  /**
   * 마이앱스의 파일을 드롭박스에 덮어 씌웁니다.
   * @param {File} file
   */
  updateFile(file) {
    const path = `/myapps/${file.name}`;
    return this.signIn()
      .then(() => this.fileNameChange(path, file.name, 'encode')
        .then((response) => {
          console.log('업로드 전 파일 이름 변경 결과 >> ', response);
          return response.metadata;
        }))
      .then((filemetaData) => this.uploadStart(file)
        .then((response) => ({
          sessionId: response.session_id,
          rev: filemetaData.rev,
        })))
      .then((response) => this.uploadFinish(file, response.sessionId, 'update', response.rev)
        .then((finishResponse) => {
          console.log('파일 업로드 결과 >> ', finishResponse);
          return finishResponse;
        }))
      .then((response) => (
        this.fileNameChange(response.path_display, file.name)
          .then((fileChangeResponse) => {
            console.log('업로드 완료 후 파일 이름 변경 결과', fileChangeResponse);
            return fileChangeResponse;
          })
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
  dropbox.getAccessToken().then((response) => {
    console.log('Dropbox AccessToken >> ', response);
  });
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