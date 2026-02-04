// 다양한 색상 파레트 (배경색, 테두리, 텍스트)
const COLOR_PALETTE = [
  {
    bg: "bg-red-900/40",
    border: "border-red-500",
    text: "text-red-200",
    title: "text-red-300",
  },
  {
    bg: "bg-yellow-800/50",
    border: "border-yellow-500",
    text: "text-yellow-200",
    title: "text-yellow-300",
  },
  {
    bg: "bg-lime-900/40",
    border: "border-lime-500",
    text: "text-lime-200",
    title: "text-lime-300",
  },
  {
    bg: "bg-green-800/50",
    border: "border-green-500",
    text: "text-green-200",
    title: "text-green-300",
  },
  {
    bg: "bg-teal-900/60",
    border: "border-teal-500",
    text: "text-teal-200",
    title: "text-teal-300",
  },
  {
    bg: "bg-sky-800/50",
    border: "border-sky-500",
    text: "text-sky-200",
    title: "text-sky-300",
  },
  {
    bg: "bg-blue-800/40",
    border: "border-indigo-500",
    text: "text-blue-200",
    title: "text-blue-300",
  },
  {
    bg: "bg-indigo-900/40",
    border: "border-indigo-500",
    text: "text-indigo-200",
    title: "text-indigo-300",
  },
  {
    bg: "bg-violet-900/40",
    border: "border-violet-500",
    text: "text-violet-200",
    title: "text-violet-300",
  },
  {
    bg: "bg-fuchsia-700/40",
    border: "border-purple-400",
    text: "text-fuchsia-200",
    title: "text-fuchsia-300",
  },
  {
    bg: "bg-pink-900/40",
    border: "border-pink-500",
    text: "text-pink-200",
    title: "text-pink-300",
  },
  {
    bg: "bg-rose-900/40",
    border: "border-rose-500",
    text: "text-rose-200",
    title: "text-rose-300",
  },
];

export const getReservationColor = (id: string) => {
  // ID 문자열의 모든 글자 코드를 더해서 숫자로 만듦 (간단한 해시)
  let sum = 0;
  for (let i = 0; i < id.length; i++) {
    sum += id.charCodeAt(i);
  }

  // 파레트 개수로 나눈 나머지 인덱스 사용
  return COLOR_PALETTE[sum % COLOR_PALETTE.length];
};
