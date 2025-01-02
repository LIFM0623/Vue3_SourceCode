import { currentInstance } from './component';
export function provide(key, value) {
  if (!currentInstance) {
    return;
  }

  const parentProvide = currentInstance.parent?.provides; // 获取父组件的provide

  let provides = currentInstance.provides; // 初始化provide

  if (parentProvide === provides) {
    // 如果再子组件上新增了 provides  需要拷贝一份
    provides = currentInstance.provide = Object.create(provides);
  }
  provides[key] = value;
}

export function inject(key, defaultValue) {
  // 建立再组件基础上
  if (!currentInstance) {
    return;
  }

  const provides = currentInstance.parent?.provides;
  if (provides && key in provides) {
    return provides[key]; // 直接从provides中取值使用
  } else {
    return defaultValue; // 默认的inject
  }
}
