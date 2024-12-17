import { DirtyLevels } from './constants';

export function effect(fn, options?) {
  // 创建一个响应式effect 数据变化后可以重新执行

  // 创建一个effect,只要依赖的属性变化了就需要重新执行
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });
  _effect.run();
  if (options) {
    Object.assign(_effect, options); // 用用户传递的覆盖掉内置的
  }

  const runner = _effect.run.bind(_effect);
  runner.effect = _effect; // 可以在run方法上获取到到effect的引用
  return runner; //外界可以自己让其重新run
}

export let activeEffect;

function preCleanEffect(effect) {
  effect._depsLength = 0;
  effect._trackId++; // 每次执行id 都是+1 ，如果当前同一个effect执行，id就是相同的
}

function postCleanEffect(effect) {
  // [flag,age,xxx,bbb,ccc]
  // [flag] -> effect._depsLength = 1
  if (effect.deps.length > effect._depsLength) {
    for (let i = effect._depsLength; i < effect.deps.length; i++) {
      cleanDepEffect(effect.deps[i], effect); // 删除映射表中对应的effect
    }
    effect.deps.length = effect._depsLength; // 更新依赖列表的长度
  }
}

// effectScope。stop()  停止所有的effect 不参加响应式处理
export class ReactiveEffect {
  _trackId = 0; // 用于记录当前effect 执行了几次
  deps = [];
  _depsLength = 0;
  _running = 0; // 防止 effect 中递归嵌套
  _dirtyLevel = DirtyLevels.Dirty; // coumputed 计算属性dirty标识

  public active = true; // 默认创建的effect 是响应式的
  // fn 用户编写的函数    scheduler fn 依赖的数据发生变化时执行 -> run()
  constructor(public fn, public scheduler) {}

  public get dirty() {
    return this._dirtyLevel === DirtyLevels.Dirty;
  }

  public set dirty(value) {
    this._dirtyLevel = value ? DirtyLevels.Dirty : DirtyLevels.NoDirty;
  }

  run() {
    this._dirtyLevel = DirtyLevels.NoDirty; // 每次运行后effect变为no_dirty
    // 不是激活的，执行后，什么都不做
    if (!this.active) {
      // 让 fn 执行
      return this.fn();
    }
    let lastEffect = activeEffect;
    try {
      activeEffect = this;

      // effect执行之前 需要将上一次的依赖情况 effect.deps
      preCleanEffect(this);
      this._running++;
      // 依赖收集 -> 响应式取值
      return this.fn();
    } finally {
      this._running--;
      postCleanEffect(this);
      activeEffect = lastEffect;
    }
  }
  stop() {
    if (this.active) {
      this.active = false;
      preCleanEffect(this);
      postCleanEffect(this);
    }
  }
}

// 双向记忆
// 1. _trackId 用于记录执行次数（防止一个属性在当前effect中多次依赖收集）只收集一次
// 2.拿到上一次依赖的最后一个和这次的进行比较
// {flag,name}
// {flag，age}

function cleanDepEffect(dep, effect) {
  dep.delete(effect);
  if (dep.size === 0) {
    // map为空 直接删除这个属性
    dep.cleanup();
  }
}

export function trackEffect(effect, dep) {
  // 收集一个个收集

  // 需要重新去收集依赖 将不需要的依赖移除

  if (dep.get(effect) !== effect._trackId) {
    dep.set(effect, effect._trackId); // 更新id  优化掉多余的收集

    let oldDep = effect.deps[effect._depsLength];
    // 如果没有存过
    if (oldDep !== dep) {
      if (oldDep) {
        // 删除掉老的
        cleanDepEffect(oldDep, effect);
      }
      // 换成新的
      effect.deps[effect._depsLength++] = dep; // 永远安装本次最新的来存放
    } else {
      effect._depsLength++;
    }
  }

  // oldVersion: 没有计划依赖移除的逻辑
  // dep.set(effect, effect._trackId);
  // // 我还想让effect 和 dep 关联起来
  // effect.deps[effect._depsLength] = dep;
}

export function triggerEffects(dep) {
  for (const effect of dep.keys()) {
    // 当前这个值是不脏的，但是触发更新需要将值变为脏的
    // 属性依赖了计算属性 需要让计算属性dirty在变为 true
    if (effect._dirtyLevel < DirtyLevels.Dirty) {
      effect._dirtyLevel = DirtyLevels.Dirty;
    }

    if (effect.scheduler) {
      if (!effect._running) {
        // 如果不是正在执行 才能执行
        effect.scheduler(); // ->effect.run()
      }
    }
  }
}
