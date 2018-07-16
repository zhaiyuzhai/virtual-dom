import {isArray} from "../util";

function updateClassName (oldVnode,vnode) {
	const oldName=oldVnode.data.className;
	const newName=vnode.data.className;
	if(!oldName && !newName)return;
	if(oldName === newName)return;//除非复用一个对象，否则不可能相等
	const elm=vnode.elm;
	if(typeof newName==='string' && newName){
		elm.className=newName;
	}else if(isArray(newName)){
		elm.className='';
		newName.forEach(v=>{
			elm.classList.add(v)
		})
	}else{
		// 任何不合法的值或者空值，全部置为空
		elm.className='';
	}
}

export const classModule = {
	create: updateClassName,
	update: updateClassName
};
export default classModule