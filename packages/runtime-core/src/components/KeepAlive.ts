import { getCurrentInstance } from '../component';
import { onMounted, onUpdated } from '../apiLifecycle';
import { ShapeFlags } from '@vue/shared';

export const KeepAlive = {
  __isKeepAlive: true,
  props: {
    max: Number
  },
  setup(props, { slots }) {
    const { max } = props;
    const keys = new Set(); // 用来记录哪些组件缓存过
    const cache = new Map(); // 缓存表  <keep-alive key="a">
    // 在这个组件中需要一些dom方法 可以将元素移动到一个div中
    // 还可以卸载某个元素

    let pendingCacheKey = null;
    const instance = getCurrentInstance();

    const cacheSubTree = () => {
      // 做到映射表里边
      cache.set(pendingCacheKey, instance.subTree); // 缓存组件的虚拟节点 里边有组件的dom元素
    };

    // 这里是keepalive 特有的初始化方法
    // 激活时执行
    const { move, createElement, unmount: _unmount } = instance.ctx.renderer;

    function unmount(vnode) {
      // 去除vnode 标识
      let shapeFlag = vnode.shapeFlag;
      if (shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
        shapeFlag -= ShapeFlags.COMPONENT_KEPT_ALIVE;
      }
      if (shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
        shapeFlag -= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE;
      }
      vnode.shapeFlag = shapeFlag;

      _unmount(vnode);
    }

    function purneCacheEntry(key) {
      keys.delete(key);
      const cached = cache.get(key);
      // 还原vnode 上标识 否则无法走移除逻辑
      unmount(cached);
    }

    instance.ctx.activate = function (vnode, container, anchor) {
      move(vnode, container, anchor); //将元素直接移入到容器中
    };
    // 卸载时候执行
    const storageContent = createElement('div');
    instance.ctx.deactivate = function (vnode) {
      move(vnode, storageContent, null); // dom元素临时移动导这个div中 但是没有被销毁
    };

    onMounted(cacheSubTree);
    onUpdated(cacheSubTree);

    // 缓存组件-> 组件有subTree -> subTree上有el元素 -> 移动到页面中

    return () => {
      // process
      const vnode = slots.default();

      const comp = vnode.type;

      const key = vnode.key == null ? comp : vnode.key;

      const cacheVNode = cache.get(key);
      pendingCacheKey = key;
      if (cacheVNode) {
        // 不要在重新创建组件的实例  直接服用即可
        vnode.component = cacheVNode.component;
        // 告诉他不要做初始化操作
        vnode.shapeFlag |= ShapeFlags.COMPONENT_KEPT_ALIVE;

        // 刷新缓存
        keys.delete(key);
        keys.add(key);
      } else {
        keys.add(key);
        if (max && keys.size > max) {
          // 说明达到了最大得缓存个数
          // set中第一个元素 keys.values().next().value
          purneCacheEntry(keys.values().next().value);
        }
      }

      // 这个组件不需要真的卸载 卸载得dom 临时放到了存储容器中存放
      vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE;

      return vnode; // 等待组件加载完毕之后再去缓存
    };
  }
};

export const isKeepAlive = (value) => value.type.__isKeepAlive;
