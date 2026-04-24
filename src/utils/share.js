// 공유 + 지도앱 길찾기 deep-link 유틸.

// 사이트 base URL — 도메인 변경 시 한 곳만 수정.
export const SITE_ORIGIN = 'https://pick-concierge.web.app';

export function placeShareUrl(placeId) {
  return `${SITE_ORIGIN}/#/place?id=${encodeURIComponent(placeId)}`;
}

// 통합 공유: Web Share API 우선 → 실패/미지원 시 클립보드 복사.
// router.showToast 가 있으면 호출.
export async function sharePlace(place, router) {
  const url = placeShareUrl(place.id);
  const title = place.name || '정해줘';
  const text = `${place.name}${place.address ? ' · ' + place.address : ''}`;

  try {
    if (navigator.share) {
      await navigator.share({ title, text, url });
      return 'shared';
    }
  } catch (e) {
    // 사용자 취소나 기능 차단 — 클립보드로 폴백
  }
  try {
    await navigator.clipboard.writeText(url);
    router?.showToast?.('링크가 복사됐어요');
    return 'copied';
  } catch {
    router?.showToast?.('공유 기능을 사용할 수 없어요');
    return 'failed';
  }
}

// 지도앱 길찾기 deep-link 생성기.
// 모두 새 탭으로 열림. lat/lng 가 없으면 null 반환.
export function mapLinks(place) {
  if (!place || !Number.isFinite(place.lat) || !Number.isFinite(place.lng)) return null;
  const name = encodeURIComponent(place.name || '목적지');
  return {
    kakao:  `https://map.kakao.com/link/to/${name},${place.lat},${place.lng}`,
    naver:  `https://map.naver.com/v5/directions/-/-/${place.lng},${place.lat},${name},,/-/transit`,
    google: `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}&destination_place_id=`
  };
}
