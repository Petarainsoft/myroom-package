export const numberFormat = (value: number, locale = 'en-US') => {
  return value.toLocaleString(locale);
};

export function findLast<T>(
  arr: T[],
  predicate: (value: T, index: number, array: T[]) => boolean,
): T | undefined {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i], i, arr)) {
      return arr[i];
    }
  }
  return undefined;
}

export const comma = (num: string) => Number(num).toLocaleString('ko-KR');

export const customToFixed = (num: string, precision: number) => {
  const parts = num.split(',');
  // 정수일 경우 그대로 반환
  if (parts.length < 2) return num;
  // 첫 부분 숫자 2자리 이상일 경우 소수점 허용안함
  else if (parts[0].length > 1) return parts[0];
  else if (parts[1].length > precision) {
    // 두번째 값 0일 경우 표시안함
    if (Number(parts[1]) === 0) return parts[0];
    return parts[0] + '.' + parts[1].substring(0, precision);
  } else return num.toString();
};

/** ToDo 한글 규칙 적용 필요 */
export const nFormatter = (num: number = 0, digit = 1) => {
  if (num <= 0) {
    return '0';
  }

  const si = [
    { value: 1, symbol: '' },
    { value: 1e3, symbol: 'k' },
    { value: 1e6, symbol: 'M' },
    { value: 1e9, symbol: 'B' },
    { value: 1e12, symbol: 'T' },
    { value: 1e15, symbol: 'P' },
    { value: 1e18, symbol: 'E' },
  ];
  const g = findLast(si, (item) => num >= item.value);
  if (!g) return Number.NaN;
  let _num = customToFixed(comma(String(num)), digit);

  _num = _num.length === 1 && g.symbol ? `${_num}.0` : _num;
  return _num + g.symbol;
};

export function dFormatter(date: number) {
  const diffTime = Date.now() - date;
  const sec = diffTime / 1000;

  if (sec < 60) return '방금 전';

  const min = sec / 60;
  if (min < 60) return `${Math.floor(min)}분 전`;

  const hours = min / 60;
  if (hours < 24) return `${Math.floor(hours)}시간 전`;

  const days = hours / 24;
  if (days < 7) return `${Math.floor(days)}일 전`;

  const weeks = days / 7;
  if (weeks < 52) return `${Math.floor(weeks)}주 전`;

  const years = days / 365;
  return `${Math.floor(years)}년 전`;
}

export function getYoutubeId(videoUrl: string): string | null {
  const regex =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w\-]{11})/;
  const match = videoUrl.match(regex);
  return match ? match[1] : null;
}

const urlPattern =
  /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/;
export const isUrl = (url: string) => urlPattern.test(url);

/** UTF-8 인코딩을 기준으로 문자열을 바이트로 변환하여 길이 계산*/
export const getByteLength = (str: string) => {
  let byteLength = 0;
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    if (charCode <= 0x7f) {
      byteLength += 1; // 1바이트 ASCII
    } else {
      byteLength += 2; // 2바이트 EUC-KR
    }
  }
  return byteLength;
};

/** UTF-8 인코딩을 기준으로 문자열을 바이트로 변환하여 특정 바이트까지 문자열 자르는 함수*/
export const truncateToByteLength = (str: string, maxLength: number) => {
  let truncatedStr = '';
  let byteLength = 0;

  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    if (charCode <= 0x7f) {
      byteLength += 1; // 1바이트 ASCII
    } else {
      byteLength += 2; // 2바이트 EUC-KR
    }
    if (byteLength <= maxLength) {
      truncatedStr += str[i];
    } else {
      break;
    }
  }

  return truncatedStr;
};

// const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
// const hexToBigInt = (hex: string): bigint => {
//   return BigInt(`0x${hex.replace(/-/g, '')}`);
// };

// const bigIntToBase62 = (bigIntValue: bigint): string => {
//   let base62 = '';
//   while (bigIntValue > 0) {
//     const index = Number(bigIntValue % 62n);
//     base62 = BASE62[index] + base62;
//     bigIntValue /= 62n;
//   }
//   return base62;
// };

// /** Base62 인코딩 변환 */
// export const uuidToBase62V2 = (uuid: string): string => {
//   const bigIntValue = hexToBigInt(uuid);
//   return bigIntToBase62(bigIntValue);
// };
