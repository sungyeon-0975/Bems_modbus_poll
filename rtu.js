const modbus = require('jsmodbus')
const SerialPort = require('serialport')
const socket = new SerialPort('COM4', {
  baudRate: 9600,
})
//const client = new modbus.client.RTU(socket, 2)

socket.on('close', function () {
  console.log("이거 close")
  console.log(arguments)
})
socket.on('open', function () {
  console.log("이거 open")
  client.readInputRegisters(1, 10)
    .then(function (resp) {
      console.log(resp)

    }).catch(function () {
      console.error(arguments)
      //socket.close()
    })
  client.readInputRegisters(1, 10)
    .then(function (resp) {
      console.log(resp)

    }).catch(function () {
      console.error(arguments)
      //socket.close()
    })
})
socket.on('data', function () {
  console.log("이거 data")
  console.log(arguments)
})
socket.on('error', console.error)