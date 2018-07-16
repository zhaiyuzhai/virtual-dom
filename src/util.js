const isArray=Array.isArray;

const isPrimitive=val=>{
  const type=typeof val;
  return type==='number'|| type==='string'
};

const flattenArray=array=>{
  return Array.prototype.concat([],array);
};
export {
  isPrimitive,
  isArray,
  flattenArray
}