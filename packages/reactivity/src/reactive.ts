import { isObject } from '@vue/shared';
import { mutableHandlers } from './baseHandler';
import { ReactiveFlags } from './constants';

// 用于记录缓存代理后的结果 可以复用
const reactiveMap = new WeakMap();

function createReactiveObject(target) {
  // 统一判断，响应式对象必须是对象才可以
  if (!isObject(target)) {
    return;
  }

  // 防止嵌套重复代理
  if (target[ReactiveFlags.IS_REACTIVE]) {
    //我访问Proxy 属性是他就会自动拦截命中他的 get 方法
    return target;
  }

  // 取缓存，判断缓存中是否有当前对象的的结果
  const exitsProxy = reactiveMap.get(target);
  if (exitsProxy) {
    return exitsProxy;
  }

  let proxy = new Proxy(target, mutableHandlers);
  // 根据对象缓存代理后的结果
  reactiveMap.set(target, proxy);
  return proxy;
}

export function reactive(target) {
  return createReactiveObject(target);
}

export function toReactive(value) {
  return isObject(value) ? reactive(value) : value;
}

export function isReactive(value) {
  return !!(value && value[ReactiveFlags.IS_REACTIVE]);
}
