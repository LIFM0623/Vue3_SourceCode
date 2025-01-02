import { proxyRefs, reactive } from '@vue/reactivity';
import { hasOwn, isFunction, ShapeFlags } from '@vue/shared';

export function createComponentInstance(vnode, parent) {
  const instance = {
    data: null,
    vnode,
    subTree: null,
    isMounted: false,
    update: null,
    props: {},
    attrs: {},
    slots: {}, // 组件的插槽
    propsOptions: vnode.type.props || {}, // 用户声明的哪些属性是组件属性
    component: null,
    proxy: null, // 用来代理 props attrs data 让用户更方便的使用
    setupState: {},
    exposed: null,
    parent,
    // p1 -> p2 -> p3
    // 所有的组件provide 都一样
    provides: parent ? parent.provides : Object.create(null),  // 这样创建的 obj 没有原型链
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
  $attrs: (instance) => instance.attrs,
  $slots: (instance) => instance.slots
  // ...
};
const handler = {
  get(target, key) {
    const { props, data, setupState } = target;
    if (data && hasOwn(data, key)) {
      return data[key];
    } else if (props && hasOwn(props, key)) {
      return props[key];
    } else if (setupState && hasOwn(setupState, key)) {
      return setupState[key];
    }

    // 对于一些无法修改的属性 $slots $attrs
    const getter = publicProperty[key];
    if (getter) {
      return getter(target);
    }
  },
  set(target, key, value) {
    const { props, data, setupState } = target;
    if (data && hasOwn(data, key)) {
      data[key] = value;
    } else if (props && hasOwn(props, key)) {
      // props[key] = value;
      console.warn('Props are read-only.');
      return false;
    } else if (setupState && hasOwn(setupState, key)) {
      setupState[key] = value;
    }
    return true;
  }
};

export const initSlots = (instance, children) => {
  if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    instance.slots = children;
  } else {
    instance.slots = {};
  }
};
export function setupComponent(instance) {
  const { vnode } = instance;
  // 元素更新 n2.el = n1.el
  // 组件更新 n2.component.subTree.el = n1.component.subTree.el;
  initProps(instance, vnode.props);
  // 初始化插槽
  initSlots(instance, vnode.children);
  // 赋值代理对象
  instance.proxy = new Proxy(instance, handler);
  const { data = () => {}, render, setup } = vnode.type;

  if (setup) {
    const setupContext = {
      slots: instance.slots,
      attrs: instance.attrs,
      expose: (value) => {
        instance.exposed = value;
      },
      emit: (event, ...payload) => {
        const eventName = `on${event[0].toUpperCase()}${event.slice(1)}`;
        const handler = instance.vnode.props[eventName];
        handler && handler(...payload);
      }
    };

    const setupResult = setup(instance.props, setupContext);
    if (isFunction(setupResult)) {
      instance.render = setupResult;
    } else {
      instance.setupstate = proxyRefs(setupResult); // 返回值脱REF
    }
  }

  if (data && isFunction(data)) {
    // data 中可以拿到props
    instance.data = reactive(data.call(instance.proxy));
  } else {
    console.warn('data option must be a function');
  }
  if (!instance.render) {
    // 没有render
    instance.render = render;
  }
}
