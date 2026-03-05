import moment from "moment-timezone";


// 아이디 검증 함수 (영어, 숫자, 언더바)
export const validateId = (id: string) => {
    const regex = /^[A-Za-z0-9_]+$/;
    return regex.test(id);
};

// 휴대폰 번호 하이픈 넣기
export const formatPhoneNumber = (target: string) => {
    // 1. 숫자만 남기기
    const nums = target.replace(/[^0-9]/g, '');

    // 2. 길이에 따라 정규식으로 하이픈 삽입
    if (nums.length <= 3) return nums;
    if (nums.length <= 7) return nums.replace(/(\d{3})(\d{1,4})/, '$1-$2');

    // 3. 10자리(010-123-4567)와 11자리(010-1234-5678) 모두 대응
    return nums.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3');
};

// 특수문자 제거 함수
export const getPureNumbers = (target: string) => {
    // \D 는 숫자가 아닌 모든 문자를 의미합니다. (더 강력한 방법!)
    return target.replace(/\D/g, '');
};

// 숫자를 시간 (분:초) 로 변환, 인증번호 만료 남은 시간에 쓰임
export const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};





// 어드민 검색용~~~~~~!!!!! 주소의 쿼리 값 조절!!
// export function setParams(params, clear = false) {
//     const currentUrl = new URL(window.location.href);
//     const searchParams = new URLSearchParams(clear ? '' : currentUrl.search); // clear가 true면 초기화

//     // 새로운 파라미터 추가
//     for (const [key, value] of Object.entries(params)) {
//         if (value === undefined || value === null) {
//             searchParams.delete(key); // null 또는 undefined는 삭제
//         } else {
//             searchParams.set(key, value.toString()); // 값 추가
//         }
//     }

//     // URL 갱신
//     currentUrl.search = searchParams.toString();
//     console.log('Updated URL:', currentUrl.toString()); // 디버깅용

//     // URL 변경
//     goto(currentUrl.pathname + currentUrl.search, { replaceState: true, invalidateAll: true });
// }