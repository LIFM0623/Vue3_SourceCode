import { ShapeFlags } from '@vue/shared';

export const Teleport = {
  __isTeleport: true,
  remove(vnode, unmountChildren) {
    const { shapeFlag } = vnode;
    if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(vnode.children);
    }
  },
  process(n1, n2, container, anchor, internals) {
    let { mountChildren, patchChildren, move } = internals;

    // n1  n2 关系
    if (!n1) {
      // 挂载
      const target = (n2.target = document.querySelector(n2.props.to));
      if (target) {
        mountChildren(n2.children, target);
      }
    } else {
      patchChildren(n1, n2, n2.target);
      if (n2.props.to !== n1.props.to) {
        const nextTarget = document.querySelector(n2.props.to);
        n2.children.forEach((child) => {
          move(child, nextTarget, anchor);
        });
      }
    }
  }
};

export const isTeleport = (value) => value.__isTeleport;
