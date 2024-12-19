export function createRenderer(renderOptions) {
  // core 中不关心如何渲染

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
  } = renderOptions;

  const mountElement = (vnode,container)=>{
    hostCreateElement()
  }

  // 渲染走这里 更新也走这里
  const patch = (n1, n2, container) => {
    if (n1 === n2) return; // 两次渲染同一个元素 直接跳过
    if (n1 === null) {
      // 初始化操作
      mountElement(n2, container);
    }
  };

  // 多次调用 render 会进行虚拟节点得比较 再进行更新
  const render = (vnode, container) => {
    // 将虚拟节点变成正是节点进行渲染
    patch(container._vnode || null, vnode, container);

    container._vnode = vnode;
  };

  return {
    render
  };
}

// 完全不关心api层 可跨平台
