const DBH = require('./database.js')
const Modbus = require('jsmodbus')
const net = require('net')

var ctrl_list =  new Array();


setInterval(() => ctrl_check_start(), 2000)

async function ctrl_check_start(){
    await get_info()
    modbus_output()
}


function ctrl_target() {
    ip = '',
    port = 0,
    object_name = '',
    dattype = '',
    scale = 0,
    offset = 0,
    ctrlvalue = 0,
    func = 0
    address = 0
}

function get_info(){
    return new Promise(async function(resolve, reject) {
        var rows = await DBH.select_not_null('mysql');
        for (const row of rows){
            // console.log(row)
            tmp =  new ctrl_target()
            tmp.object_name = row["object_name"]
            tmp.ctrlvalue = row['ctrlvalue']
            detail = await DBH.get_modbus_detail(row["object_name"])// get scale,offset,func,dattype,address
            tmp.scale = detail['m_w_scale']
            tmp.offset = detail['m_w_offset']
            tmp.func = detail['m_w_fc']
            tmp.dattype = detail['m_dattype']
            tmp.address = Number(detail['m_w_addr'])
            address = await DBH.get_ip_addr(detail['m_w_ip'])//ip_address,port
            tmp.ip = address['ip_address']
            tmp.port = address['port']
            ctrl_list.push(tmp)
        }
        console.log('get_info완료')
        resolve()
    });
}
    
function modbus_output(){
    console.log('modbus_output 시작')
    // console.log('ctrl_list: ', ctrl_list)
    for (var i =0 ; i < ctrl_list.length; i++){
        target = ctrl_list[i]
        console.log('target: ',target)
        const socket = new net.Socket()
        const client = new Modbus.client.TCP(socket)
        const options = {
        'host': target.ip,
        'port': target.port
        }
        socket.on('connect', function () {
            value = target.ctrlvalue*target.scale + target.offset//multi 이면 list , single이면 그냥 단일 value
            // console.log(value)
            switch (target.dattype) {
                case 0://unsigned int 16bit AB
                    buf = Buffer.alloc(2)
                    buf.writeUInt16BE(value)
                    break;
                case 1://signed int 16bit AB
                    buf = Buffer.alloc(2)
                    buf.writeInt16BE(value)
                    break;
                case 2://2 : 32bit signed int - AB CD
                    buf = Buffer.alloc(4)
                    buf.writeInt32BE(value)
                    break;
                case 3://3 : 32bit signed int - CD AB
                    buf = Buffer.alloc(4)
                    buf.writeInt32BE(value).swap32().swap16()
                    break;
                case 4:// 4 :  32bit signed int - BA DC
                    buf = Buffer.alloc(4)
                    buf.writeInt32BE(value).swap16()
                    break;
                case 5://5 :  32bit signed int - DC BA
                    buf = Buffer.alloc(4)
                    buf.writeInt32BE(value).swap32()
                    break;
                case 6://6 : float  - AB CD (32bit)
                    buf = Buffer.alloc(4)
                    buf.writeFloatLE(value)
                    break;
                case 7://7 : float - CD AB
                    buf = Buffer.alloc(4)
                    buf.writeFloatBE(value).swap32().swap16()
                    break;
                case 8://8 : float - BA DC
                    buf = Buffer.alloc(4)
                    buf.writeFloatBE(value).swap16()
                    break;
                case 9://9 : float - DC BA
                    buf = Buffer.alloc(4)
                    buf.writeFloatBE(value).swap32()
                    break;
                case 10://10 : 64bit double - AB CD EF GH
                    buf = Buffer.alloc(8)
                    buf.writeDoubleBE(vlaue)
                    break;
                case 11://11 : 64bit double - GH EF CD AB
                    buf = Buffer.alloc(8)
                    buf.writeDoubleBE(value).swap64().swap16()
                    break;
                case 12://12 : 64bit double - BA DC FE HG
                    buf = Buffer.alloc(8)
                    buf.writeDoubleBE(value).swap16()
                    break;
                case 13://13 : 64bit double - HG FE DC BA
                    buf = Buffer.alloc(8)
                    buf.writeDoubleBE(value).swap64()
                    break;
                case 14://14 : 1bit value
                    //이부분 맞는지 확인 필요
                    // buf = Buffer.alloc(2)
                    if (value == 0){
                        buf = false
                    }else{
                        buf = true
                    }
            }
            console.log(buf)
            //주소처리 다시 확인해야 함
            switch (target.func){
                case 5://write single coil
                    func = client.writeSingleCoil(target.address,buf)
                    break
                case 6://write single/multi register
                    func = client.writeMultipleRegisters(target.address,buf)
                    break
                // case 7://write multi register
                //     func = client.writeMultipleRegisters(target.address,buf)
                //     break
                // default:
                //     break
                // case 8://write multi coil
                //     func = client.writeMultipleCoils(target.address,value)
                //     break
            }
            func.then(async function (resp) {
                await DBH.recover_realtime(target.object_name)
                console.log(resp)
                socket.end()
            }).catch(function () {
                console.error(arguments)
                socket.end()
            })
        })
        socket.on('error', console.error)
        socket.connect(options)
    }
    
}

