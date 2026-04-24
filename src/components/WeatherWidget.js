import { h } from '../utils/dom.js';

// Open-Meteo (https://open-meteo.com) — 무료, API key 불필요, CORS 지원.
// 사용자 geolocation 기반 현재 날씨 + 짧은 '오늘 외출 추천' 메시지.

// WMO weather code → { icon, label }
const WEATHER_MAP = {
  0:  { icon: 'wb_sunny',         label: '맑음' },
  1:  { icon: 'wb_sunny',         label: '대체로 맑음' },
  2:  { icon: 'partly_cloudy_day', label: '구름 조금' },
  3:  { icon: 'cloud',            label: '흐림' },
  45: { icon: 'foggy',            label: '안개' },
  48: { icon: 'foggy',            label: '안개' },
  51: { icon: 'rainy',            label: '약한 이슬비' },
  53: { icon: 'rainy',            label: '이슬비' },
  55: { icon: 'rainy',            label: '강한 이슬비' },
  61: { icon: 'rainy',            label: '약한 비' },
  63: { icon: 'rainy',            label: '비' },
  65: { icon: 'rainy',            label: '강한 비' },
  71: { icon: 'ac_unit',          label: '약한 눈' },
  73: { icon: 'ac_unit',          label: '눈' },
  75: { icon: 'ac_unit',          label: '많은 눈' },
  77: { icon: 'ac_unit',          label: '눈싸락' },
  80: { icon: 'rainy',            label: '소나기' },
  81: { icon: 'rainy',            label: '소나기' },
  82: { icon: 'rainy',            label: '강한 소나기' },
  95: { icon: 'thunderstorm',     label: '뇌우' },
  96: { icon: 'thunderstorm',     label: '뇌우 + 우박' },
  99: { icon: 'thunderstorm',     label: '강한 뇌우' }
};

function vibe(temp, code) {
  // 비/눈/뇌우 → 실내 추천
  if ([51,53,55,61,63,65,80,81,82,95,96,99,71,73,75,77].includes(code)) {
    return { msg: '실내 카페·전시가 어울려요', tone: 'bg-blue-50 text-blue-700' };
  }
  if (code === 45 || code === 48) {
    return { msg: '시야 좋은 실내 추천', tone: 'bg-slate-100 text-slate-700' };
  }
  if (temp == null) return { msg: '오늘 어디로 갈까요?', tone: 'bg-surfaceContainer text-onSurface' };
  if (temp >= 30) return { msg: '시원한 카페가 어울려요',  tone: 'bg-rose-50 text-rose-700' };
  if (temp >= 23) return { msg: '산책·야외 데이트 좋아요', tone: 'bg-emerald-50 text-emerald-700' };
  if (temp >= 15) return { msg: '나들이하기 딱 좋아요',    tone: 'bg-emerald-50 text-emerald-700' };
  if (temp >= 5)  return { msg: '가볍게 외출 OK',          tone: 'bg-amber-50 text-amber-700' };
  return { msg: '따뜻한 실내가 정답!',                      tone: 'bg-blue-50 text-blue-700' };
}

const SEOUL = { lat: 37.5665, lng: 126.9780, name: '서울' };

async function fetchWeather(lat, lng) {
  // 현재 + 시간별 (오늘 24h) — 'now / +3h / +6h' 미니 forecast 표시용
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code&timezone=Asia%2FSeoul&forecast_days=1`;
  const r = await fetch(url);
  if (!r.ok) throw new Error('weather HTTP ' + r.status);
  const j = await r.json();

  // 현재 시각 기준 +3h, +6h 슬롯 인덱스 찾기
  const nowHour = new Date().getHours();
  const hourly = j.hourly?.time || [];
  const idxNow = hourly.findIndex(t => new Date(t).getHours() === nowHour);
  const slots = [];
  if (idxNow >= 0) {
    [3, 6].forEach(off => {
      const i = idxNow + off;
      if (i < hourly.length) {
        slots.push({
          time: new Date(hourly[i]).getHours() + '시',
          temp: j.hourly.temperature_2m[i],
          code: j.hourly.weather_code[i]
        });
      }
    });
  }

  return {
    temp: j.current?.temperature_2m,
    code: j.current?.weather_code,
    slots
  };
}

// 좌표 → 한국 도시명 (간단한 시·도 prefix 추정 — 정확한 reverse geocoding은 비용 발생).
// 한국 외 좌표면 그냥 '내 위치'.
function inferCityName(lat, lng) {
  if (lat < 33 || lat > 39 || lng < 124 || lng > 132) return '내 위치';
  if (lat > 37.4 && lat < 37.7 && lng > 126.8 && lng < 127.2) return '서울';
  if (lat > 37.2 && lat < 37.6 && lng > 126.6 && lng < 127.6) return '경기';
  if (lat > 37.2 && lat < 37.6 && lng > 126.4 && lng < 126.9) return '인천';
  if (lat > 35.0 && lat < 35.4 && lng > 128.9 && lng < 129.4) return '부산';
  if (lat > 35.7 && lat < 36.0 && lng > 128.4 && lng < 128.8) return '대구';
  if (lat > 35.0 && lat < 35.3 && lng > 126.7 && lng < 127.1) return '광주';
  if (lat > 36.2 && lat < 36.5 && lng > 127.2 && lng < 127.5) return '대전';
  if (lat > 33.2 && lat < 33.6 && lng > 126.2 && lng < 126.9) return '제주';
  return '내 위치';
}

export function WeatherWidget() {
  const card = h('div', {
    className: 'bg-surfaceContainerLowest rounded-2xl p-4 md:p-5 min-w-[200px] flex items-center gap-4 md:flex-col md:items-start md:gap-3 shadow-sm'
  });
  const skeleton = h('div', { className: 'flex items-center gap-3' },
    h('div', { className: 'w-10 h-10 rounded-full bg-surfaceContainer animate-pulse' }),
    h('div', {},
      h('div', { className: 'h-3 w-16 bg-surfaceContainer rounded animate-pulse mb-1.5' }),
      h('div', { className: 'h-4 w-24 bg-surfaceContainer rounded animate-pulse' })
    )
  );
  card.appendChild(skeleton);

  function paint(city, temp, code, slots = []) {
    card.innerHTML = '';
    const w = WEATHER_MAP[code] || { icon: 'wb_cloudy', label: '날씨' };
    const v = vibe(temp, code);

    card.appendChild(
      h('div', { className: 'flex items-center gap-2 md:gap-3 w-full' },
        h('div', { className: 'flex-none w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-amber-100 to-rose-100 flex items-center justify-center text-amber-700' },
          h('span', { className: 'material-symbols-outlined text-[22px] md:text-[26px]' }, w.icon)
        ),
        h('div', { className: 'flex-grow min-w-0' },
          h('div', { className: 'font-label text-[11px] uppercase tracking-wider text-onSurfaceVariant' }, city + ' · 지금'),
          h('div', { className: 'font-headline font-bold text-onSurface leading-tight flex items-baseline gap-1.5' },
            h('span', { className: 'text-xl md:text-2xl' }, temp != null ? `${Math.round(temp)}°` : '—'),
            h('span', { className: 'text-xs text-onSurfaceVariant font-body font-medium' }, w.label)
          )
        )
      )
    );

    // 시간별 미니 forecast (+3h, +6h) — 데이터 있을 때만
    if (slots.length > 0) {
      const row = h('div', { className: 'flex items-center gap-2 w-full' });
      slots.forEach(s => {
        const sw = WEATHER_MAP[s.code] || { icon: 'wb_cloudy' };
        row.appendChild(
          h('div', { className: 'flex-1 flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg bg-surfaceContainer/50' },
            h('span', { className: 'font-label text-[10px] text-onSurfaceVariant' }, s.time),
            h('span', { className: 'material-symbols-outlined text-[16px] text-amber-700' }, sw.icon),
            h('span', { className: 'font-body text-[11px] font-semibold text-onSurface' }, s.temp != null ? `${Math.round(s.temp)}°` : '—')
          )
        );
      });
      card.appendChild(row);
    }

    card.appendChild(
      h('p', { className: `font-body text-[11px] md:text-xs px-2.5 py-1 rounded-full self-start ${v.tone}` }, v.msg)
    );
  }

  function load(lat, lng, name) {
    fetchWeather(lat, lng)
      .then(({ temp, code, slots }) => paint(name, temp, code, slots))
      .catch(() => paint(name, null, 0, []));
  }

  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        load(lat, lng, inferCityName(lat, lng));
      },
      () => load(SEOUL.lat, SEOUL.lng, SEOUL.name),
      { maximumAge: 600000, timeout: 4000 }
    );
  } else {
    load(SEOUL.lat, SEOUL.lng, SEOUL.name);
  }

  return card;
}
