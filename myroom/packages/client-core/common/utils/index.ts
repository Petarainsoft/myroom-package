export function getRandomElements<T>(arr: T[], count: number): T[] {
  if (!arr || count <= 0) {
    return [];
  }
  // 만일 요청 count가 arr보다 크면, arr의 모든 요소를 반환합니다.
  if (count >= arr.length) {
    return [...arr];
  }
  // 배열 복사본을 만들어 원본 배열을 변경하지 않도록 합니다.
  const shuffled = [...arr];

  // Fisher-Yates (aka Durstenfeld, aka Knuth) shuffle 알고리즘을 사용하여 배열을 무작위로 섞습니다.
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // 섞인 배열에서 원하는 개수만큼의 요소를 선택합니다.
  return shuffled.slice(0, count);
}

const uuidPattern =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const base62Chars: string =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export function uuidToBase62V2(uuid: string): string | undefined {
  if (!uuidPattern.test(uuid)) {
    return undefined;
  }

  // convert uuid to buffer
  let v;
  const buffer = new Uint8Array(16);
  buffer[15] = (v = parseInt(uuid.slice(0, 8), 16)) >>> 24;
  buffer[14] = (v >>> 16) & 0xff;
  buffer[13] = (v >>> 8) & 0xff;
  buffer[12] = v & 0xff;

  buffer[11] = (v = parseInt(uuid.slice(9, 13), 16)) >>> 8;
  buffer[10] = v & 0xff;
  buffer[9] = (v = parseInt(uuid.slice(14, 18), 16)) >>> 8;
  buffer[8] = v & 0xff;
  buffer[7] = (v = parseInt(uuid.slice(19, 23), 16)) >>> 8;
  buffer[6] = v & 0xff;
  buffer[5] = ((v = parseInt(uuid.slice(24, 36), 16)) / 0x10000000000) & 0xff;
  buffer[4] = (v / 0x100000000) & 0xff;
  buffer[3] = (v >>> 24) & 0xff;
  buffer[2] = (v >>> 16) & 0xff;
  buffer[1] = (v >>> 8) & 0xff;
  buffer[0] = v & 0xff;

  // convert buffer to base62
  let result = "";
  let num = 0n;
  for (let i = 0; i < buffer.length; i++) {
    num = num * 256n + BigInt(buffer[i]);
  }

  while (num > 0) {
    const remainder = num % 62n;
    result = base62Chars[Number(remainder)] + result;
    num = num / 62n;
  }

  return result;
}
