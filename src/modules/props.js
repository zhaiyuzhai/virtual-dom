/*
* props模块，支持vnode使用props来操作其他属性
* */

/**
 * 提供过滤的函数，过滤掉里面的style，id，class的属性
 * @param obj
 */
function filterKeys(obj) {
  return Object.keys(obj).filter(k=>{
    return k!=='style' || k!=='id' || k!=='class'
  })
}

function updateProps(oldVnode,vnode) {
  let oldProps=oldVnode.data.props;
  let props=vnode.data.props;
  let elm=vnode.elm;
  let key,cur,old;
  if(!oldProps && !props) return;
  if(oldProps===props) return;
  oldProps=oldProps || {} ;//放错误处理
  props=props || {} ;
  // 过滤旧的props然后将没有在新的里面出现的属性删除掉
  filterKeys(oldProps).forEach(key=> {
    if (!props[key]) {
      delete elm[key];//遍历旧的props，在新的props上不存在的属相，如果在dom节点上存在的话就删除
    }
  });
  // 过滤新的属性，然后找出需要替换的新属性
  filterKeys(props).forEach(key=>{
    cur=props[key];
    old=oldProps[key];
    if(old !== cur && (key !=='value' || elm[key] !==cur)){//防止修改input的value值
      elm[key]=cur;
    }
  })
}

export const propsModule={
  create:updateProps,
  update:updateProps
};
export default propsModule;
