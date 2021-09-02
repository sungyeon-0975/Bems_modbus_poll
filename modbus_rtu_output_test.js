const modbus = require('jsmodbus')
const Serialport = require('serialport')
const socket = new Serialport('COM5', {
  baudRate: 9600,
})

// set Slave PLC ID
device_address = 1
const client = new modbus.client.RTU(socket, device_address)

socket.on('connect', function () {
  client.writeSingleRegister(0, 123).then(function (resp) {
    console.log(resp)
    socket.close()
  }).fail(function (err) {
    console.log(err)
    socket.close()
  })
})

socket.on('error', function (err) {
  console.log(err)
})