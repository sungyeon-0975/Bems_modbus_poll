const DBH = require('./database.js')
var Excel = require('./get_excel.js')
const Modbus = require('jsmodbus')
const net = require('net')
const { timeStamp } = require('console')
const { stringify } = require('querystring')
const sockets = []
const clients = []

var Channels = new Array();
var Frames = {}
var Details = {}

function Channel() {
    id = 0
    ch_name = ""
    com_type = ""
    ip_address = ""
    port = 0
    period = 0
    wait_time = 0
    active = 0
}
function Frame() {
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
    id = 0
    object_name = ""
    channel_id = 0
    frame_id = 0
    object_type = ""
    low_limit = 0
    high_limit = 0
    start_address = 0
    bit_offset = 0
    data_type = 0
    scale = 0
    offset = 0
    record_type = 0
    units = ""
}

Excel.loadExcelFile()//아직 db구조 안바꿔서 db넣을때 에러남.. 대기
//DB에서 파일을 긁어온다.
DBH.device_select("channels", function (rows) {
    rows.forEach(row => {
        tmp = new Channel();
        tmp.id = row["id"]
        tmp.ch_name = row["name"]
        tmp.com_type = row["com_type"]
        tmp.ip_address = row["ip_address"]
        tmp.port = row["port"]
        tmp.period = row["period"]
        tmp.wait_time = row["wait_time"]
        tmp.active = row["active"]
        Channels.push(tmp)//리스트에 패킷데이터를 저장한다.
        Frames[tmp.id] = [] //ChannelName을 key값으로 리스트를 생성해준다. 리스트에는 frames들이 들어갈계획
    })
    //Frame데이터를 DB에서 빼내온다.
    DBH.device_select("frames", function (rows) {
        rows.forEach(row => {
            tmp = new Frame();
            tmp.id = row["id"]
            tmp.fr_name = row["name"]
            tmp.channel_id = row["channel_id"]
            tmp.function_code = row["function_code"]
            tmp.device_address = row["device_address"]
            tmp.start_address = row["start_address"]
            tmp.read_byte = row["read_byte"]
            tmp.active = row["active"]
            Frames[tmp.channel_id].push(tmp)//channelname에 맞게 리스트에 차례로 삽입한다. 나중에 패킷 보낼때 사용함.
            Details[tmp.id] = []
        })
    })
    DBH.device_select("details", function (rows) {
        rows.forEach(row => {
            tmp = new Detail();
            tmp.id = row["id"]
            tmp.object_name = row['object_name']
            tmp.channel_id = row['channel_id']
            tmp.frame_id = row['frame_id']
            tmp.object_type = row['object_type']
            tmp.low_limit = row['low_limit']
            tmp.high_limit = row['high_limit']
            tmp.start_address = row['start_address']
            tmp.bit_offset = row['bit_offset']
            tmp.data_type = row['data_type']
            tmp.scale = row['scale']
            tmp.offset = row['offset']
            tmp.record_type = row['record_type']
            tmp.units = row['units']
            Details[tmp.frame_id].push(tmp)
        })
    })
    console.log("start 통신", Channels.length)
    modbusStart()
})

function modbusStart() {
    for (let i = 0; i < Channels.length; i++) { // 소켓을 설정하고 열어준다.
        sockets[i] = new net.Socket() //socket을 객체로 다루기 위해 설정해준다.
        clients[i] = new Modbus.client.TCP(sockets[i]) // tcp를 열어준다.

        //tcp설정
        var options = {
            'host': Channels[i].ip_address,
            'port': Channels[i].port
        }
        sockets[i].on("connect", async function () { //소켓이 연결되는 경우 어떻게 사용할 건지
            console.log("connected!!!!", Channels[i].ip_address)
            var targetFrames = Frames[Channels[i].id]
            console.log("targetFrame!!!", targetFrames)
            for (let fi = 0; fi < targetFrames.length; fi++) {//frame의 개수만큼 반복하는 코드
                if (targetFrames[fi].active == 1) { // active 상태일때만 반복시킴
                    console.log("타켓을 보자", targetFrames[fi])
                    if (targetFrames[fi].function_code == 3) {//만약 3번 함수이면 실행한다.
                        setInterval(()=>{
                            clients[i].readHoldingRegisters(targetFrames[fi].start_address, targetFrames[fi].read_byte)
                            .then(function (resp) {
                                modbus_result = resp.response._body._valuesAsBuffer
                                console.log("set read:", targetFrames[fi].start_address, targetFrames[fi].read_byte)
                                console.log(fi, modbus_result)
                                //이제 여기서 데이터를 정규화 하는 작업 해야함
                                sensors = Details[targetFrames[fi].id]//detail객체
                                if (sensors === undefined || sensors.length == 0) {
                                    //Detail이 정의되어 있지 않은 경우 연산없이 넘긴다.
                                    return
                                }
                                var targetIdx
                                var resData
                                for (let se = 0; se < sensors.length; se++) {
                                    targetIdx = (sensors[se].start_address + sensors[se].bit_offset - targetFrames[fi].start_address)*2
                                    switch (sensors[se].data_type) {
                                        case 0://16bit unsigned int
                                            resData = modbus_result.readUInt16BE(targetIdx)
                                            break;
                                        case 1://16bit signed
                                            resData = modbus_result.readInt16BE(targetIdx)
                                            break;
                                        case 2://2 : 32bit unsigned int
                                            resData = modbus_result.readUInt32BE(targetIdx)
                                            break;
                                        case 3://3 : 32bit signed int
                                            resData = modbus_result.readInt32BE(targetIdx)
                                            break;
                                        case 4:// 4 : 32bit float
                                            resData = modbus_result.readFloatBE(targetIdx)
                                            break;
                                        case 5://5 : 64bit double
                                            resData =modbus_result.readDoubleBE(targetIdx)
                                            break;
                                    }
                                    console.log("resData:", resData, "targetIdx" , targetIdx)
                                    //실시간 디비 넣는 작업 필요
                                    resData = se//임시로 인덱스를 넣어줌
                                    //DB에 resData를 갱신한다.
                                    DBH.details_update(sensors[se].id, resData)
                                }
                            }).catch(function () {
                                console.error(arguments)
                                //sockets[i].end() 오류가 생겨도 닫지 않는다. 다른 frame 통신을 위해서
                            })
                        },2000)
                    }
                }
            }
        });
        sockets[i].on("error", function () {//에러가 발생하면 어떻게 할건지
            console.log("errored !!!!!!", Channels[i].ip_address)
        });
        sockets[i].connect(options)// 실제로 포트를 열어준다.
    }

}