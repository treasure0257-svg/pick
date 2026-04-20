// 17개 광역 시·도 목록 + 주소 문자열에서 region id를 뽑아내는 헬퍼.
// places.address 첫 토큰이 시·도 prefix와 일치하는지로 판정 (예: "서울 중구 …" → "seoul").

export const REGIONS = [
  { id: 'seoul',     label: '서울',     icon: 'location_city' },
  { id: 'gyeonggi',  label: '경기',     icon: 'domain' },
  { id: 'incheon',   label: '인천',     icon: 'anchor' },
  { id: 'busan',     label: '부산',     icon: 'sailing' },
  { id: 'daegu',     label: '대구',     icon: 'park' },
  { id: 'gwangju',   label: '광주',     icon: 'yard' },
  { id: 'daejeon',   label: '대전',     icon: 'science' },
  { id: 'ulsan',     label: '울산',     icon: 'factory' },
  { id: 'sejong',    label: '세종',     icon: 'account_balance' },
  { id: 'gangwon',   label: '강원',     icon: 'terrain' },
  { id: 'chungbuk',  label: '충북',     icon: 'landscape' },
  { id: 'chungnam',  label: '충남',     icon: 'landscape' },
  { id: 'jeonbuk',   label: '전북',     icon: 'rice_bowl' },
  { id: 'jeonnam',   label: '전남',     icon: 'temple_buddhist' },
  { id: 'gyeongbuk', label: '경북',     icon: 'temple_hindu' },
  { id: 'gyeongnam', label: '경남',     icon: 'fort' },
  { id: 'jeju',      label: '제주',     icon: 'beach_access' }
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
