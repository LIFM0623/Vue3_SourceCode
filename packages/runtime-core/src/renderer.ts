import { ShapeFlags } from '@vue/shared';
import { isSameVode } from './createVnode';

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

  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      // children[i] 可是能纯文本
      patch(null, children[i], container);
    }
  };

  const mountElement = (vnode, container) => {
    // hostCreateElement()

    const { type, children, props, shapeFlag } = vnode;

    // 第一次渲染时 我们让虚拟节点和真实dom 创建关联 vnode.el = 真实dom
    // 第二次渲染 新的vnode k可以和上一次的vnode做比对 之后更新对应的el 元素 ，可以后续再复用这个dom元素
    let el = (vnode.el = hostCreateElement(type));

    if (props) {
      for (let key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    // 9 & 8 > 0 说明儿子是文本
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el);
    }

    hostSetElementText(el, children);
    hostInsert(el, container);
  };

  const processElement = (n1, n2, container) => {
    if (n1 === null) {
      // 初始化操作
      mountElement(n2, container);
    } else {
      patchElement(n1, n2, container);
    }
  };

  const patchProps = (oldProps, newProps, el) => {
    // 新的全部生效
    for (let key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key]);
    }
    // 老的有的 新的没有的 删掉
    for (let key in oldProps) {
      if (!(key in newProps)) {
        hostPatchProp(el, key, oldProps[key], null);
      }
    }
  };

  const patchElement = (n1, n2, container) => {
    // 1. 比较元素的差异 肯定要复用dom元素
    // 2. 比较属性和元素的子节点
    let el = (n2.el = n1.el); // 对dom元素的复用

    let oldProps = n1.props || {};
    let newProps = n2.props || {};

    // hostPatchProp 只针对某一个属性来处理
    patchProps(oldProps, newProps, el);
  };

  // 渲染走这里 更新也走这里
  const patch = (n1, n2, container) => {
    if (n1 === n2) return; // 两次渲染同一个元素 直接跳过

    // 直接移除老的dom元素 初始化新的dom元素
    if (n1 && !isSameVode(n1, n2)) {
      unmount(n1);
      n1 = null; // 就会执行后续n2的初始化
    }
    // n1.shapeFlag
    processElement(n1, n2, container); // 对元素处理
  };

  const unmount = (vnode) => {
    hostRemove(vnode.el);
  };
  // 多次调用 render 会进行虚拟节点得比较 再进行更新
  const render = (vnode, container) => {
    if (vnode === null) {
      // 我要移除容器中的dom 元素
      if (container._vnode) {
        unmount(container._vnode);
      }
    }
    // 将虚拟节点变成正是节点进行渲染
    patch(container._vnode || null, vnode, container);

    container._vnode = vnode;
  };

  return {
    render
  };
}
