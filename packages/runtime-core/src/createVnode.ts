import { isString, ShapeFlags } from "@vue/shared";

export function isVode(value) {
  return value?.__v_isvnode;
}

export function createVnode(type, props, children?) {
  const shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0;
  const vnode = {
    __v_isvnode: true,
    type,
    props,
    children,
    key: props?.key, // diff 算法需要的key
    el: null, //   虚拟节点对应的真实节点
    shapeFlag
  };

  if (children) {
    if (Array.isArray(children)) {
      vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
    } else {
      children = String(children);
      vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
    }
  }

  return vnode;
}
