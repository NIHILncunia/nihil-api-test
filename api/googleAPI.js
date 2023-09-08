class GoogleAPI {
  constructor() {
    this.resolve = null;
    this.accessToken = localStorage.getItem('googleAccessToken') || null;
    this.tokenExp = localStorage.getItem('googleExp') || null;
    this.messageHandler = this.getMessage.bind(this);

    this.tokenClient = null;
    this.pickerInited = false;
    this.gisInited = false;

    this.options = {
      auth: {
        clientId: '718068923695-areq6bk2cvp10fgj436ed5aeqd951nf9.apps.googleusercontent.com',
        clientSecret: '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',
        redirectUri: 'http://localhost:5500/auth/token',
        apiKey: 'AIzaSyBho2dfP43njvUCBn1dHriOtm61fF98h-s',
        scope: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/youtube',
          'https://www.googleapis.com/auth/photoslibrary',
          'https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/drive.metadata'
        ],
      },
    };

    this.createScript();
  }

  /**
   * 토큰 발급에 필요한 코드를 가져옵니다.
   */
  getAuthCode() {
    let url = 'https://accounts.google.com/o/oauth2/auth';
    url += `?client_id=${this.options.auth.clientId}`;
    url += `&include_granted_scopes=true`;
    url += `&access_type=offline`;
    url += `&response_type=code`;
    url += `&redirect_uri=${this.options.auth.redirectUri}`;
    url += `&state=${encodeURIComponent(location.href)}`;
    url += `&scope=${this.options.auth.scope.join(' ')}`;

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
   * @returns {Promise<any>}
   */
  getToken(code) {
    const url = `https://accounts.google.com/o/oauth2/token`;

    return axios.post(url, {
      "client_id": this.options.auth.clientId,
      "redirect_uri": this.options.auth.redirectUri,
      "client_secret": this.options.auth.clientSecret,
      "grant_type": "authorization_code", 
      "code": code
    })
      .then(response => {
      console.log('getToken >> ', response.data);
      return response.data;
    });
  }
  
  /**
   * 발급한 토큰을 저장합니다.
   * @returns {Promise<any>}
   */
  getAccessToken() {
    this.getAuthCode();

    return new Promise(
      (resolve, reject) => {
        this.resolve = resolve;
      }
    ).then(
      (code) => this.getToken(code)
        .then((response) => {
          localStorage.setItem('googleAccessToken', response.access_token);
          this.accessToken = response.access_token;

          const expDate = new Date(new Date().getTime() + (response.expires_in * 1000));
          localStorage.setItem('googleExp', expDate);
          this.tokenExp = expDate;

          console.log('accessToken >> ', this.accessToken);
          console.log('tokenExp >> ', this.tokenExp);

          return response.access_token;
        })
    );
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
   * @returns {Promise<any>}
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

  // ==================== 구글 드라이브 탐색기 시작 ====================
  // ==================== 구글 드라이브 탐색기 시작 ====================
  
  /**
   * 구글 드라이브 탐색기를 로드합니다.
   */
  createScript() {
    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.async = true;
    gapiScript.defer = true;
    gapiScript.onload = this.onApiLoad.bind(this);
    document.body.appendChild(gapiScript);

    const gsiScript = document.createElement('script');
    gsiScript.src = 'https://accounts.google.com/gsi/client';
    gsiScript.async = true;
    gsiScript.defer = true;
    gsiScript.onload = this.gisLoaded.bind(this);
    document.body.appendChild(gsiScript);
  }

  /**
   * https://apis.google.com/js/api.js
   * 라이브러리의 로드에 필요합니다.
   */
  onApiLoad() {
    gapi.load('picker', () => {
      this.pickerInited = true;
    });
  }

  /**
   * https://accounts.google.com/gsi/client
   * 라이브러리의 로드에 필요합니다.
   */
  gisLoaded() {
    if (this.tokenValidate()) {
      return;
    }

    // 라이브러리 로그인 로직
    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: this.options.auth.clientId,
      scope: this.options.auth.scope.join(' '),
      callback: '', // defined later
    });

    this.gisInited = true;
  }

  /**
   * Google Drive Picker를 엽니다. 파일의 아이디가 필요할 때 사용합니다.
   */
  createPicker() {
    return new Promise((resolve, reject) => {
      this.signIn().then(() => this.showPicker((data) => {
        if (data.docs) {
          const result = {
            type: data.docs[0].mimeType,
            fileId: data.docs[0].id,
            name: data.docs[0].name,
          };

          console.log('googlePicker >> ', result);

          resolve(result);
        }
      }));
    });
  }

  /**
   * 탐색기를 엽니다.
   * @param {() => void} callback 
   */
  showPicker(callback) {
    const view1 = new google.picker.DocsView(google.picker.ViewId.DOCS)
      .setIncludeFolders(true)
      .setSelectFolderEnabled(true)
      .setParent('root');

    const picker = new google.picker.PickerBuilder()
      .addView(view1)
      .setLocale('ko')
      .setOAuthToken(this.accessToken)
      .setDeveloperKey(this.options.auth.apiKey)
      .setCallback(callback)
      .build();
    
    picker.setVisible(true);
  }

  // ==================== 구글 드라이브 탐색기 끝 ====================
  // ==================== 구글 드라이브 탐색기 끝 ====================

  // ==================== 구글 드라이브 시작 ====================
  // ==================== 구글 드라이브 시작 ====================
  
  /**
   * 드라이브의 기본 정보를 가져옵니다.
   * @returns {Promise<any>}
   */
  getDriveInfo() {
    const url = 'https://www.googleapis.com/drive/v3/about?fields=*';

    return this.signIn().then(() => axios.get(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      }
    }).then((response) => {
      console.log('getDriveInfo >> ', response.data);
      return response.data;
    }));
  }

  /**
   * 드라이브에서 최상위 폴더들을 가져옵니다.
   * @returns {Promise<any>}
   */
  getTopLevelFolders() {
    const url = `https://www.googleapis.com/drive/v3/files?corpora=user&q=mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false&orderBy=name&includeItemsFromAllDrives=false&pageSize=50&fields=*`;

    return this.signIn().then(() => axios.get(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      }
    }).then((response) => {
      console.log('getTopLevelFolders >> ', response.data);
      return response.data;
    }));
  }

  /**
   * 특정 폴더 안의 파일들을 가져옵니다.
   * @returns {Promise<any>}
   */
  getFilesInFolder(folderId) {
    const url = `https://www.googleapis.com/drive/v3/files?corpora=user&q='${folderId}' in parents and trashed=false&orderBy=name&includeItemsFromAllDrives=false&pageSize=50&fields=*`;

    return this.signIn().then(() => axios.get(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      }
    }).then((response) => {
      console.log('getFilesInFolder >> ', response.data);
      return response.data;
    }));
  }

  /**
   * 최상위 디렉토리에 폴더 만들기
   * @param {string} folderName - 폴더 이름
   * */
  createFolder(folderName) {
    const url = `https://www.googleapis.com/upload/drive/v3/files?fields=*`;

    const metadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };

    const formData = new FormData();

    formData.append('metadata', new Blob(
      [JSON.stringify(metadata)],
      {type: 'application/json'},
    ));

    return this.signIn().then(
      () => this.getTopLevelFolders()
        .then((response) => {
          const folder = response.files.find((item) => item.name === folderName);
          return folder;
        })
    ).then((response) => {
      if (response) {
        console.log('이미 해당 이름의 폴더가 존재합니다.');
        return;
      } else {
        console.log('폴더를 생성합니다.');
        return axios.post(url, formData, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }).then((response) => {
          console.log('createFolder >> ', response.data);

          return response.data;
        });
      }
    });
  }

  /**
   * 특정 폴더에 파일 업로드
   * @param {Object} metadata - 파일 정보
   * @param {File} file - 업로드 파일 데이터
   * */
  uploadToDrive(metadata, file) {
    console.log(metadata, file);

    const url = `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=*`;

    const formData = new FormData();

    formData.append('metadata', new Blob(
      [JSON.stringify(metadata)],
      { type: 'application/json' }
    ));
    formData.append('file', file);

    return this.signIn().then(() => axios.post(url, formData, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    }).then((response) => {
      console.log('uploadToDrive >> ', response.data);

      return response.data;
    }));
  }

  /**
   * 드라이브에서 blob 데이터를 받아옵니다.
   * 파일 아이디가 필요하기 때문에 GoogleDrivePicker를 통해 파일 아이디를 얻어와야합니다.
   * @param {string} fileId - 파일 아이디
   * */
  downloadFile(fileId) {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&fields=*`;

    return this.signIn().then(() => axios.get(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
      responseType: 'blob',
    }).then((response) => {
      console.log('downloadFile >> ', response.data);

      return response.data;
    }));
  }

  /**
   * 드라이브의 파일을 마이앱스의 새로운 버전의 파일로 덮어씁니다.
   * @param {string} fileId - 파일 아이디
   * @param {Object} metadata - 파일 정보
   * @param {File} file - 업로드 파일 데이터
   * */
  syncAppToDrive(fileId, metadata, file) {
    const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart&fields=*`;

    const formData = new FormData();

    formData.append('metadata', new Blob(
      [JSON.stringify(metadata)],
      { type: 'application/json' }
    ));
    formData.append('file', file);

    return this.signIn().then(() => axios.patch(url, formData, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    }).then((response) => {
      console.log('syncAppToDrive >> ', response.data);

      return response.data;
    }));
  }

  // ==================== 구글 드라이브 끝 ====================
  // ==================== 구글 드라이브 끝 ====================

  // ==================== 유튜브 시작 ====================
  // ==================== 유튜브 시작 ====================

  /**
   * 특정 유튜브채널의 영상 목록 가져오기
   * @param {string} channelId - 채널 아이디
   * */
  getVideosByChannelId(channelId) {
    let url = `https://www.googleapis.com/youtube/v3/search`;
    url += `?part=snippet`;
    url += `&key=${this.options.auth.apiKey}`;
    url += `&channelId=${channelId}`;
    url += `&maxResults=20`;
    url += `&order=date`;

    return this.signIn().then(() => axios.get(url, {}, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    }).then((response) => {
      console.log('getVideosByChannelId >> ', response.data);

      return response.data;
    }));
  }

  /**
   * 영상 업로드하기.
   * 업로드시에는 바이너리데이터로 전송합니다.
   * @param {File} file - 업로드 영상 데이터
   * @param {Object} metadata - 메타데이터
   * */
  uploadVideo(file, metadata) {
    let url = `https://www.googleapis.com/upload/youtube/v3/videos?&part=snippet,status`;

    const formData = new FormData();

    formData.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
    formData.append('file', file);

    return this.signIn().then(() => axios.post(url, formData, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    }).then((response) => {
      console.log('uploadVideo >> ', response.data);
      return response.data;
    }));
  }

  // ==================== 유튜브 끝 ====================
  // ==================== 유튜브 끝 ====================

  // ==================== 구글 캘린더 시작 ====================
  // ==================== 구글 캘린더 시작 ====================

  /** 
   * 모든 캘린더의 정보를 가져오는 메소드
   * */
  getAllCalendar() {
    const url = 'https://www.googleapis.com/calendar/v3/users/me/calendarList';

    return this.signIn().then(() => axios.get(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      }
    }).then((response) => {
      console.log('getAllCalendar >> ', response.data);
      return response.data;
    }));
  }

  /** 
   * 특정 캘린더의 정보를 가져오는 메소드
   * @param {string} calendarId - 캘린더 아이디
   * @returns {Promise<any>}
   * */
  getCalendarById(calendarId) {
    const url = `https://www.googleapis.com/calendar/v3/users/me/calendarList/${encodeURIComponent(calendarId)}`;

    return axios.get(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    }).then((response) => {
      console.log('getCalendarById >> ', response.data);
      return response.data;
    });
  }

  /**
   * 캘린더의 이벤트를 가져오는 메소드
   * @param {string} calendarId - 캘린더 아이디
   * */
  getCalendarEvents(calendarId) {
    console.log('특정 캘린더의 모든 이벤트 가져오기');

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
    return axios.get(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    }).then((response) => {
      console.log('getCalendarEvents >> ', response.data);
      return response.data;
    }).then((response) => {
      return response.items.filter((item) => {
        // 일정을 가져올 때 전부 가져오지 않고 일정의 시작일이 현재 년월과 일치하는 항목들만 가져오게 임시로 개선

        const past = new Date();
        past.setFullYear(past.getFullYear() - 1);

        const now = new Date();

        const future = new Date();
        future.setFullYear(future.getFullYear() + 1);

        const nowDate = now.toISOString().match(/^(\d{4}-\d{2})/)[0];
        const pastDate = past.toISOString().match(/^(\d{4}-\d{2})/)[0];
        const futureDate = future.toISOString().match(/^(\d{4}-\d{2})/)[0];

        const nowDay = now.getDate();

        const itemDate = item.start.date ? item.start.date : item.start.dateTime;

        return (new Date(`${futureDate}-${nowDay}`) >= new Date(itemDate)) && (new Date(itemDate) >= new Date(`${pastDate}-${nowDay}`));
      });
    });
  }

  /**
   * 시간포맷을 결정하는 메소드
   * @param {string} start - 시작일자
   * @param {string} end - 종료일자
   * @param {boolean} allDay - 종일여부
   */
  initialDate(start, end, allDay) {
    const startDate = new Date(start).toISOString().match(/(^\d{4}-\d{2}-\d{2})/)[0];
    const startTime = new Date(start).toISOString().match(/(\d{2}:\d{2}:\d{2})/)[0];

    const endDate = new Date(end).toISOString().match(/(^\d{4}-\d{2}-\d{2})/)[0];
    const endTime = new Date(end).toISOString().match(/(\d{2}:\d{2}:\d{2})/)[0];

    const dateDiffCond = startDate === endDate;
    const timeDiffCond = startTime === endTime;

    const autoTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if ((dateDiffCond && timeDiffCond) || allDay) {
      return {
        "start": {
          "date": startDate,
          "timeZone": autoTimeZone
        },
        "end": {
          "date": endDate,
          "timeZone": autoTimeZone
        },
      };
    } else if ((dateDiffCond && !timeDiffCond) || !allDay) {
      return {
        "start": {
          "dateTime": new Date(start).toISOString(),
          "timeZone": autoTimeZone
        },
        "end": {
          "dateTime": new Date(end).toISOString(),
          "timeZone": autoTimeZone
        },
      };
    }
  }

  // ==================== 구글 캘린더 끝 ====================
  // ==================== 구글 캘린더 끝 ====================
}

const googleButton = document.querySelector('button#google');

const googleApi = new GoogleAPI();

googleButton?.addEventListener('click', () => {
  googleApi.getAccessToken();
});