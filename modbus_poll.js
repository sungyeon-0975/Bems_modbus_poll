const DBH = require('./database.js')
var Excel  = require('./get_excel.js')
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
    Id = 0
    Name = ""
    ComType = ""
    IpAddress = ""
    Port = 0
    Period = 0
    WaitTime = 0
    Active = 0
}
function Frame() {
    Id = 0
    Name = ""
    ChannelId = ""
    FunctionCode = 0
    DeviceAddress = 0
    StartAddress = 0
    ReadByte = 0
    Active = 0
}
function Detail() {
    Id = 0
    ObjectName = ''
    ChannelId = 0
    FrameId = 0
    ObjectType = ''
    LowLimit = 0
    HighLimit = 0
    StartAddress = 0
    BitOffset = 0
    DataType = 0
    Scale = 0
    Offset = 0
    RecordType = ''
    Units = ''
}

Excel.loadExcelFile()//아직 db구조 안바꿔서 db넣을때 에러남.. 대기
//DB에서 파일을 긁어온다.
DBH.device_select("channels", function (rows) {
    rows.forEach(row => {
        tmp = new Channel();
        tmp.Id = row["Id"]
        tmp.Name = row["Name"]
        tmp.ComType = row["ComType"]
        tmp.IpAddress = row["IpAddress"]
        tmp.Port = row["Port"]
        tmp.Period = row["Period"]
        tmp.WaitTime = row["WaitTime"]
        tmp.Active = row["Active"]
        Channels.push(tmp)//리스트에 패킷데이터를 저장한다.
        Frames[tmp.Index] = [] //ChannelName을 key값으로 리스트를 생성해준다. 리스트에는 frames들이 들어갈계획
        console.log(Frames[tmp.Index])
    })
    //Frame데이터를 DB에서 빼내온다.
    DBH.device_select("frames", function (rows) {
        rows.forEach(row => {
            tmp = new Frame();
            tmp.Id = row["Id"]
            tmp.Name = row["Name"]
            tmp.ChannelId = row["ChannelId"]
            tmp.FunctionCode = row["FunctionCode"]
            tmp.DeviceAddress = row["DeviceAddress"]
            tmp.StartAddress = row["StartAddress"]
            tmp.ReadByte = row["ReadByte"]
            tmp.Active = row["Active"]
            Frames[tmp.ChannelIndex].push(tmp)//channelname에 맞게 리스트에 차례로 삽입한다. 나중에 패킷 보낼때 사용함.
            Details[tmp.Index] = []
        })
    })
    DBH.device_select("details", function (rows) {
        rows.forEach(row => {
            tmp = new Detail();
            tmp.Id = row["Id"]
            tmp.ObjectType = row['ObjectType']
            tmp.ChennelId = row['ChennelId']
            tmp.FrameId = row['FrameId']
            tmp.ObjectType = row['ObjectType']
            tmp.LowLimit = row['LowLimit']
            tmp.HighLimit = row['HighLimit']
            tmp.StartAddress = row['StartAddress']
            tmp.BitOffset = row['BitOffset']
            tmp.DataType = row['DataType']
            tmp.Scale = row['Scale']
            tmp.Offset = row['Offset']
            tmp.RecordType = row['RecordType']
            tmp.Units = row['Units']
            Details[tmp.Frameindex].push(tmp)
        })
    })
    console.log("start 통신", Channels.length)
    modbusStart()
})

function Unsignedbit(n,k){
    var data = String(n).split("");
    var res = 0
    for (var i=0; i < data.length; i++) {
        res += parseInt(data[i]) * Math.pow(k,i)
    }
    return res
}


function modbusStart() {
    for (let i = 0; i < Channels.length; i++) { // 소켓을 설정하고 열어준다.
        sockets[i] = new net.Socket() //socket을 객체로 다루기 위해 설정해준다.
        clients[i] = new Modbus.client.TCP(sockets[i]) // tcp를 열어준다.

        //tcp설정
        var options = {
          'host': Channels[i].IpAddress,
          'port': Channels[i].Port
        }
        sockets[i].on("connect", function () {//소켓이 연결되는 경우 어떻게 사용할 건지
            console.log("connected", Channels[i])
            var targetFrames = Frames[Channels[i].ChannelName]
            for (let fi = 0; fi < targetFrames.length; fi++) {
                if (targetFrames[fi].FunctionCode == 3) {
                    setInterval(function () {
                        clients[i].readHoldingRegisters(targetFrames[fi].StartAddress, targetFrames[fi].ReadByte)
                          .then(function (resp) {
                                modbus_result = resp.response._body.valuesAsArray
                                console.log(modbus_result)
                                //이제 여기서 데이터를 정규화 하는 작업 해야함
                                sensors = Details[targetFrames[fi].ChannelName + targetFrames[fi].FrameName]//detail객체
                                var targetData
                                var resData
                                for(let se = 0; se < sensors.length; se++){
                                    targetData = modbus_result[sensors[se].StartAddress+sensors[se].BitOffset-targetFrames[fi].StartAddress]
                                    switch(sensors[se].DataType){
                                        case 0://16bit unsigned int
                                            resData = Unsignedbit(targetData,16)
                                            break;
                                        case 1://16bit signed
                                            // console.log(targetData)
                                            resData = -32768 + Unsignedbit(targetData, 16)
                                            break;
                                        case 2://2 : 32bit unsigned int
                                            resData = Unsignedbit(targetData,32)
                                            break;
                                        case 3://3 : 32bit signed int
                                            resData = -2147483648 + Unsignedbit(targetData,32)
                                            break;
                                        case 4:// 4 : 32bit float
                                            resData = Unsignedbit(targetData,32)
                                            break;
                                        case 5://5 : 64bit double
                                            resData = -9223372036854775808 + Unsignedbit(targetData,64)
                                            break;
                                    }
                                    console.log(resData)
                                    //실시간 디비 넣는 작업 필요


                                }
                          }).catch(function () {
                            console.error(arguments)
                            sockets[i].end()
                          })
                      }, 2000)
                }
            }

        });     
        sockets[i].on("error", function () {//에러가 발생하면 어떻게 할건지
            console.log("errored", Channels[i])
        });     
        sockets[i].connect(options)// 실제로 포트를 열어준다.
    }

}