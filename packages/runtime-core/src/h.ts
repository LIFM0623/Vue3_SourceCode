import { isObject, isString, ShapeFlags } from '@vue/shared';
import { createVnode, isVode } from './createVnode';

export function h(type, propsOrChildren?, children?) {
  const l = arguments.length;
  if (l === 2) {
    if (isObject(propsOrChildren) && !Array.isArray(propsOrChildren)) {
      // 虚拟节点
      if (isVode(propsOrChildren)) {
        return createVnode(type, null, [propsOrChildren]);
      } else {
        // 属性
        return createVnode(type, propsOrChildren);
      }
    }
    // 数组或者儿子
    return createVnode(type, null, propsOrChildren);
  } else {
    if (l > 3) {
      children = Array.from(arguments).slice(2);
    } else if (l === 3 && isVode(children)) {
      children = [children];
    }

    return createVnode(type, propsOrChildren, children);
  }
}
