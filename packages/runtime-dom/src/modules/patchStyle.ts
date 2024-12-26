export default function patchStyle(el, prevValue, nextValue) {
  let style = el.style;

  for (let key in nextValue) {
    style[key] = nextValue[key]; // 新样式要全部生效
  }
  if (prevValue) {
    for (let key in prevValue) {
      if (nextValue) {
        if (nextValue[key] == null) {
          style[key] = null; // 旧样式中有的 新样式中没有的要清空
        }
      }
    }
  }
}
