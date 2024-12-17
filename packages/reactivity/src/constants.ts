export enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive' // 基本上唯一
}

export enum DirtyLevels {
  Dirty = 4,  // 脏值， 取值需要运行计算属性
  NoDirty = 0  // 不脏就使用上一次返回的结果
}
