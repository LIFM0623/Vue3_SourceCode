import { createRenderer } from '@vue/runtime-core';

import { nodeOps } from './nodeOps';
import patchProp from './patchProp';

// 将节点操作和属性操作合并
const renderOptions = Object.assign({ patchProp }, nodeOps);

// render 方法采用domApi 来进行渲染
export const render = (vnode, container) => {
  createRenderer(renderOptions).render(vnode, container);
}

// runtime-dom -> runtime-core -> reactivity
export * from '@vue/runtime-core';

