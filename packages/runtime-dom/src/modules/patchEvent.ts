function createInvoker(value) {
  const invoker = (e) => {
    invoker.value(e);
  };
  invoker.value = value; // 更改invoke中得value属性 可以修改对应得调用函数
  return invoker;
}
export default function patchEvent(el, name, nextValue) {
  // vue_event_invoker
  const invokers = el._vei || (el._vei = {}); // 缓存事件

  const eventName = name.slice(2).toLowerCase(); // 事件名称

  const exisitingInvokers = invokers[name]; //是否存在同名得时间绑定

  if (exisitingInvokers && nextValue) {
    return (exisitingInvokers.value = nextValue); // 事件换绑
  }

  if (nextValue) {
    const invoker = (invokers[name] = createInvoker(nextValue)); //  创建一个调用函数并且内部...
    return el.addEventListener(eventName, invoker);
  }
  if (exisitingInvokers) {
    invokers[name] = undefined;
    el.removeEventListener(eventName, exisitingInvokers); // 移除事件
  }
}
