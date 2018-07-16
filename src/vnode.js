const VNODE_TYPE=Symbol('virtual-node');//通过Symbol创建独一无二的值
/**
 *
 * @param type {String} 'div'
 * @param key {String}  key
 * @param data  {Object}  key-->value,props,事件等等
 * @param children {Array}  [{},{}]子vnode的类型集合
 * @param text  {string,Number}子节点是一个文本文档
 * @param elm   {HTMLCollection}对应的DOM
 * @return element {Object} 一个符合vnode结构的对象
 */
function vnode(type,key,data,children,text,elm) {
  // 此处的data里面可能包含class，props，style等等对象
  const element={
    __type:VNODE_TYPE,
    type,key,data,children,text,elm,
  };
  return element;
}

/**
 * 检查是否是vnode的标准就是看他的__type是否是VNODE_TYPE
 * @param vnode
 * @return {*|boolean}
 */
function isVnode(vnode) {
  return vnode && vnode.__type===VNODE_TYPE;
}

/**
 * 比较两个node节点是否是同一个节点的话，优先比较他们被打上的key值，其次比较他们的tagName，参考Node.isEqualNode()
 * @param oldVnode
 * @param vnode
 * @return {boolean}
 */
function isSameVnode(oldVnode,vnode) {
  return oldVnode.key===vnode.key && oldVnode.type===vnode.type;
}

export default vnode;
export {
  isVnode,
  isSameVnode,
  VNODE_TYPE
}