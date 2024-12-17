import { activeEffect, trackEffect, triggerEffects } from './effect';

// 依赖收集存储结构
// Map：{obj:{属性：Map：{effect,effect，effect}}}
const targetMap = new WeakMap(); // 存放依赖收集关系

export const createDep = (cleanup, key) => {
  const dep = new Map() as any; // 创建的收集器还是一个map
  dep.cleanup = cleanup;
  dep.name = key; // 自定义的为了标识这个映射表 是给哪个属性服务的
  return dep;
};

export function track(target, key) {
  // activeEffect 有这个属性 说明 key 是再effect中访问的 ，没有说明再effect 之外访问的不用进行收集
  if (activeEffect) {
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      // 新增
      targetMap.set(target, (depsMap = new Map()));
    }

    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(
        key,
        (dep = createDep(() => {
          //后边用于清理不需要的属性
          depsMap.delete(key);
        }, key))
      );
    }

    // 将当前的effect放入到dep(依赖映射表)中，后续根据值的变化去出发存放的effect
    trackEffect(activeEffect, dep);
  }
}

export function trigger(target, key, newValue, oldValue) {
    const depsMap = targetMap.get(target)
    if (!depsMap) return  // 找不到·对象，直接返回
    let dep = depsMap.get(key)
    if(dep){
        triggerEffects(dep)
    }
}
