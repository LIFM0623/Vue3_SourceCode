// packages/runtime-core/src/index.ts
function createRenderer(renderOptions2) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    createElement: hostCreateElement,
    createText: hostCreateText,
    setElementText: hostSetElementText,
    setText: hostSetText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    patchProp: hostPatchProp
  } = renderOptions2;
  const render2 = (vnode, container) => {
  };
  return {
    render: render2
  };
}

// packages/runtime-dom/src/nodeOps.ts
var nodeOps = {
  // 如果第三个元素不传递 === appendChild
  insert(el, parent, anchor) {
    parent.insertBefore(el, anchor || null);
  },
  remove(el) {
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

// packages/runtime-dom/src/modules/patchAttr.ts
function patchAttr(el, key, value) {
  if (value) {
    el.setAttribute(key, value);
  } else {
    el.removeAttribute(key, value);
  }
}

// packages/runtime-dom/src/modules/patchClass.ts
function patchClass(el, value) {
  if (value == null) {
    el.removeAttribute("class");
  } else {
    el.className = value;
  }
}

// packages/runtime-dom/src/modules/patchEvent.ts
function createInvoker(value) {
  const invoker = (e) => {
    invoker.value(e);
  };
  invoker.value = value;
  return invoker;
}
function patchEvent(el, name, nextValue) {
  const invokers = el._vei || (el._vei = {});
  const eventName = name.slice(2).toLowerCase();
  const exisitingInvokers = invokers[name];
  if (exisitingInvokers && nextValue) {
    return exisitingInvokers.value = nextValue;
  }
  if (nextValue) {
    const invoker = invokers[name] = createInvoker(nextValue);
    return el.addEventListener(eventName, invoker);
  }
  if (exisitingInvokers) {
    invokers[name] = void 0;
    el.removeEventListener(eventName, exisitingInvokers);
  }
}

// packages/runtime-dom/src/modules/patchStyle.ts
function patchStyle(el, prevValue, nextValue) {
  let style = el.style;
  for (let key in nextValue) {
    style[key] = nextValue[key];
  }
  if (prevValue) {
    for (let key in prevValue) {
      if (nextValue[key] == null) {
        style[key] = null;
      }
    }
  }
}

// packages/runtime-dom/src/patchProp.ts
function patchProp(el, key, prevValue, nextValue) {
  if (key === "class") {
    return patchClass(el, nextValue);
  } else if (key === "style") {
    return patchStyle(el, prevValue, nextValue);
  } else if (/^on[^a-z]/.test(key)) {
    return patchEvent(el, key, nextValue);
  } else {
    return patchAttr(el, key, nextValue);
  }
}

// packages/runtime-dom/src/index.ts
var renderOptions = Object.assign({ patchProp }, nodeOps);
var render = (vnode, container) => {
  createRenderer(renderOptions).render(vnode, container);
};
export {
  createRenderer,
  render
};
//# sourceMappingURL=runtime-dom.js.map
