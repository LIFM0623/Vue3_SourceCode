export default function getSequence(arr) {
    const result = [0];
    const p = result.slice(0); // 用来存放索引
    const len = arr.length; // 数组长度
    let start, end, middle;
    for (let i = 0; i < len; i++) {
      const arrI = arr[i];
      // 为了 vue3 对处理数组中的 0 做特殊处理
      if (arrI !== 0) {
        // 拿出数组的最后一项 和 我们当前的这一项做比对
        const resultLastIndex = result[result.length - 1];
  
        if (arr[resultLastIndex] < arrI) {
          // 当数组的最后一项 比 当前项小的时候
          p[i] = result[result.length - 1]; // 把当前项的前一项的索引放到数组中
          result.push(i); // 把当前项的索引放到数组中
          continue;
        }
      }
      // 二分查找
      start = 0;
      end = result.length - 1;
      while (start < end) {
        // 找到中间位置
        middle = ((start + end) / 2) | 0;
        if (arr[result[middle]] < arrI) {
          start = middle + 1;
        } else {
          end = middle;
        }
      }
      // 找到中间位置后 要进行替换
      if (arrI < arr[result[start]]) {
        p[i] = result[start - 1]; // 要将他的前一项 放到 p 数组中
        result[start] = i;
      }
    }
  
    // 需要创建一个 前驱节点 进行倒序追溯（因为最后一项 肯定不会错） p
    let l = result.length; 
    let last = result[l - 1];  // 取出最后一项
    while (l-- > 0) {
      result[l] = last;
      last = p[last];
    }
    return result;
  }
