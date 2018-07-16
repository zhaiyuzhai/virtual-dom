/**
 * style 模块：支持 vnode 使用 style 来操作内连样式。
 */

// 在不同的环境下，获取到异步的功能代码
const raf=(typeof window !=='undefined' && window.requestAnimationFrame) || setTimeout;
// 构建异步的函数，感觉raf调用一次即可
const nextFrame=function (fn) {
  raf(function () {
    raf(fn)
  })
};
function setNextFrame(obj,prop,val) {
  nextFrame(function () {
    obj[prop]=val;
  })
}

function updateStyle(oldVnode,vnode) {
  let oldStyle=oldVnode.data.style;
  let style=vnode.data.style;
  const elm=vnode.elm;
  let name,cur;
  if(!oldVnode && !style)return;
  if(oldStyle===style) return;
  oldStyle=oldStyle || {};
  style=style || {};
  let oldHasDel='delayed' in oldStyle;
  // 遍历旧的，删除在新的style里面没有的
  for(name in oldStyle){
    if(!style[name]){//如果在style中不存在，而在oldStyle中存在的情况下删除
      if(name[0]==='-' && name[1]==='-'){
        elm.style.removeProperty(name);
      }else{
        elm.style[name]='';
      }
    }
  }
  // 更新style
  for(name in style){
    cur=style[name];
    //delayed...增加了延时的功能
    if(name==='delayed'){
      for(name in style.delayed){
	      if (!oldHasDel || cur !== oldStyle.delayed[name]) {//如果旧的没有，或者新的不等于旧的，就更新
		      setNextFrame(elm.style, name, cur)
	      }
      }
    }
    else if(name!=='remove' && cur !==oldStyle[name]){
      if(name[0]==='-' && name[1]==='-'){
        elm.style.setProperty(name,cur);
      }else{
        elm.style[name]=cur;
      }
    }
  }
}

export const styleModule = {
  create: updateStyle,
  update: updateStyle
}
export default styleModule