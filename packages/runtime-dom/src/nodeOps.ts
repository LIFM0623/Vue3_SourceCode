// 主要是对节点元素的增删改查

export const nodeOps = {
  // 如果第三个元素不传递 === appendChild
  insert(el, parent, anchor) {
    //  appendChild  parent.insertBefore(el,otherElement/null)
    parent.insertBefore(el, anchor || null);
  },
  remove(el) {
    // 移除dom元素
    const parent = el.parentNode;
    if (parent) {
      parent.removeChild(el);
    }
  },
  createElement(type) {
    return document.createElement(type);
  },
  createText(text) {
    return document.createTextNode(text);
  },
  // 设置文本
  setText(el, text) {
    el.nodeValue = text;
  },
  setElementText(el, text) {
    el.textContent = text;
  },
  parentNode(el) {
    return el.parentNode;
  },
  nextSibling(el) {
    return el.nextSibling;
  }
};
