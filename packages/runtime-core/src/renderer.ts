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

  const mountElement = (vnode, container, anchor) => {
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

    // hostSetElementText(el, children);
    hostInsert(el, container, anchor);
  };

  const processElement = (n1, n2, container, anchor) => {
    if (n1 === null) {
      // 初始化操作
      mountElement(n2, container, anchor);
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

  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      let el = children[i].el;
      unmount(el);
    }
  };

  // 比较两个儿子的差异 来更新dom元素
  const patchKeyedChildren = (c1, c2, el) => {
    // appendChild  removeChild insertBefore
    // 方案：
    // 1. 减少比对范围 先从头开始比对，在从尾开始比较 确定不一样的范围
    // 2. 从头比对 再从尾巴比对 如果有多余的或者新增的直接操作即可

    let i = 0; // 开始比对的索引
    let e1 = c1.length - 1; // 第一个数组的尾部索引
    let e2 = c2.length - 1; // 第二个数组的尾部索引

    while (i <= e1 && i <= e2) {
      // 有一方循环结束 就要终止比较
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVode(n1, n2)) {
        patch(n1, n2, el); // 更新当前节点的属性和儿子 递归比较子节点
      } else {
        break;
      }
      i++;
    }

    while (i <= e1 && i <= e2) {
      // 有一方循环结束 就要终止比较
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVode(n1, n2)) {
        patch(n1, n2, el); // 更新当前节点的属性和儿子 递归比较子节点
      } else {
        break;
      }
      e1--;
      e2--;
    }

    // 处理增加 或 删除 的特殊情况
    if (i > e1) {
      // 新的多
      if (i <= e2) {
        // 有插入部分
        const nextPos = e2 + 1; // 看下当前下一个元素是否存在
        const anchor = c2[nextPos] ? c2[nextPos].el : null;
        while (i <= e2) {
          patch(null, c2[i], el, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      if (i <= e1) {
        while (i <= e1) {
          unmount(c1[i]); // 删除元素
          i++;
        }
      }
    } else {
      // 最终比对乱序情况  特殊比对方式
      let s1 = i; // 老的头
      let s2 = i; // 新的头

      const ketToNewIndexMap = new Map(); // 新的索引和key的映射关系  快速查找老的是否在新的里边存在
      for (let i = s2; i <= e2; i++) {
        const vnode = c2[i];
        ketToNewIndexMap.set(vnode.key, i);
      }

      for (let i = s1; i <= e1; i++) {
        const vnode = c1[i];
        const newIndex = ketToNewIndexMap.get(vnode.key); // 通过key找到对应的索引

        if (newIndex == undefined) {
          // 如果新的里边找不到说明老的要删除
          unmount(vnode);
        } else {
          // 比较前后节点差异 更新属性和儿子
          patch(vnode, c2[newIndex], el); //复用
        }
      }
      // 调整顺序
      // 按照新的队列 倒序插入
      let toBePatched = e2 - s2 + 1; // 要倒叙插入的元素个数
      for (let i = toBePatched - 1; i >= 0; i--) {
        const newIndex = c2[s2 + i]; // 把它作为参照物 进行插入
        const anchor = c2[newIndex + 1]?.el;
        const vnode = c2[newIndex];
        if (!vnode.el) {
          // 列表中新增的元素
          patch(null, vnode, el, anchor); 
        } else {
          hostInsert(vnode.el, el, anchor);  // 倒序插入
        }
      }
    }
  };

  const patchChildren = (n1, n2, el) => {
    // text array null
    const c1 = n1.children;
    const c2 = n2.children;

    const preShaprFlag = n1.shapeFlag;
    const shapeFlag = n2.shapeFlag;

    //.1.新的是文本 老的是数组移除
    //2.新的是文本 老的也是文本，内容不相同替换
    //3.老的是数组，新的是数组，全量 diff·算法
    //4.老的是数组,新的不是数组，移除者的子节点
    //5.老的是文本新的是空
    //6.老的是文本新的是数组

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (preShaprFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1);
      }
      if (c1 !== c2) {
        hostSetElementText(el, c2);
      }
    } else {
      if (preShaprFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 全量diff  算法 两个数组比对

          patchKeyedChildren(c1, c2, el);
        } else {
          unmountChildren(c1);
        }
      } else {
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el, '');
        }
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el);
        }
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
    // 比较儿子
    patchChildren(n1, n2, el);
  };

  // 渲染走这里 更新也走这里
  const patch = (n1, n2, container, anchor = null) => {
    if (n1 === n2) return; // 两次渲染同一个元素 直接跳过

    // 直接移除老的dom元素 初始化新的dom元素
    if (n1 && !isSameVode(n1, n2)) {
      unmount(n1);
      n1 = null; // 就会执行后续n2的初始化
    }
    // n1.shapeFlag
    processElement(n1, n2, container, anchor); // 对元素处理
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
