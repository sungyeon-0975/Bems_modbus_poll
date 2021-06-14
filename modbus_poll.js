const DBH = require('./database.js')
var Excel = require('./get_excel.js')
const Modbus = require('jsmodbus')
const net = require('net')
const { timeStamp } = require('console')
const { stringify } = require('querystring')
const sockets = []
const clients = []

var IPs = new Array();
var Channels = {}
var Details = {}

function IP() {
    id = 0
    ch_name = ""
    com_type = ""
    ip_address = ""
    port = 0
    period = 0
    wait_time = 0
    active = 0
}
function Channel() {
    id = 0
    fr_name = ""
    channel_id = 0
    function_code = 0
    device_address = 0
    start_address = 0
    read_byte = 0
    active = 0
}
function Detail() {
    object_name = '',
    object_type = '',
    id = 0,
    units = '',
    low_limit = 0,
    high_limit = 0,
    m_enable = 0,
    m_ip = 0,
    m_channel = 0,
    m_func = 0,
    m_addr = 0,
    m_offsetbit = 0,
    m_dattype = 0,
    m_r_scale = 0,
    m_r_offset = 0,
    m_w_ip = 0,
    m_w_id = 0,
    m_w_fc = 0,
    m_w_addr = 0,
    m_w_datatype = 0,
    m_w_scale = 0,
    m_w_offset = 0
}

modbus_poll()

async function modbus_poll(){
    await Excel.loadExcelFile()
    await getInfo()
    console.log("start 통신")//,IPs, Channels, Details)
    modbusStart()
}

function getInfo(){
    return new Promise(async function(resolve, reject) {
        var rows = await DBH.device_select("modbus_ip")
        rows.forEach(row => {
            tmp = new IP();
            tmp.id = row["id"]
            tmp.ch_name = row["name"]
            tmp.com_type = row["com_type"]
            tmp.ip_address = row["ip_address"]
            tmp.port = row["port"]
            tmp.period = row["period"]
            tmp.wait_time = row["wait_time"]
            tmp.active = row["active"]
            IPs.push(tmp)//리스트에 패킷데이터를 저장한다.
            Channels[tmp.id] = [] //ChannelName을 key값으로 리스트를 생성해준다. 리스트에는 frames들이 들어갈계획  
        })
        rows = await DBH.device_select("modbus_channels")
        rows.forEach(row => {
            tmp = new Channel();
            tmp.id = row["id"]
            tmp.fr_name = row["name"]
            tmp.channel_id = row["channel_id"]
            tmp.function_code = row["function_code"]
            tmp.device_address = row["device_address"]
            tmp.start_address = row["start_address"]
            tmp.read_byte = row["read_byte"]
            tmp.active = row["active"]
            Channels[tmp.channel_id].push(tmp)//channelname에 맞게 리스트에 차례로 삽입한다. 나중에 패킷 보낼때 사용함.'
            Details[tmp.id] = []
        })
        rows = await DBH.device_select("modbus_details")
        rows.forEach(row => {
            tmp = new Detail();
            tmp.object_name  = row['object_name']
            tmp.object_type = row['object_type']
            tmp.id = row["id"]
            tmp.units  = row['units']
            tmp.low_limit = row['low_limit']
            tmp.high_limit  = row['high_limit']
            tmp.m_enable = row['m_enable']
            tmp.m_ip = row['m_ip']
            tmp.m_channel = row['m_channel']
            tmp.m_func = row['m_func']
            tmp.m_addr = row['m_addr']
            tmp.m_offsetbit = row['m_offsetbit']
            tmp.m_dattype = row['m_dattype']
            tmp.m_r_scale = row['m_r_scale']
            tmp.m_r_offset = row['m_r_offset']
            tmp.m_w_ip = row['m_w_ip']
            tmp.m_w_id = row['m_w_id']
            tmp.m_w_fc = row['m_w_fc']
            tmp.m_w_addr = row['m_w_addr']
            tmp.m_w_dattype = row['m_w_dattype']
            tmp.m_w_scale = row['m_w_scale']
            tmp.m_w_offset = row['m_w_offset']
            Details[tmp.m_channel].push(tmp)
        });
        console.log("info 완료")
            resolve()
        });
}

function modbusStart() {
    for (let i = 0; i < IPs.length; i++) { // 소켓을 설정하고 열어준다.
        if (IPs[i].active == 0)continue
        sockets[i] = new net.Socket() //socket을 객체로 다루기 위해 설정해준다.
        clients[i] = new Modbus.client.TCP(sockets[i]) // tcp를 열어준다.
        //tcp설정
        var options = {
            'host': IPs[i].ip_address,
            'port': IPs[i].port
        }
        sockets[i].on("connect", async function () { //소켓이 연결되는 경우 어떻게 사용할 건지
            console.log("connected!!!!", IPs[i].ip_address)
            var targetchannels = Channels[IPs[i].id]
            console.log("targetFrame!!!", targetchannels)
            for (let fi = 0; fi < targetchannels.length; fi++) {//frame의 개수만큼 반복하는 코드
                if (targetchannels[fi].active == 1) { // active 상태일때만 반복시킴
                    console.log("타켓을 보자", targetchannels[fi])
                    if (targetchannels[fi].active == 0)continue
                    switch (targetchannels[fi].function_code) {
                        case 0://Read Coils
                            func = clients[i].readCoils(targetchannels[fi].start_address, targetchannels[fi].read_byte)
                            break
                        case 1://Read Discrete Input
                            func = clients[i].readDiscreteInput(targetchannels[fi].start_address, targetchannels[fi].read_byte)
                            break
                        case 3://Read Holding Registers
                            func = clients[i].readHoldingRegisters(targetchannels[fi].start_address, targetchannels[fi].read_byte)
                            break
                        case 4://Read Input Registers
                            func = clients[i].readInputRegister(targetchannels[fi].start_address, targetchannels[fi].read_byte)
                            break
                    }
                    setInterval(()=>{
                        func.then(function (resp) {
                            modbus_result = resp.response._body._valuesAsBuffer
                            console.log(fi, modbus_result,targetchannels[fi].read_byte)
                            //이제 여기서 데이터를 정규화 하는 작업 해야함
                            sensors = Details[targetchannels[fi].id]//detail객체
                            if (sensors === undefined || sensors.length == 0) return //Detail이 정의되어 있지 않은 경우 연산없이 넘긴다.
                            console.log("set read:", targetchannels[fi].start_address, targetchannels[fi].read_byte)
                            var targetIdx
                            var resData
                            for (let se = 0; se < sensors.length; se++) {
                                if (sensors[se].m_enable == 0)continue
                                targetIdx = (sensors[se].m_addr - targetchannels[fi].start_address)*2
                                switch (sensors[se].m_dattype) {
                                    case 0://unsigned int 16bit AB
                                        resData = modbus_result.readUInt16BE(targetIdx)
                                        break;
                                    case 1://signed int 16bit AB
                                        resData = modbus_result.readInt16BE(targetIdx)
                                        break;
                                    case 2://2 : 32bit signed int - AB CD
                                        resData = modbus_result.readInt32BE(targetIdx)
                                        break;
                                    case 3://3 : 32bit signed int - CD AB
                                        resData = modbus_result.swap32().swap16().readInt32BE(targetIdx)
                                        break;
                                    case 4:// 4 :  32bit signed int - BA DC
                                        resData = modbus_result.swap16().readInt32BE(targetIdx)
                                        break;
                                    case 5://5 :  32bit signed int - DC BA
                                        resData = modbus_result.swap32().readInt32BE(targetIdx)
                                        break;
                                    case 6://6 : float  - AB CD
                                        resData = modbus_result.readFloatBE(targetIdx)
                                        break;
                                    case 7://7 : float - CD AB
                                        resData = modbus_result.swap32().swap16().readFloatBE(targetIdx)
                                        break;
                                    case 8://8 : float - BA DC
                                        resData = modbus_result.swap16().readFloatBE(targetIdx)
                                        break;
                                    case 9://9 : float - DC BA
                                        resData = modbus_result.swap32().readFloatBE(targetIdx)
                                        break;
                                    case 10://10 : 64bit double - AB CD EF GH
                                        resData = modbus_result.readDoubleBE(targetIdx)
                                        break;
                                    case 11://11 : 64bit double - GH EF CD AB
                                        resData = modbus_result.swap64().swap16().readDoubleBE(targetIdx)
                                        break;
                                    case 12://12 : 64bit double - BA DC FE HG
                                        resData = modbus_result.swap16().readDoubleBE(targetIdx)
                                        break;
                                    case 13://13 : 64bit double - HG FE DC BA
                                        resData = modbus_result.swap64().readDoubleBE(targetIdx)
                                        break;
                                    case 14://14 : 1bit value
                                        const arr = Array.from({length: 16}, () => 0);
                                        var str = (modbus_result.readInt16BE(targetIdx)).toString(2)
                                        var idx = 15
                                        for (var i = str.length-1; i > -1; i--){
                                            arr[idx--] = str.charAt(i)
                                        }
                                        resData = parseInt(arr[sensors[se].m_offsetbit])
                                        break;
                                }
                            console.log("resData:", resData)
                            DBH.realtime_upsert(sensors[se].object_name, sensors[se].m_r_scale*resData + sensors[se].m_r_offset,sensors[se].object_type)     
                            }
                        }).catch(function () {
                            console.error(arguments)
                            console.log("여기 에러")
                            //sockets[i].end() 오류가 생겨도 닫지 않는다. 다른 frame 통신을 위해서
                        })
                    },2000)
                }
            }

        });
        sockets[i].on("error", function () {//에러가 발생하면 어떻게 할건지
            console.log("errored !!!!!!", IPs[i].ip_address)
        });
        sockets[i].connect(options)// 실제로 포트를 열어준다.
    }

}