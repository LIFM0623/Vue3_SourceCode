// 问题： 我们为啥需要用Reflect  需要捋一下
const person = {
  _name: 'arrebol',
  get name() {
    return this._name;
  }
};

// console.log(person.name);

const prosonProxy = new Proxy(person, {
  get(target, key, receiver) {  //reaceiver 是代理对象
    console.log(key);
    // 改变了 this指向  之后再检测的时候可以检测到_name 而如果我们使用target[key] 则不会触发get，也检测不到_name
    return Reflect.get(target,key,receiver)  // receiver[key] //   死循环 // target[key]; // person.name 不会出发get 
  }
});

console.log(prosonProxy.name);
