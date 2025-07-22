export const randomHash = (len: number) => {
  let val = "";
  let list = "abcdefghijklmnopqrstwxyz1234567890";
  let listLen = list.length;

  for (let i = 0; i < len; i++) {
    let hash = list[Math.floor(Math.random() * listLen)];
    val += hash;
  }
  return val;
};
