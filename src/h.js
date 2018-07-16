import {isArray,isPrimitive,flattenArray} from "./util";
import vnode from './vnode';

const hasOwnProperty=Object.prototype.hasOwnProperty;

// 防止冲突的一些键值
const RESERVED_PROPS={
  key:true,
  __self:true,
  __source:true
};

export default h;

/**
 * 判断是否有合法的key值
 * @param config
 * @return {boolean}
 */
function hasValidKey(config) {
  return config.key!==undefined;
}

function h(type,config,...children) {
  // key值也存在于config当中
  const props={};
  let key=null;
  // 获取key的值填充prop对象
  if(config!==null){
    // 如果在初始化的时候传入了key的话，执行
    if(hasValidKey(config)){
      key=''+config.key;
    }
    // for...in...循环将config里面的属性以及值遍历到props里面
    for(let propName in props){
      if(hasOwnProperty.call(config,propName) && !RESERVED_PROPS[propName]){
        props[propName]=config[propName];
      }
    }
  }
  return vnode(//di一次创建的时候
    type,
    key,
    props,//props在vnode的函数当中被改写成data
    flattenArray(children).map(c=>{//对children进行遍历，然后只要是string和number的原始的类型，就创建成text节点，否则不进行操作，因为在提供给用户的操作过程中，需要用户手动创建children为vnode的对象
      return isPrimitive(c)?vnode(undefined,undefined,undefined,undefined,c,undefined):c;//仅仅text的值被赋值了
    })
  )
}