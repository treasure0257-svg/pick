// 17개 광역 시·도 목록 + 주소 문자열에서 region id를 뽑아내는 헬퍼.
// places.address 첫 토큰이 시·도 prefix와 일치하는지로 판정 (예: "서울 중구 …" → "seoul").

// 각 지역의 실제 랜드마크 사진.
// 원본: Wikipedia Commons (scripts/fetch-region-photos.mjs 의 TARGETS 참조).
// 원본을 scripts/download-region-photos.mjs 로 다운받아 1280px JPEG로 리사이즈해
// public/data/regions/*.jpg 에 보관. Firebase Hosting 자체 CDN으로 서빙 → Wikimedia rate-limit 영향 없음.
// hint 필드는 검색·접근성용 대표 랜드마크 문자열.
//
// subregions: 광역 시·도 아래 주요 권역 리스트 (drill-down 용).
// 각 sub는 keywords[]로 정의 — 장소 address 문자열에 해당 키워드가 포함되면 그 sub로 분류.
// MVP 단계에서 Seoul만 실데이터 매칭, 나머지 시·도는 UI만 (데이터 들어오면 자동으로 카운트 채워짐).

export const REGIONS = [
  { id: 'seoul', label: '서울', hint: 'N서울타워·한강', icon: 'location_city',
    image: '/data/regions/seoul.jpg',
    subregions: [
      { id: 'gangnam',   label: '강남·서초',    hint: '강남역·신사·가로수길',   keywords: ['강남구', '서초구', '신사동', '가로수길'] },
      { id: 'hongdae',   label: '홍대·마포',    hint: '홍대·연남·망원',          keywords: ['마포구', '홍대', '서교동', '연남동', '망원동', '합정'] },
      { id: 'itaewon',   label: '이태원·한남',  hint: '이태원·한남·경리단길',    keywords: ['이태원', '한남', '용산구', '경리단'] },
      { id: 'seongsu',   label: '성수·건대',    hint: '성수동·서울숲·건대입구',  keywords: ['성수', '성동구', '건대', '광진구'] },
      { id: 'jongno',    label: '종로·을지로',  hint: '광화문·익선동·을지로',    keywords: ['종로구', '중구', '을지로', '익선동', '삼청로', '광화문'] },
      { id: 'yeouido',   label: '여의도·영등포', hint: '여의도 한강공원',        keywords: ['여의도', '영등포구'] },
      { id: 'gangbuk',   label: '강북·성북',    hint: '북한산·우이동·삼청',      keywords: ['강북구', '도봉구', '성북구', '우이동'] },
      { id: 'seodaemun', label: '서대문·은평',  hint: '연희동·신촌·독립문',      keywords: ['서대문구', '연희동', '은평구', '신촌'] },
      { id: 'jamsil',    label: '잠실·송파',    hint: '롯데월드·석촌호수',       keywords: ['송파구', '잠실', '석촌동', '문정동', '방이동', '올림픽공원'] },
      { id: 'gangdong',  label: '강동·천호',    hint: '천호·암사·고덕',          keywords: ['강동구', '천호동', '암사동', '고덕동', '길동'] },
      { id: 'nowon',     label: '노원·중랑',    hint: '노원·상계·중계·면목',     keywords: ['노원구', '상계동', '중계동', '중랑구', '면목동', '상봉동'] },
      { id: 'dongdaemun', label: '동대문·청량리', hint: '회기·청량리·DDP',        keywords: ['동대문구', '회기동', '청량리', '전농동', '이문동'] },
      { id: 'gangseo',   label: '강서·마곡',    hint: '마곡·발산·김포공항',      keywords: ['강서구', '마곡', '발산', '화곡동', '가양동'] },
      { id: 'gwanak',    label: '관악·사당',    hint: '신림·서울대·사당',        keywords: ['관악구', '신림', '서울대', '봉천동', '사당'] },
      { id: 'guro',      label: '구로·가산',    hint: '가산디지털·구로디지털',   keywords: ['구로구', '금천구', '가산디지털', '구로디지털', '신도림'] },
      { id: 'yangcheon', label: '양천·목동',    hint: '목동·오목교·신정',        keywords: ['양천구', '목동', '신정동', '오목교'] },
      { id: 'dongjak',   label: '동작·노량진',  hint: '노량진·사당·흑석',        keywords: ['동작구', '노량진', '흑석동', '상도동'] }
    ]
  },
  { id: 'gyeonggi', label: '경기', hint: '수원 화성·양평', icon: 'domain',
    image: '/data/regions/gyeonggi.jpg',
    subregions: [
      { id: 'suwon',     label: '수원·화성',    hint: '수원 화성·행궁동',       keywords: ['수원시', '화성시', '행궁동'] },
      { id: 'bundang',   label: '성남·분당',    hint: '분당·판교·서현',         keywords: ['성남시', '분당구', '판교', '서현동'] },
      { id: 'ilsan',     label: '고양·일산',    hint: '일산·호수공원',          keywords: ['고양시', '일산동구', '일산서구'] },
      { id: 'yangpyeong', label: '양평·가평',   hint: '북한강·청평·서종',        keywords: ['양평군', '가평군', '서종면'] },
      { id: 'yeoju',     label: '여주·이천',    hint: '남한강·도자기·쌀',       keywords: ['여주시', '이천시'] },
      { id: 'incheon_nearby', label: '안양·광명·부천', hint: '서울 서남권 근교', keywords: ['안양시', '광명시', '부천시'] },
      { id: 'yongin',    label: '용인·수지',    hint: '에버랜드·광교·수지',     keywords: ['용인시', '수지구', '기흥구', '처인구'] },
      { id: 'hanam',     label: '하남·남양주',  hint: '스타필드·한강뷰',         keywords: ['하남시', '남양주시', '미사'] },
      { id: 'uijeongbu', label: '의정부·양주',  hint: '북부 경기·부대찌개',      keywords: ['의정부시', '양주시', '동두천시'] },
      { id: 'pyeongtaek', label: '평택·안성',   hint: '평택항·안성 먹거리',      keywords: ['평택시', '안성시', '오산시'] },
      { id: 'ansan',     label: '안산·시흥',    hint: '대부도·서해안',           keywords: ['안산시', '시흥시', '대부도'] }
    ]
  },
  { id: 'incheon', label: '인천', hint: '송도·인천대교', icon: 'anchor',
    image: '/data/regions/incheon.jpg',
    subregions: [
      { id: 'songdo',    label: '송도',          hint: '센트럴파크·국제도시',   keywords: ['송도', '연수구'] },
      { id: 'wolmi',     label: '월미도·차이나타운', hint: '개항장·월미도',      keywords: ['중구', '월미도', '차이나타운'] },
      { id: 'ganghwa',   label: '강화도',        hint: '전등사·마니산',         keywords: ['강화군', '강화도'] },
      { id: 'yeongjong', label: '영종도·을왕리', hint: '공항·을왕리해변',       keywords: ['영종도', '을왕리', '중구 운서'] },
      { id: 'bupyeong',  label: '부평·계양',     hint: '부평역·계양산',          keywords: ['부평구', '계양구', '부평동'] },
      { id: 'guwol',     label: '구월·논현',     hint: '남동구 중심 상권',       keywords: ['남동구', '구월동', '논현동'] }
    ]
  },
  { id: 'busan', label: '부산', hint: '해운대·광안대교', icon: 'sailing',
    image: '/data/regions/busan.jpg',
    subregions: [
      { id: 'haeundae',  label: '해운대·마린시티', hint: '해운대·블루라인파크', keywords: ['해운대구', '해운대'] },
      { id: 'gwangalli', label: '광안리·수영',     hint: '광안대교·민락',       keywords: ['수영구', '광안리', '민락동'] },
      { id: 'nampo',     label: '남포동·자갈치',   hint: '원도심·국제시장',     keywords: ['중구', '자갈치', '남포동'] },
      { id: 'seomyeon',  label: '서면·전포',       hint: '부산 중심 상권',       keywords: ['부산진구', '서면', '전포동'] },
      { id: 'gijang',    label: '기장·송정',       hint: '서핑·해안 드라이브',   keywords: ['기장군', '송정동'] },
      { id: 'dongrae',   label: '동래·온천장',     hint: '동래읍성·온천',        keywords: ['동래구', '온천장', '명륜동'] },
      { id: 'sasang',    label: '사상·구포',       hint: '서부산 교통 중심',     keywords: ['사상구', '북구', '구포동', '덕천동'] },
      { id: 'namgu',     label: '남구·용호',       hint: 'UN평화공원·이기대',    keywords: ['남구', '용호동', '대연동'] }
    ]
  },
  { id: 'daegu', label: '대구', hint: '팔공산·동성로', icon: 'park',
    image: '/data/regions/daegu.jpg',
    subregions: [
      { id: 'dongseongro', label: '동성로·반월당', hint: '도심 상권',          keywords: ['중구', '동성로', '반월당'] },
      { id: 'suseong',   label: '수성못·범어',     hint: '수성못·들안길',        keywords: ['수성구', '수성못', '범어동'] },
      { id: 'palgongsan', label: '팔공산',         hint: '갓바위·케이블카',      keywords: ['팔공산', '동구'] },
      { id: 'seomun',    label: '서문시장·북성로', hint: '전통시장·맥주길',      keywords: ['서문시장', '북성로', '중구'] },
      { id: 'dalseo',    label: '달서·성서',       hint: '두류공원·이월드',      keywords: ['달서구', '두류동', '성서', '상인동'] },
      { id: 'bukgu',     label: '북구·칠곡',       hint: '대구 북부·칠곡지구',   keywords: ['북구', '칠곡', '침산동', '산격동'] },
      { id: 'dalseong',  label: '달성·화원',       hint: '비슬산·사문진',        keywords: ['달성군', '화원읍', '비슬산', '가창'] }
    ]
  },
  { id: 'gwangju', label: '광주', hint: '무등산·아시아문화전당', icon: 'yard',
    image: '/data/regions/gwangju.jpg',
    subregions: [
      { id: 'chungjangno', label: '충장로·금남로', hint: '도심 쇼핑거리',        keywords: ['동구', '충장로', '금남로'] },
      { id: 'mudeung',   label: '무등산',           hint: '등산·의재미술관',      keywords: ['무등산', '동구'] },
      { id: 'yangdong',  label: '양동시장·송정',    hint: '전통시장·송정역',      keywords: ['서구', '양동시장', '송정'] },
      { id: 'acc',       label: '국립아시아문화전당', hint: '예술의 거리',         keywords: ['국립아시아', '문화전당'] },
      { id: 'sangmu',    label: '상무지구·첨단',    hint: '광주 신도심',           keywords: ['서구', '상무지구', '광산구', '첨단'] }
    ]
  },
  { id: 'daejeon', label: '대전', hint: '엑스포·한빛탑', icon: 'science',
    image: '/data/regions/daejeon.jpg',
    subregions: [
      { id: 'dunsan',    label: '둔산·타임월드',   hint: '대전 중심 상권',       keywords: ['서구', '둔산동', '타임월드'] },
      { id: 'yuseong',   label: '유성·온천',       hint: '온천·카이스트 근처',   keywords: ['유성구', '유성온천'] },
      { id: 'expo',      label: '엑스포·한빛탑',   hint: '엑스포과학공원',       keywords: ['엑스포', '한빛탑', '유성구 도룡동'] },
      { id: 'daehan',    label: '대흥동·은행동',   hint: '원도심 카페거리',      keywords: ['중구', '대흥동', '은행동'] },
      { id: 'doan',      label: '도안·관저',       hint: '서남부 신도심',         keywords: ['서구 도안', '관저동', '유성구 도안'] }
    ]
  },
  { id: 'ulsan', label: '울산', hint: '태화강·대왕암', icon: 'factory',
    image: '/data/regions/ulsan.jpg',
    subregions: [
      { id: 'taehwa',    label: '태화강·십리대숲', hint: '국가정원·대숲',        keywords: ['중구', '태화강', '태화동'] },
      { id: 'daewangam', label: '대왕암·일산해수욕장', hint: '동해 해안',          keywords: ['동구', '대왕암', '일산동'] },
      { id: 'ulju',      label: '울주·간절곶',     hint: '영남알프스·해돋이',    keywords: ['울주군', '간절곶'] },
      { id: 'samsan',    label: '삼산·무거',       hint: '남구 중심 상권',       keywords: ['남구', '삼산동', '무거동'] }
    ]
  },
  { id: 'sejong', label: '세종', hint: '정부청사·호수공원', icon: 'account_balance',
    image: '/data/regions/sejong.jpg',
    subregions: [
      { id: 'sejong_lake',   label: '호수공원·중앙공원', hint: '세종호수공원',     keywords: ['호수공원', '중앙공원'] },
      { id: 'sejong_center', label: '정부청사·신도심',   hint: '어진동·나성동',    keywords: ['어진동', '나성동', '보람동'] },
      { id: 'jochiwon',      label: '조치원',            hint: '전통 읍내',         keywords: ['조치원'] }
    ]
  },
  { id: 'gangwon', label: '강원', hint: '설악산·속초·강릉', icon: 'terrain',
    image: '/data/regions/gangwon.jpg',
    subregions: [
      { id: 'sokcho',    label: '속초·설악',       hint: '설악산·중앙시장',      keywords: ['속초시'] },
      { id: 'gangneung', label: '강릉',            hint: '경포·안목 커피거리',   keywords: ['강릉시'] },
      { id: 'chuncheon', label: '춘천',            hint: '의암호·남이섬 근교',   keywords: ['춘천시'] },
      { id: 'yangyang',  label: '양양',            hint: '서핑·죽도',             keywords: ['양양군'] },
      { id: 'pyeongchang', label: '평창·정선',     hint: '스키·산간 레저',        keywords: ['평창군', '정선군'] },
      { id: 'donghae',   label: '동해·삼척',       hint: '바닷가 드라이브',        keywords: ['동해시', '삼척시'] },
      { id: 'wonju',     label: '원주·횡성',       hint: '소금산 출렁다리·한우',  keywords: ['원주시', '횡성군'] }
    ]
  },
  { id: 'chungbuk', label: '충북', hint: '청주·단양', icon: 'landscape',
    image: '/data/regions/chungbuk.jpg',
    subregions: [
      { id: 'cheongju',  label: '청주',            hint: '성안길·수암골',         keywords: ['청주시'] },
      { id: 'danyang',   label: '단양',            hint: '도담삼봉·만천하',       keywords: ['단양군'] },
      { id: 'chungju',   label: '충주',            hint: '탄금호·수안보',         keywords: ['충주시'] },
      { id: 'jecheon',   label: '제천',            hint: '청풍호·의림지',         keywords: ['제천시'] }
    ]
  },
  { id: 'chungnam', label: '충남', hint: '공주·부여·태안', icon: 'landscape',
    image: '/data/regions/chungnam.jpg',
    subregions: [
      { id: 'gongju',    label: '공주',            hint: '공산성·한옥마을',        keywords: ['공주시'] },
      { id: 'buyeo',     label: '부여',            hint: '부소산성·백제문화',      keywords: ['부여군'] },
      { id: 'taean',     label: '태안·안면도',     hint: '꽃지해변·사구',          keywords: ['태안군', '안면도'] },
      { id: 'cheonan',   label: '천안·아산',       hint: '독립기념관·온천',        keywords: ['천안시', '아산시'] },
      { id: 'boryeong',  label: '보령·서천',       hint: '대천해변·머드축제',      keywords: ['보령시', '서천군'] }
    ]
  },
  { id: 'jeonbuk', label: '전북', hint: '전주 한옥마을·군산', icon: 'rice_bowl',
    image: '/data/regions/jeonbuk.jpg',
    subregions: [
      { id: 'jeonju',    label: '전주 한옥마을',   hint: '경기전·한옥마을',        keywords: ['전주시'] },
      { id: 'gunsan',    label: '군산',            hint: '경암동·근대건축',        keywords: ['군산시'] },
      { id: 'namwon',    label: '남원',            hint: '지리산·춘향',            keywords: ['남원시'] },
      { id: 'gochang',   label: '고창·부안',       hint: '선운산·변산',            keywords: ['고창군', '부안군'] },
      { id: 'iksan',     label: '익산·정읍',       hint: '미륵사지·내장산',        keywords: ['익산시', '정읍시'] }
    ]
  },
  { id: 'jeonnam', label: '전남', hint: '순천만·여수·담양', icon: 'temple_buddhist',
    image: '/data/regions/jeonnam.jpg',
    subregions: [
      { id: 'yeosu',     label: '여수',            hint: '돌산대교·낭만포차',     keywords: ['여수시'] },
      { id: 'suncheon',  label: '순천',            hint: '순천만·드라마세트장',   keywords: ['순천시'] },
      { id: 'damyang',   label: '담양',            hint: '죽녹원·메타세쿼이아',   keywords: ['담양군'] },
      { id: 'mokpo',     label: '목포',            hint: '유달산·근대역사거리',   keywords: ['목포시'] },
      { id: 'wando',     label: '완도·해남',       hint: '청산도·땅끝',            keywords: ['완도군', '해남군'] },
      { id: 'naju',      label: '나주·장성',       hint: '영산강·축령산 편백숲',   keywords: ['나주시', '장성군'] },
      { id: 'boseong',   label: '보성·고흥',       hint: '녹차밭·나로우주센터',    keywords: ['보성군', '고흥군'] }
    ]
  },
  { id: 'gyeongbuk', label: '경북', hint: '경주·안동 하회마을', icon: 'temple_hindu',
    image: '/data/regions/gyeongbuk.jpg',
    subregions: [
      { id: 'gyeongju',  label: '경주',            hint: '불국사·보문단지',       keywords: ['경주시'] },
      { id: 'andong',    label: '안동',            hint: '하회마을·월영교',       keywords: ['안동시'] },
      { id: 'pohang',    label: '포항',            hint: '호미곶·죽도시장',       keywords: ['포항시'] },
      { id: 'yeongju',   label: '영주·봉화',       hint: '부석사·소수서원',       keywords: ['영주시', '봉화군'] },
      { id: 'gumi',      label: '구미·김천',       hint: '금오산·직지사',          keywords: ['구미시', '김천시'] }
    ]
  },
  { id: 'gyeongnam', label: '경남', hint: '통영·거제·진주', icon: 'fort',
    image: '/data/regions/gyeongnam.jpg',
    subregions: [
      { id: 'tongyeong', label: '통영',            hint: '동피랑·케이블카',        keywords: ['통영시'] },
      { id: 'geoje',     label: '거제·남해',       hint: '외도·바람의언덕',        keywords: ['거제시', '남해군'] },
      { id: 'jinju',     label: '진주',            hint: '진주성·남강',            keywords: ['진주시'] },
      { id: 'changwon',  label: '창원·김해',       hint: '주남저수지·봉하마을',    keywords: ['창원시', '김해시'] },
      { id: 'yangsan',   label: '양산·밀양',       hint: '통도사·영남알프스',      keywords: ['양산시', '밀양시'] },
      { id: 'hadong',    label: '하동·산청',       hint: '지리산·쌍계사·녹차',     keywords: ['하동군', '산청군'] }
    ]
  },
  { id: 'jeju', label: '제주', hint: '성산일출봉·한라산', icon: 'beach_access',
    image: '/data/regions/jeju.jpg',
    subregions: [
      { id: 'jeju_city', label: '제주시',          hint: '공항·연동·노형',         keywords: ['제주시'] },
      { id: 'seogwipo',  label: '서귀포',          hint: '천지연·이중섭거리',      keywords: ['서귀포시'] },
      { id: 'seongsan',  label: '성산·우도',       hint: '성산일출봉·우도',        keywords: ['성산읍', '우도면'] },
      { id: 'aewol',     label: '애월·한림',       hint: '서부 해안·협재',          keywords: ['애월읍', '한림읍', '협재'] },
      { id: 'jungmun',   label: '중문·안덕',       hint: '색달·주상절리',          keywords: ['중문동', '안덕면'] }
    ]
  }
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

export function subregionLabel(regionId, subId) {
  return REGIONS.find(r => r.id === regionId)?.subregions?.find(s => s.id === subId)?.label || subId;
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

// 주소 문자열을 regionId의 subregions 중 어느 하나에 매칭. 첫 매칭 sub를 반환.
export function subregionFromAddress(addr, regionId) {
  if (!addr) return null;
  const region = REGIONS.find(r => r.id === regionId);
  if (!region?.subregions) return null;
  for (const sub of region.subregions) {
    for (const kw of sub.keywords || []) {
      if (addr.includes(kw)) return sub.id;
    }
  }
  return null;
}

export function countPlacesBySubregion(places, regionId) {
  const counts = {};
  for (const p of places) {
    if (regionFromAddress(p.address) !== regionId) continue;
    const sub = subregionFromAddress(p.address, regionId);
    if (sub) counts[sub] = (counts[sub] || 0) + 1;
  }
  return counts;
}

export function placesInSubregion(places, regionId, subId) {
  return places.filter(p => {
    if (regionFromAddress(p.address) !== regionId) return false;
    return subregionFromAddress(p.address, regionId) === subId;
  });
}

// 지역별 "대표 명소" 큐레이션 — Kakao keywordSearch 로 실제 장소 fetch 후
// 세부 지역 grid 위에 보여주는 featured 섹션에 사용.
// 이름은 카카오맵에서 찾을 때 정확히 매칭되는 널리 알려진 장소명.
export const FEATURED_ATTRACTIONS = {
  seoul:     ['경복궁', 'N서울타워', '동대문디자인플라자', '창덕궁', '한강공원 여의도지구'],
  gyeonggi:  ['수원화성', '에버랜드', '한국민속촌', '남이섬', '두물머리'],
  incheon:   ['송도 센트럴파크', '월미도', '강화 전등사', '차이나타운', '을왕리해수욕장'],
  busan:     ['해운대해수욕장', '광안리해수욕장', '감천문화마을', '태종대', '자갈치시장'],
  daegu:     ['팔공산 케이블카', '수성못', '동성로', '서문시장', '앞산전망대'],
  gwangju:   ['무등산 국립공원', '국립아시아문화전당', '양림동 역사문화마을', '1913송정역시장', '광주 대인예술시장'],
  daejeon:   ['엑스포과학공원', '유성온천', '대전 오월드', '계족산 황톳길', '성심당 본점'],
  ulsan:     ['태화강 국가정원', '대왕암공원', '간절곶', '반구대 암각화', '장생포 고래문화마을'],
  sejong:    ['세종호수공원', '국립세종수목원', '베어트리파크', '세종중앙공원', '전월산'],
  gangwon:   ['설악산 국립공원', '경포대', '남이섬', '속초 중앙시장', '양양 낙산사'],
  chungbuk:  ['단양 도담삼봉', '청남대', '법주사', '수안보온천', '청주 상당산성'],
  chungnam:  ['공주 공산성', '부여 부소산성', '태안 꽃지해수욕장', '독립기념관', '보령 대천해수욕장'],
  jeonbuk:   ['전주 한옥마을', '군산 경암동 철길마을', '남원 광한루원', '고창 선운산', '무주 덕유산'],
  jeonnam:   ['순천만 국가정원', '여수 돌산대교', '담양 죽녹원', '목포 유달산', '완도 청산도'],
  gyeongbuk: ['경주 불국사', '안동 하회마을', '포항 호미곶', '영주 부석사', '청송 주왕산'],
  gyeongnam: ['통영 동피랑벽화마을', '거제 외도보타니아', '진주성', '남해 독일마을', '하동 쌍계사'],
  jeju:      ['성산일출봉', '한라산 국립공원', '우도', '천지연폭포', '협재해수욕장']
};

export function featuredFor(regionId) {
  return FEATURED_ATTRACTIONS[regionId] || [];
}
