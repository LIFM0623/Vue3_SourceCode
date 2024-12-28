const queue = []; // 缓存队列
let isFlush = false; // 标识是否正在刷新队列
const resolvePromise = Promise.resolve();

// 一个组件更新多个状态 执行的job应该是同一个
// 同时开启一个一部任务
export function queueJob(job) {
  if (!queue.includes(job)) {
    // 去除同名job
    queue.push(job); //任务入队
  }
  if (!isFlush) {
    isFlush = true;
    resolvePromise.then(() => {
      isFlush = false;
      const copy = queue.slice(0); // 拷贝一份
      queue.length = 0; // 清空队列
      
      copy.forEach((job) => job());
      copy.length = 0; // 清空拷贝的队列
    });
  }
}
