import { currentInstance, setCurrentInstance, unsetCurrentInstance } from './component';

export const enum LifeCycles {
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  BEFORE_UPDATE = 'bu',
  UPDATED = 'u'
}

function createHook(type) {
  // 闭包 将当前实例存到了词钩子上
  return (hook, target = currentInstance) => {
    if (target) {
      const hooks = target[type] || (target[type] = []);

      // 让currentInstance  存到函数内
      const wraphook = () => {
        // 在钩子执行前对实例进行矫正
        setCurrentInstance(target);
        hook.call();
        unsetCurrentInstance()
      };

      // 在执行函数内部保证实例正确
      hooks.push(wraphook); // 这里有坑因为 setup 执行完毕后 会将instance清空
    }
  };
}

export const onBeforeMount = createHook(LifeCycles.BEFORE_MOUNT);
export const onMounted = createHook(LifeCycles.MOUNTED);
export const onBeforeUpdate = createHook(LifeCycles.BEFORE_UPDATE);
export const onUpdated = createHook(LifeCycles.UPDATED);

export function invokeArray(fns) {
  for (let i = 0; i < fns.length; i++) {
    fns[i]();
  }
}
