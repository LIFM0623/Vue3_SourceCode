import { reactive } from '@vue/reactivity';
import { hasOwn, isFunction } from '@vue/shared';

export function createComponentInstance(vnode) {
  const instance = {
    data: null,
    vnode,
    subTree: null,
    isMounted: false,
    update: null,
    props: {},
    attrs: {},
    propsOptions: vnode.type.props || {}, // 用户声明的哪些属性是组件属性
    component: null,
    proxy: null // 用来代理 props attrs data 让用户更方便的使用
  };
  return instance;
}

const initProps = (instance, rawProps) => {
  const props = {};
  const attrs = {};
  const propsOptions = instance.propsOptions || {};

  if (rawProps) {
    for (let key in rawProps) {
      const value = rawProps[key]; // value 校验
      if (key in propsOptions) {
        props[key] = value; // props 不需要深度代理 组件不能更改props
      } else {
        attrs[key] = value;
      }
    }
  }
  instance.props = reactive(props);
  instance.attrs = attrs;
};

// 代理对象
const publicProperty = {
  $attrs: (instance) => instance.attrs
  // ...
};
const handler = {
  get(target, key) {
    const { props, data } = target;
    if (data && hasOwn(data, key)) {
      return data[key];
    } else if (props && hasOwn(props, key)) {
      return props[key];
    }

    // 对于一些无法修改的属性 $slots $attrs
    const getter = publicProperty[key];
    if (getter) {
      return getter(target);
    }
  },
  set(target, key, value) {
    const { props, data } = target;
    if (data && hasOwn(data, key)) {
      data[key] = value;
    } else if (props && hasOwn(props, key)) {
      // props[key] = value;
      console.warn('Props are read-only.');
      return false;
    }
    return true;
  }
};
export function setupComponent(instance) {
  const { vnode } = instance;
  // 元素更新 n2.el = n1.el
  // 组件更新 n2.component.subTree.el = n1.component.subTree.el;
  initProps(instance, vnode.props);
  // 赋值代理对象
  instance.proxy = new Proxy(instance, handler);
  const { data, render } = vnode.type;
  if (data && isFunction(data)) {
    // data 中可以拿到props
    instance.data = reactive(data.call(instance.proxy));
  } else {
    console.warn('data option must be a function');
  }
  instance.render = render;
}
