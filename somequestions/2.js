// 最长递增子序列概念

//  c d e    2 3 4
// e c d h   4 2 3 0 // 0 表示 以前不存在

// [c,d]
// [0,1] 通过上边两个子序列 可以求出最终这样的结果 就可以保证某些元素不用动

// 需求 连续性最强的子序列
// 贪心算法 + 二分查找

// 2 3 1 5 6 8 7 9 4 -> 求最长子序列的个数

function getSequence(arr) {
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
        s;
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

console.log(getSequence([2, 6, 7, 8, 9, 11]));
console.log(getSequence([2, 3, 1, 5, 6, 8, 7, 9, 4]));
