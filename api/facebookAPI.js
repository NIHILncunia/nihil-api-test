class FacebookAPI {
  constructor() {
    this.resolve;
    this.accessToken = localStorage.getItem('facebookAccessToken') || null;
    this.tokenExp = localStorage.getItem('facebookExpTime') || null;
    this.messageHandler = this.getMessage.bind(this);

    this.options = {
      auth: {
        clientId: '262624706639231',
        clientSecret: '024957125971d1d8f9612d99cdc0c9f9',
        redirectUri: 'http://localhost:5500/auth/token',
        scope: [
          'pages_show_list',
          'pages_read_engagement',
          'pages_manage_metadata',
          'pages_read_user_content',
          'pages_manage_posts',
          'pages_manage_engagement',
          'public_profile',
        ],
      },
    };
  }

  /**
   * 토큰 발급에 필요한 코드를 가져옵니다.
   */
  getAuthCode() {
    let url = 'https://www.facebook.com/v17.0/dialog/oauth';
    url += `?client_id=${this.options.auth.clientId}`;
    url += `&redirect_uri=${this.options.auth.redirectUri}`;
    url += `&state=${encodeURIComponent(location.href)}`;

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
    let url = `https://graph.facebook.com/v17.0/oauth/access_token`;
    url += `?client_id=${this.options.auth.clientId}`;
    url += `&redirect_uri=${this.options.auth.redirectUri}`;
    url += `&client_secret=${this.options.auth.clientSecret}`;
    url += `&code=${code}`;

    return axios.post(url, {}, {
      headers: {
        'content-type' : 'application/x-www-form-urlencoded;charset=utf-8'
      },
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
          localStorage.setItem('facebookAccessToken', response.access_token);
          this.accessToken = response.access_token;

          const expDate = new Date(new Date().getTime() + (response.expires_in * 1000));
          localStorage.setItem('facebookExpTime', expDate);
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

  /**
   * 페이스북 내 정보 가져오기
   * */
  getFacebookInfo() {
    let url = `https://graph.facebook.com/me`;
    url += `?fields=id,name,email,picture`;
    url += `&access_token=${this.accessToken}`;
    
    return this.signIn().then(() => {
      return axios.get(url).then((response) => {
        console.log('getFacebookInfo >> ', response.data);
        return response.data;
      });
    });
  }

  /**
   * 사용자 피드 가져오기
   * @param {string} userId
   */
  // getFacebookFeed(userId) {
  //   let url = `https://graph.facebook.com/${userId}/feed`;
  //   url += `?fields=is_published,created_time,updated_time,attachments{media_type,title,url,subattachments},message`;

  //   return this.signIn().then(() => {
  //     return axios.get(url, {
  //       headers: {
  //         Authorization: `Bearer ${this.accessToken}`,
  //       }
  //     })
  //   }).then((response) => {
  //     console.log('getFacebookFeed >> ', response.data);
  //     return response.data;
  //   });
  // }

  /**
   * 사용자 페이지 목록 가져오기
   */
  getAccountData() {
    let url = `https://graph.facebook.com/me/accounts`;
    
    return this.signIn().then(() => {
      return axios.get(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        }
      })
    }).then((response) => {
      console.log('getAccountData >> ', response.data);
      return response.data;
    });
  }

  /**
   * 페이지에 새로운 게시글을 업로드합니다.
   * @param {string} pageId
   * @param {string} content
   */
  uploadPost(pageId, content) {
    let url = `https://graph.facebook.com/${pageId}/feed`;
    url += `?message=${content}`;

    return this.signIn().then(() => {
      return axios.post(url, {}, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        }
      });
    });
  }

  /**
   * 페이지에 이미지가 포함된 새로운 게시글을 업로드합니다.
   * @param {string} pageId 
   * @param {string} content
   * @param {string[]} images
   */
  uploadPostWithImages(pageId, content, images) {
    let url = ``;
  }
}

const facebookButton = document.querySelector('button#facebook-token');

const facebook = new FacebookAPI();

facebookButton?.addEventListener('click', () => {
  facebook.getAccessToken();
});