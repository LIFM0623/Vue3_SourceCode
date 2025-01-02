import { hasOwn, ShapeFlags } from '@vue/shared';
import { Fragment, isSameVode, Text } from './createVnode';
import getSequence from './seq';
import { reactive, ReactiveEffect } from '@vue/reactivity';
import { queueJob } from './scheduler';
import { createComponentInstance, setupComponent } from './component';

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

  // vue3 中分为两种 全量diff(递归diff)  快速diff(靶向更新)->基于模板定义
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

      const ketToNewIndexMap = new Map(); // 新的索引和key的映射关系  快速查找老的是否在新的里边存在、
      let toBePatched = e2 - s2 + 1; // 要倒叙插入的元素个数

      let newIndexToOldMapIndex = new Array(toBePatched).fill(0); // 新的索引和老的索引的映射关系  快速查找老的在新的里边的位置

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
          // 我们的 i  可能是0的情况 为了保证0 是代表没有比对过的 没有歧义
          newIndexToOldMapIndex[newIndex - s2] = i + 1; // 老的索引和新的索引的映射关系  快速查找新的在老的里边的位置
          patch(vnode, c2[newIndex], el); //复用
        }
      }
      // 调整顺序
      // 按照新的队列 倒序插入

      let increasingSeq = getSequence(newIndexToOldMapIndex); // 最长递增子序列
      let j = increasingSeq.length - 1; // 最长递增子序列的索引

      for (let i = toBePatched - 1; i >= 0; i--) {
        const newIndex = c2[s2 + i]; // 把它作为参照物 进行插入
        const anchor = c2[newIndex + 1]?.el;
        const vnode = c2[newIndex];
        if (!vnode.el) {
          // 列表中新增的元素
          patch(null, vnode, el, anchor);
        } else {
          if (i == increasingSeq[j]) {
            j--; // diff 通过 最大递增子序列进行优化
          } else {
            hostInsert(vnode.el, el, anchor); // 倒叙插入
          }
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

  const processText = (n1, n2, container) => {
    if (n1 === null) {
      // 虚拟节点关联真实节点  将节点插入页面中
      n2.el = hostCreateText(n2.children);
      hostInsert(n2.el, container);
    } else {
      const el = (n2.el = n1.el);
      if (n1.children !== n2.children) {
        hostSetText(el, n2.children);
      }
    }
  };

  const processFragment = (n1, n2, container) => {
    if (n1 === null) {
      mountChildren(n2.children, container);
    } else {
      patchChildren(n1, n2, container);
    }
  };

  const updateComponentPreRender = (instance, next) => {
    instance.next = null;
    instance.vnode = next; // instane.props
    updateProps(instance, instance.props, next.props);
  };

  function setupRenderEffect(instance, container, anchor) {
    const { render } = instance;
    const componentUpdateFn = () => {
      // 区分 首次还是之后的更新
      if (!instance.isMounted) {
        const subTree = render.call(instance.proxy, instance.proxy);
        instance.subTree = subTree;
        patch(null, subTree, container, anchor);
        instance.isMounted = true;
      } else {
        // 基于状态的组件更新

        const { next } = instance;
        if (next) {
          // 更新属性和插槽
          updateComponentPreRender(instance, next);
        }

        const subTree = render.call(instance.proxy, instance.proxy);
        patch(instance.subTree, subTree, container, anchor);
        instance.subTree = subTree;
      }
    };

    const effect = new ReactiveEffect(componentUpdateFn, () =>
      queueJob(update)
    );

    const update = (instance.update = () => {
      effect.run();
    });

    update();
  }

  const mountComponent = (vnode, container, anchor) => {
    // 1. 先创建组件实例
    // 2. 给实例的属性赋值
    // 3. 创建一个effect

    const instance = (vnode.component = createComponentInstance(vnode));

    setupComponent(instance);

    setupRenderEffect(instance, container, anchor);
  };

  const haspropsChange = (prevProps, nextProps) => {
    if (Object.keys(nextProps).length !== Object.keys(prevProps).length) {
      return true;
    }
    for (let i = 0; i < Object.keys(nextProps).length; i++) {
      const key = Object.keys(nextProps)[i];
      if (nextProps[key] !== prevProps[key]) {
        return true;
      }
    }
    return false;
  };

  const updateProps = (instance, prevProps, nextProps) => {
    if (haspropsChange(prevProps, nextProps)) {
      // 看属性是否存在变化
      for (let key in nextProps) {
        // 新的覆盖所有老的
        instance.props[key] = nextProps[key];
      }
      for (let key in instance.props) {
        // 删除多余的老的
        if (!(key in nextProps)) {
          delete instance.props[key];
        }
      }
    }
  };

  const shouldComponentUpdate = (n1, n2) => {
    const { props: prevProps, children: prevChildren } = n1;
    const { props: nextProps, children: nextChildren } = n2;

    if (prevChildren || nextChildren) return true; // 有插槽直接走重新渲染

    if (prevProps === nextProps) return false;

    return haspropsChange(prevProps, nextProps); // 属性不一致直接更新
  };

  const updateComponent = (n1, n2) => {
    const instance = (n2.component = n1.component); // 复用组件实例

    if (shouldComponentUpdate(n1, n2)) {
      instance.next = n2; // 如果调用update  有next属性 说明是属性更新，插槽更新
      instance.update(); // 让更新逻辑统一
    }

    // const { props: prevProps } = n1;
    // const { props: nextProps } = n2;
    // updateProps(instance, prevProps, nextProps);
  };

  const processCompoent = (n1, n2, container, anchor) => {
    if (n1 === null) {
      mountComponent(n2, container, anchor);
    } else {
      // 组件更新
      updateComponent(n1, n2);
    }
  };

  // 渲染走这里 更新也走这里
  const patch = (n1, n2, container, anchor = null) => {
    if (n1 === n2) return; // 两次渲染同一个元素 直接跳过

    // 直接移除老的dom元素 初始化新的dom元素
    if (n1 && !isSameVode(n1, n2)) {
      unmount(n1);
      n1 = null; // 就会执行后续n2的初始化
    }

    // type
    const { type, shapeFlag } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container);
        break;
      case Fragment:
        processFragment(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor); // 对元素处理
        } else if (shapeFlag & ShapeFlags.TELEPORT) {
          type.process(n1, n2, container, anchor,{
            mountChildren,
            patchChildren,
            move(vnode,container,anchor){
              // 此方法将组件或者dom元素移动到指定位置
              hostInsert(vnode.component?vnode.component.subTree.el:vnode.el,container,anchor)
            }
          });
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          // 对组件进行处理 vue3函数时组件 废弃了 没有性能节约
          processCompoent(n1, n2, container, anchor);
        }
    }
  };

  const unmount = (vnode) => {
    const { shapeFlag } = vnode;
    if (vnode.type === Fragment) {
      unmountChildren(vnode.children);
    } else if (shapeFlag && ShapeFlags.COMPONENT) {
      unmount(vnode.component.subTree);
    } else if (shapeFlag & ShapeFlags.TELEPORT) {
      vnode.type.remove(vnode,unmountChildren)
    }
    else {
      hostRemove(vnode.el);
    }
  };
  // 多次调用 render 会进行虚拟节点得比较 再进行更新
  const render = (vnode, container) => {
    if (vnode === null) {
      // 我要移除容器中的dom 元素
      if (container._vnode) {
        unmount(container._vnode);
      }
    } else {
      // 将虚拟节点变成正是节点进行渲染
      patch(container._vnode || null, vnode, container);
      container._vnode = vnode;
    }
  };

  return {
    render
  };
}
