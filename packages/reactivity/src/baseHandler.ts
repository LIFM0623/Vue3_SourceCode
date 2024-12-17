import { isObject } from '@vue/shared';
import { activeEffect } from './effect';
import { track, trigger } from './reactiveEffect';
import { reactive } from './reactive';
import { ReactiveFlags } from './constants';

// proxy 需要搭配 reflect 来使用
export const mutableHandlers: ProxyHandler<any> = {
  get(target, key, recevier) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }

    //依赖收集todo....
    track(target, key); //收集这个对象上的这个属性，和effect关联再一起

    let res = Reflect.get(target, key, recevier);
    if (isObject(res)) {  // 当取得值也是对象的时候  需要对这个对象进行递归代理
      return reactive(res);
    }

    // 当取值的时候 哟ing该让响应式属性和effect 映射出来
    // 此处需要查看 somequestions/01.js
    return res;
  },
  set(target, key, value, recevier) {
    // 触发更新todo....

    let oldValue = target[key];
    let result = Reflect.set(target, key, value, recevier);
    if (oldValue !== value) {
      // 需要触发页面更新
      Reflect.set(target, key, value, recevier);
      trigger(target, key, value, oldValue);
    }

    // 找到属性 应该让对应的属性和effect 重新执行
    return result;
  }
};
