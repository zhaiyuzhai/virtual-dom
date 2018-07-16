import htmlDomApi from './domApi';//导入之前定义的domapi的接口
import vnode,{isVnode,isSameVnode} from './vnode';//创建虚拟dom的函数
import {isArray,isPrimitive} from "./util";

/**
 * 为 vnode 数组 begin～end 下标范围内的 vnode 创建它的 key 和 下标 的映射。
 * @param  {Array} children vnode 数组
 * @param  {Number} beginIdx 开始下标
 * @param  {Number} endIdx   结束下标
 * @return {Object}          key --> index 的 map
 */
function createKeyToOldIdx (children,beginIdx,endIdx) {
	let i,key,ch;
	const map={};
	for(i=beginIdx;i<=endIdx;++i){
		ch=children[i];
		if(ch!=null){
			key=ch.key;
			if(key!==undefined)map[key]=i;
		}
	}
	// 存在key值的情况下
	/*{
		key1:1,
		key2:2
	}*/
	return map;
	// 不存在key值的情况下
	/*{

	}*/
}


// 定义一些钩子
const hooks=['pre','create','update',"destory",'remove','post'];
//创建空的vnode节点
const emptyNode=vnode('','',{},[],undefined,undefined);


/**从暴露的init方法入手，返回patch函数
 * const patch=init();
 * @param modules {Array}  [classModule,propsModule,styleModule]
 * @param domApi
 */
export default function init(modules=[],domApi) {
	const api=domApi || htmlDomApi;//如果传入了domApi的话，优先使用传入的，否则默认使用内部定义的方法
	const cbs={};//回调的对象，方便存储；
	let i,j;
	// 从modules里面初始化hooks，在提供给使用者使用前已经执行
	for(i=0;i<hooks.length;++i){
		cbs[hooks[i]]=[];//以每一个钩子为key值，创建一个数组
		for(j=0;j<modules.length;++j){
			const hook=modules[j][hooks[i]]//找出每一个模块的钩子，目前只有两种钩子，分别为create以及update，内部调用的都是相同的方法
			if(hook!==undefined){
				cbs[hooks[i]].push(hook);
			}
		}
	}
	/*最终的结果：cbs{
		pre：[],
		create:[classModulCreate,styleModuleCreate,propsModuleCreate],
		update:[classModulUpdate,styleModuleUpdate,propsModuleUpdate]
	}*/

	/**
	 * 此函数的作用是用来将dom元素反创建成vnode
	 * @param elm
	 * @return {element}
	 */
	function emptyNodeAt (elm) {
		return vnode(
			api.tagName(elm),
			undefined,//key值
			{//props
				className:elm.className,
				id:elm.id
			},
			[],
			undefined,//text(倘若在初始化的时候，container里面有text的话，会和创建后的vnode同时存在)
			elm
		)
	}

	/**
	 * 创建 remove 回调函数
	 * @param  {Element} childElm  child element
	 * @param  {Number} listeners listeners 数量
	 * @return {Function}           remove 回调函数
	 */
	function createRmCb(childElm, listeners) {
		return function rmCb() {
			// 在所有 listeners 被执行后才删除 dom
			if (--listeners === 0) {
				api.removeChild(
					api.parentNode(childElm),
					childElm
				)
			}
		}
	}
	function createElm (vnode,insertedVnodeQueue) {
		let data = vnode.data
		let i
		if (data) {
			// 调用 init hook
			if (data.hook && (i = data.hook.init)) {
				i(vnode)
				// data 可能在 init hook 中被改变，重新获取。
				data = vnode.data
			}
		} else {
			data = {}
		}

		let children = vnode.children;
		let type = vnode.type;

		// 处理 comment
		if (type === 'comment') {
			if (vnode.text == null) {
				vnode.text = ''
			}
			vnode.elm = api.createComment(vnode.text)
		}
		// 处理其它 type
		else if (type) {
			const elm = vnode.elm = data.ns
				? api.createElementNS(data.ns, type)
				: api.createElement(type)

			// 调用 create hook
			for (let i = 0; i < cbs.create.length; ++i) cbs.create[i](emptyNode, vnode)

			// 分别处理 children 和 text。
			// 这里隐含一个逻辑：vnode 的 children 和 text 不会／应该同时存在。
			if (isArray(children)) {
				// 递归 children，保证 vnode tree 中每个 vnode 都有自己对应的 dom；
				// 即构建 vnode tree 对应的 dom tree。
				children.forEach(ch => {
					ch && api.appendChild(elm, createElm(ch, insertedVnodeQueue))
				})
			}
			else if (isPrimitive(vnode.text)) {
				api.appendChild(elm, api.createTextNode(vnode.text))
			}
			// 调用 create hook；为 insert hook 填充 insertedVnodeQueue。
			i = vnode.data.hook
			if (i) {
				i.create && i.create(emptyNode, vnode)
				i.insert && insertedVnodeQueue.push(vnode)
			}
		}
		// 处理 text
		else {
			vnode.elm = api.createTextNode(vnode.text)
		}

		return vnode.elm
	}

	function invokeDestroyHook(vnode) {
		let i, j
		if (vnode.data) {
			for (i = 0; i < cbs.destroy.length; ++i) cbs.destroy[i](vnode)
			if (vnode.children) {
				for (j = 0; j < vnode.children.length; ++j) {
					i = vnode.children[j]
					if (i && typeof i !== 'string') {
						invokeDestroyHook(i)
					}
				}
			}
		}
	}

	function removeVnodes (parentElm, vnodes, startIdx, endIdx) {
		for (; startIdx <= endIdx; ++startIdx) {
			let ch = vnodes[startIdx]
			let listeners
			let rm
			let i
			if (ch != null) {
				if (ch.type) {
					// 调用 destroy hook
					invokeDestroyHook(ch)
					listeners = cbs.remove.length + 1
					rm = createRmCb(ch.elm, listeners)
					// 每个 remove 回调执行时 listeners 减 1，所有回调执行完后，才真的删除 dom。
					for (i = 0; i < cbs.remove.length; ++i) cbs.remove[i](ch, rm)
					if ((i = ch.data) && (i = i.hook) && (i = i.remove)) {
						i(ch, rm)
					} else {
						rm()
					}
				} else {
					api.removeChild(parentElm, ch.elm)
				}
			}
		}
	}

	function addVnodes (parentElm, before, vnodes, startIdx, endIdx, insertedVnodeQueue) {
		for (; startIdx <= endIdx; ++startIdx) {
			const ch = vnodes[startIdx];
			if (ch != null) {
				api.insertBefore(parentElm, createElm(ch, insertedVnodeQueue), before)
			}
		}
	}

	function updateChildren (parentElm,oldCh,newCh,insertedVnodeQueue) {
		// parentElm是公用的node父节点

		/*第二层逻辑发生在此函数里面
		* oldCh:[a,b,c,d]
		* newCh:[a,d,c,b]
		* */
		let oldStartIdx=0,newStartIdx=0;
		let oldEndIdx=oldCh.length-1;
		let oldStartVnode=oldCh[0];
		let oldEndVnode=oldCh[oldEndIdx];
		let newEndIdx = newCh.length - 1;
		let newStartVnode = newCh[0];
		let newEndVnode = newCh[newEndIdx];
		let oldKeyToIdx;
		let idxInOld;
		let elmToMove;
		let before;
		while(oldEndIdx<=oldEndIdx && newStartIdx<=newEndIdx){
			// 确保一次只移动一位，一次循环就进行多次比较
			if(oldStartVnode==null){
				oldStartVnode=oldCh[++oldStartIdx];
			}else if (oldEndVnode == null) {
				oldEndVnode = oldCh[--oldEndIdx];
			} else if (newStartVnode == null) {
				newStartVnode = newCh[++newStartIdx];
			} else if (newEndVnode == null) {
				newEndVnode = newCh[--newEndIdx];
			}else if(isSameVnode(oldStartVnode, newStartVnode)){
				// 不需要移动 dom
				patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);//再去递归遍历child
				oldStartVnode = oldCh[++oldStartIdx];
				newStartVnode = newCh[++newStartIdx];
			}else if(isSameVnode(oldEndVnode, newEndVnode)){
				// 不需要移动 dom
				patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
				oldEndVnode = oldCh[--oldEndIdx];
				newEndVnode = newCh[--newEndIdx];
			}else if (isSameVnode(oldStartVnode, newEndVnode)) {
				patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
				// 把获得更新后的 (oldStartVnode/newEndVnode) 的 dom 右移，移动到
				// oldEndVnode 对应的 dom 的右边。为什么这么右移？
				// （1）oldStartVnode 和 newEndVnode 相同，显然是 vnode 右移了。
				// （2）若 while 循环刚开始，那移到 oldEndVnode.elm 右边就是最右边，是合理的；
				// （3）若循环不是刚开始，因为比较过程是两头向中间，那么两头的 dom 的位置已经是
				//     合理的了，移动到 oldEndVnode.elm 右边是正确的位置；
				// （4）记住，oldVnode 和 vnode 是相同的才 patch，且 oldVnode 自己对应的 dom
				//     总是已经存在的，vnode 的 dom 是不存在的，直接复用 oldVnode 对应的 dom。
				api.insertBefore(parentElm, oldStartVnode.elm, api.nextSibling(oldEndVnode.elm));
				oldStartVnode = oldCh[++oldStartIdx];
				newEndVnode = newCh[--newEndIdx];
			}else if (isSameVnode(oldEndVnode, newStartVnode)) {
				patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
				// 这里是左移更新后的 dom，原因参考上面的右移。
				api.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
				oldEndVnode = oldCh[--oldEndIdx];
				newStartVnode = newCh[++newStartIdx];
			}else{
			/*	最后一种情况，头头不相等，尾尾不相等，头尾不相等，尾头不相等
				1. 从 oldCh 数组建立 key --> index 的 map。
				2. 只处理 newStartVnode （简化逻辑，有循环我们最终还是会处理到所有 vnode），
				   以它的 key 从上面的 map 里拿到 index；
				3. 如果 index 存在，那么说明有对应的 old vnode，patch 就好了；
				4. 如果 index 不存在，那么说明 newStartVnode 是全新的 vnode，直接
				   创建对应的 dom 并插入。*/
				if(oldKeyToIdx===undefined){
					oldKeyToIdx=createKeyToOldIdx(oldCh,oldStartIdx,oldEndIdx);
				}
				// 尝试通过 newStartVnode 的 key 去拿下标
				idxInOld = oldKeyToIdx[newStartVnode.key];
				// 下标不存在，说明 newStartVnode 是全新的 vnode。
				if (idxInOld == null) {
					// 那么为 newStartVnode 创建 dom 并插入到 oldStartVnode.elm 的前面,因为他是newstartVnode开头的元素
					api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
					// 将newStartVnode往右移动一位
					newStartVnode = newCh[++newStartIdx];
				}else{
					// 下标存在，说明 old children 中有相同 key 的 vnode，
					elmToMove=oldCh[idxInOld];//在旧的children数组里面找出需要移动的那个
					// 还需要判断一下type是否相同，type不同创建新的dom
					if (elmToMove.type !== newStartVnode.type) {
						api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm)
					}else{
						// type相同，说明是相同的dom,此时需要再将原有的dom进行移动，深度比较children节点
						patchVnode(elmToMove, newStartVnode, insertedVnodeQueue);
						oldCh[idxInOld] = undefined;//原有children上面进行清空
						api.insertBefore(parentElm, elmToMove.elm, oldStartVnode.elm);
					}
					newStartVnode=newCh[++newStartIdx];//newCh的下标右移
				}
			}
		}




	}
	/**
	 * patch oldVnode 和 vnode （它们是相同的 vnode）
	 * 1. 更新本身对应 dom 的 textContent/children/其它属性；
	 * 2. 根据 children 的变化去决定是否递归 patch children 里的每个 vnode。
	 * @param oldVnode {Object}
	 * @param vnode {Object}
	 * @param insertedVnodeQueue {Array} 用来记录新插入的vnode
	 */
	// 对新旧vnode进行patch，然后更新
	function patchVnode (oldVnode,vnode,insertedVnodeQueue) {
		// 因为类型相同，由isSameVnode(oldVnode,vnode)为true时调用
		//深度优先的遍历
		const elm=vnode.elm=oldVnode.elm;
		let oldCh=oldVnode.children;
		let ch=vnode.children;
		// 如果oldvnode和vnode是同一个node，直接返回
		if(oldVnode===vnode)return;
		//循环调用update的钩子，对class，style等等进行更新
		if (vnode.data){
			for(i=0;i<cbs.update.length;++i){
				cbs.update[i](oldVnode,vnode)
			}
		}
		// 如果vnode.text是undefined的话,那么表示新vnode有children或者children为空
		if(vnode.text===undefined){
			// 新旧children都存在的情况，有可能为undefined
			if(oldCh && ch){
				if(oldCh!==ch){//除非是复用的同一个数组对象
					updateChildren(elm,oldCh,ch,insertedVnodeQueue);//更新children
				}
			}else if(ch){
				// 只有新的children的情况
				if(oldVnode.text) api.setTextContent(elm,'');
				addVnodes(elm,null,ch.length-1,insertedVnodeQueue);
			}else if(oldCh){
				// 新的vnode不存在，只有旧的
				removeVnodes(elm,oldCh,0,oldCh.length-1);
			}else if (oldVnode.text){
				// 旧的vnode有text,因为新的没有，所以置空
				api.setTextContent(elm,'')
			}
		}else if(oldVnode.text!==vnode.text){
			// 否则 （vnode 有 text），只要 text 不等，更新 dom 的 text。
			api.setTextContent(elm,vnode.text);
		}
	}

	return function patch(oldVnode,vnode) {
		/*同层级比较发生在此处，按层级进行比较然后只要节点不同的话就直接覆盖，不再进行children的遍历比较
		* 如果节点相同的话那么就要将整个节点进行patch，在patch节点下方的children
		* 在经过首次的patch之后，那么就一定存在elm
		* */
		let elm,parent;
		const insertedVnodeQueue=[];//供函数addVnode调用
		let i;
		// 循环调用pre hook的钩子
		for(i=0;i<cbs.pre.length;++i){
			cbs.pre[i]();
		}
		// 如果使用者传入的旧的oldVnode不是vnode的实例，而是dom元素的话就创建一个空的node
		if(!isVnode(oldVnode)){
			oldVnode = emptyNodeAt(oldVnode)//在初次调用的时候其实已将页面的container传入进来
		}
		if(isSameVnode(oldVnode,vnode)){//如果key值相同，并且类型type相同的话
			patchVnode(oldVnode,vnode,insertedVnodeQueue);
		} else{
			//如果两个节点不同的话，直接将oldVnode替换成vnode
			elm=oldVnode.elm;
			parent=api.parentNode(elm);
			createElm(vnode,insertedVnodeQueue);//以新的vnode创建新的dom节点
			// 如果原始的vnode有parent的话，那么插入新的vnode对应的dom，删除原dom
			if(parent!==null){
				api.insertBefore(parent,vnode.elm,api.nextSibling(elm));//在原始的dom前面插入新的节点
				removeVnodes(parent,[oldVnode],0,0);//删除节点并且删除一些钩子函数
			}
		}
		// 调用insert的钩子，在createElm的时候，将有hook的钩子压入队列当中，然后将依次执行并且将当前的vnode实例传入进去
		for(i=0;i<insertedVnodeQueue.length;++i){//insertedVnodeQueue在经过patch或者createElm的时候
			// 为什么不用判断 insert 是否存在？
			// 因为填充 insertedVnodeQueue 时已判断。
			insertedVnodeQueue[i].data.hook.insert(insertedVnodeQueue[i]);
		}
		//循环调用post的钩子
		for(i=0;i<cbs.post.length;++i){
			cbs.post[i]();
		}
		return vnode;//返回新的vnode（对vnode进行一些补充，同时返回，例如elm，全部以新的为主）
	}
}