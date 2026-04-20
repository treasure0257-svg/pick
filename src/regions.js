// 17개 광역 시·도 목록 + 주소 문자열에서 region id를 뽑아내는 헬퍼.
// places.address 첫 토큰이 시·도 prefix와 일치하는지로 판정 (예: "서울 중구 …" → "seoul").

// 각 지역의 실제 랜드마크 사진 (Wikipedia Commons 썸네일).
// 소스 페이지는 scripts/fetch-region-photos.mjs 의 TARGETS 참조.
// 330px는 Wikimedia가 API 호출 때 pre-generate하는 표준 썸네일 사이즈라 rate limit 걸리지 않음.
// hint 필드는 검색·접근성용 대표 랜드마크 문자열.

export const REGIONS = [
  { id: 'seoul',     label: '서울', hint: 'N서울타워·한강',       icon: 'location_city',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Seoul_Tower_%284394893276%29.jpg/330px-Seoul_Tower_%284394893276%29.jpg' },
  { id: 'gyeonggi',  label: '경기', hint: '수원 화성·양평',        icon: 'domain',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Bifyu_8.jpg/330px-Bifyu_8.jpg' },
  { id: 'incheon',   label: '인천', hint: '송도·인천대교',         icon: 'anchor',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Incheon_Grand_Bridge.jpg/330px-Incheon_Grand_Bridge.jpg' },
  { id: 'busan',     label: '부산', hint: '해운대·광안대교',       icon: 'sailing',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Haeundae_Beach_in_Busan.jpg/330px-Haeundae_Beach_in_Busan.jpg' },
  { id: 'daegu',     label: '대구', hint: '팔공산·동성로',         icon: 'park',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/%ED%8C%94%EA%B3%B5%EC%82%B0_%EA%B4%80%EB%B4%89_%EA%B2%BD%EC%B9%98%28%EA%B2%BD%EC%82%B0%EC%8B%9C_%EB%B0%A9%ED%96%A5%29.jpg/330px-%ED%8C%94%EA%B3%B5%EC%82%B0_%EA%B4%80%EB%B4%89_%EA%B2%BD%EC%B9%98%28%EA%B2%BD%EC%82%B0%EC%8B%9C_%EB%B0%A9%ED%96%A5%29.jpg' },
  { id: 'gwangju',   label: '광주', hint: '무등산·아시아문화전당',  icon: 'yard',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Gwangju_Mudeungsan.jpg/330px-Gwangju_Mudeungsan.jpg' },
  { id: 'daejeon',   label: '대전', hint: '엑스포·한빛탑',         icon: 'science',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Gate%2C_bridge%2C_and_tower_at_Daejeon_Expo_Science_Park.jpg/330px-Gate%2C_bridge%2C_and_tower_at_Daejeon_Expo_Science_Park.jpg' },
  { id: 'ulsan',     label: '울산', hint: '태화강·대왕암',         icon: 'factory',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/KU-Dwa2.jpg/330px-KU-Dwa2.jpg' },
  { id: 'sejong',    label: '세종', hint: '정부청사·호수공원',     icon: 'account_balance',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Sejong_Area_1.jpg/330px-Sejong_Area_1.jpg' },
  { id: 'gangwon',   label: '강원', hint: '설악산·속초·강릉',      icon: 'terrain',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Korea_Seoraksan.jpg/330px-Korea_Seoraksan.jpg' },
  { id: 'chungbuk',  label: '충북', hint: '청주·단양',             icon: 'landscape',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/%EC%B2%AD%EB%82%A8%EB%8C%80_%EB%B3%B8%EA%B4%80_%282%29.JPG/330px-%EC%B2%AD%EB%82%A8%EB%8C%80_%EB%B3%B8%EA%B4%80_%282%29.JPG' },
  { id: 'chungnam',  label: '충남', hint: '공주·부여·태안',        icon: 'landscape',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Buyeo_198.JPG/330px-Buyeo_198.JPG' },
  { id: 'jeonbuk',   label: '전북', hint: '전주 한옥마을·군산',    icon: 'rice_bowl',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/%EC%A0%84%EC%A3%BC%ED%95%9C%EC%98%A5%EB%A7%88%EC%9D%84_%EC%A0%84%EA%B2%BD.JPG/330px-%EC%A0%84%EC%A3%BC%ED%95%9C%EC%98%A5%EB%A7%88%EC%9D%84_%EC%A0%84%EA%B2%BD.JPG' },
  { id: 'jeonnam',   label: '전남', hint: '순천만·여수·담양',      icon: 'temple_buddhist',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/20181231_Suncheon_Bay_002.jpg/330px-20181231_Suncheon_Bay_002.jpg' },
  { id: 'gyeongbuk', label: '경북', hint: '경주·안동 하회마을',    icon: 'temple_hindu',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Lotus_Flower_Bridge_and_Seven_Treasure_Bridge_at_Bulguksa_in_Gyeongju%2C_Korea.jpg/330px-Lotus_Flower_Bridge_and_Seven_Treasure_Bridge_at_Bulguksa_in_Gyeongju%2C_Korea.jpg' },
  { id: 'gyeongnam', label: '경남', hint: '통영·거제·진주',        icon: 'fort',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Korea-Tongyeong-Collage-01.jpg/330px-Korea-Tongyeong-Collage-01.jpg' },
  { id: 'jeju',      label: '제주', hint: '성산일출봉·한라산',     icon: 'beach_access',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/%EC%84%B1%EC%82%B0%EC%9D%BC%EC%B6%9C%EB%B4%89_%EC%B2%9C%EC%97%B0%EB%B3%B4%ED%98%B8%EA%B5%AC%EC%97%AD_2019%EB%85%84_%EC%B4%AC%EC%98%81%28%EC%B6%9C%EC%B2%98_%EB%AC%B8%ED%99%94%EC%9E%AC%EC%B2%AD_%EB%8C%80%EB%B3%80%EC%9D%B8%EC%8B%A4%29.jpg/330px-%EC%84%B1%EC%82%B0%EC%9D%BC%EC%B6%9C%EB%B4%89_%EC%B2%9C%EC%97%B0%EB%B3%B4%ED%98%B8%EA%B5%AC%EC%97%AD_2019%EB%85%84_%EC%B4%AC%EC%98%81%28%EC%B6%9C%EC%B2%98_%EB%AC%B8%ED%99%94%EC%9E%AC%EC%B2%AD_%EB%8C%80%EB%B3%80%EC%9D%B8%EC%8B%A4%29.jpg' }
];

const PREFIX_TO_ID = {
  '서울': 'seoul', '부산': 'busan', '대구': 'daegu', '인천': 'incheon',
  '광주': 'gwangju', '대전': 'daejeon', '울산': 'ulsan', '세종': 'sejong',
  '경기': 'gyeonggi', '강원': 'gangwon', '충북': 'chungbuk', '충남': 'chungnam',
  '전북': 'jeonbuk', '전남': 'jeonnam', '경북': 'gyeongbuk', '경남': 'gyeongnam',
  '제주': 'jeju'
};

export function regionFromAddress(addr) {
  if (!addr) return null;
  for (const prefix of Object.keys(PREFIX_TO_ID)) {
    if (addr.startsWith(prefix)) return PREFIX_TO_ID[prefix];
  }
  return null;
}

export function regionLabel(id) {
  return REGIONS.find(r => r.id === id)?.label || id;
}

export function countPlacesByRegion(places) {
  const counts = {};
  for (const p of places) {
    const r = regionFromAddress(p.address);
    if (r) counts[r] = (counts[r] || 0) + 1;
  }
  return counts;
}

export function placesInRegion(places, regionId) {
  return places.filter(p => regionFromAddress(p.address) === regionId);
}
