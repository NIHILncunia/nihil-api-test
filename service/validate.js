function tokenValidate() {
  const expTime = new Date(localStorage.getItem('tokenExp')).getTime();
  const nowTime = new Date().getTime();
  
  const diff = parseInt((expTime - nowTime) / 1000, 10);
  
  console.log('토큰 만료시간까지 남은 시간 (초) >> ', diff);
  console.log('토큰 검증 여부 결과 >> ', diff <= 100 ? false : true);
  
  return diff <= 100 ? false : true;
}