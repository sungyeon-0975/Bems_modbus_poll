const buf = Buffer.alloc(3);
// buf.writeInt8([0x10, 0x73, 0x00])
buf.writeInt8(0x10, 0)
buf.writeInt8(0x73, 1)
buf.writeInt8(0x00, 2)
const idx = 3
const offsetbit = 12
console.log(buf)
console.log(buf.readInt8())
parseInt((offsetbit + 1)/8), (offsetbit+1)%8 -1
console.log(buf.readInt16BE())




// const arr = Array.from({length: 16}, () => 0);
// var str = (modbus_result.readInt16BE(targetIdx)).toString(2)
// var idx = 15
// for (var i = str.length-1; i > -1; i--){
//     arr[idx--] = str.charAt(i)
// }
// resData = parseInt(arr[sensors[se].m_offsetbit])
// break;