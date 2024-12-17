import { isFunction } from '@vue/shared';
import { ReactiveEffect } from './effect';
import { trackRefValue, triggerRefValue } from './ref';

class ComputedRefImpl {
  public _value;
  public effect;
  public dep;
  constructor(getter, public setter) {
    // 我们需要创建一个effect 来管理当前计算属性的dirty属性
    this.effect = new ReactiveEffect(
      () => getter(this._value), // 用户的fn state.name
      () => {
        // 计算属性依赖的值发生变化 我们应该触发 渲染effect 重新执行
        triggerRefValue(this); // 依赖的属性变化后需要触发重新渲染，还需要将dirty 变为true
      }
    );
  }
  get value() {  // 让计算属性收集effect
    // 我们需要做额外处理
    if (this.effect.dirty) {
      // 默认取值一定是脏的 但是执行一次run之后就不脏了
      this._value = this.effect.run();
        
      // 如果当前在effect 中访问了计算属性，这个计算属性也要收集这个effect的
      trackRefValue(this);
    }
    return this._value;
  }
  set value(value) {
    // 这个就是ref的setter
    this.setter(value);
  }
}
export function computed(getterOrOptions) {
  let onlyGetter = isFunction(getterOrOptions);
  let getter;
  let setter;
  if (onlyGetter) {
    getter = getterOrOptions;
    setter = () => {};
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }

  // 计算属性ref
  return new ComputedRefImpl(getter, setter);
}
