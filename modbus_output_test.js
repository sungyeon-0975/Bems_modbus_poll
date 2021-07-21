const Modbus = require('jsmodbus')
const net = require('net')
// const Buffer = require('buffer');

const socket = new net.Socket()
const options = {
  'host': '192.168.0.18',
  'port': '502'
}
const client = new Modbus.client.TCP(socket)

socket.on('connect', function () {
  buf = Buffer.alloc(2)
  buf.writeInt16BE(1)
  console.log(typeof buf,buf)
  client.writeMultipleRegisters(8,buf)
    .then(function (resp) {
      console.log(resp)//->역순 
      socket.end()
    }).catch(function () {
      console.error(arguments)
      socket.end()
    })
})

socket.on('error', console.error)
socket.connect(options)