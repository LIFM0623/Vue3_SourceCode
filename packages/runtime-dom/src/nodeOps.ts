// 主要是对节点元素的增删改查

export const nodeOps = {
  insert(el, container,anchor) {
    //  appendChild  container.insertBefore(el,otherElement/null)
    container.appendChild(el);
  },
  createElement(type) {
    return document.createElement(type);
  },
  setElementText(el, text) {
    el.textContent = text;
  }
};
