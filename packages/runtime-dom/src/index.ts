export * from '@vue/reactivity';

import { nodeOps } from './nodeOps';
import { patchProp } from './patchProp';

const renderOptions = Object.assign(nodeOps, patchProp);
function createRenderer() {}


// createRenderer(renderOptions).render()
