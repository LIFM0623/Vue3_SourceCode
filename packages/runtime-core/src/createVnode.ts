import { isFunction, isObject, isString, ShapeFlags } from '@vue/shared';
import { isTeleport } from './components/Teleport';

export const Text = Symbol('Text');
export const Fragment = Symbol('Fragment');
export function isVode(value) {
  return value?.__v_isvnode;
}

export function isSameVode(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}

export function createVnode(type, props, children?) {
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT // 元素
    : isTeleport(type)
    ? ShapeFlags.TELEPORT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT //组件
    : isFunction(type)
    ? ShapeFlags.FUNCTIONAL_COMPONENT // 函数式组件
    : 0;
  const vnode = {
    __v_isvnode: true,
    type,
    props,
    children,
    key: props?.key, // diff 算法需要的key
    el: null, //   虚拟节点对应的真实节点
    shapeFlag,
    ref:props?.ref,
  };

  if (children) {
    if (Array.isArray(children)) {
      vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
    } else if (isObject(children)) {
      vnode.shapeFlag |= ShapeFlags.SLOTS_CHILDREN; // 组件的孩子
    } else {
      children = String(children);
      vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
    }
  }

  return vnode;
}
