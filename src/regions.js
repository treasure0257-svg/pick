// 17개 광역 시·도 목록 + 주소 문자열에서 region id를 뽑아내는 헬퍼.
// places.address 첫 토큰이 시·도 prefix와 일치하는지로 판정 (예: "서울 중구 …" → "seoul").

// 각 지역의 대표 랜드마크/풍경 사진. Unsplash 직접 URL 사용 (검증된 photo id).
// ?w=400&q=70 으로 서빙해서 타일 크기에 최적화.
const IMG = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=400&q=70`;

export const REGIONS = [
  { id: 'seoul',     label: '서울', hint: 'N서울타워·한강',       icon: 'location_city',   image: IMG('photo-1538485399081-7c8ed7ac21a4') },
  { id: 'gyeonggi',  label: '경기', hint: '수원 화성·양평',        icon: 'domain',          image: IMG('photo-1448375240586-882707db888b') },
  { id: 'incheon',   label: '인천', hint: '송도·인천대교',         icon: 'anchor',          image: IMG('photo-1566633806327-68e152aaf26d') },
  { id: 'busan',     label: '부산', hint: '해운대·광안대교',       icon: 'sailing',         image: IMG('photo-1502680390469-be75c86b636f') },
  { id: 'daegu',     label: '대구', hint: '팔공산·동성로',         icon: 'park',            image: IMG('photo-1507525428034-b723cf961d3e') },
  { id: 'gwangju',   label: '광주', hint: '무등산·아시아문화전당',  icon: 'yard',            image: IMG('photo-1521587760476-6c12a4b040da') },
  { id: 'daejeon',   label: '대전', hint: '엑스포·유성온천',       icon: 'science',         image: IMG('photo-1545987796-200677ee1011') },
  { id: 'ulsan',     label: '울산', hint: '태화강·대왕암',         icon: 'factory',         image: IMG('photo-1464822759023-fed622ff2c3b') },
  { id: 'sejong',    label: '세종', hint: '정부청사·호수공원',     icon: 'account_balance', image: IMG('photo-1534080564583-6be75777b70a') },
  { id: 'gangwon',   label: '강원', hint: '설악산·속초·강릉',      icon: 'terrain',         image: IMG('photo-1488841714725-bb4c32d1ac94') },
  { id: 'chungbuk',  label: '충북', hint: '청주·단양',             icon: 'landscape',       image: IMG('photo-1507133750040-4a8f57021571') },
  { id: 'chungnam',  label: '충남', hint: '공주·부여·태안',        icon: 'landscape',       image: IMG('photo-1590846406792-0adc7f938f1d') },
  { id: 'jeonbuk',   label: '전북', hint: '전주 한옥마을·군산',    icon: 'rice_bowl',       image: IMG('photo-1590846406792-0adc7f938f1d') },
  { id: 'jeonnam',   label: '전남', hint: '순천만·여수·담양',      icon: 'temple_buddhist', image: IMG('photo-1580977251946-91e5a7ff1e59') },
  { id: 'gyeongbuk', label: '경북', hint: '경주·안동 하회마을',    icon: 'temple_hindu',    image: IMG('photo-1514933651103-005eec06c04b') },
  { id: 'gyeongnam', label: '경남', hint: '통영·거제·진주',        icon: 'fort',            image: IMG('photo-1470337458703-46ad1756a187') },
  { id: 'jeju',      label: '제주', hint: '성산일출봉·한라산',     icon: 'beach_access',    image: IMG('photo-1566633806327-68e152aaf26d') }
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
