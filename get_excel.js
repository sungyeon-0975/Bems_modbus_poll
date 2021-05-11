const ExcelJS = require('exceljs')
const DBH  = require('./database.js')

const filePath = './latestExcel.xlsx'

var Channel={
    Id :'',
    Name : '',
    ComType : '',
    IpAddress : '',
    Port : '',
    Period : '',
    WaitTime : '',
    Active : ''
}
var Frame={
    Id : '',
    Name : '',
    ChannelId : '',
    FunctionCode : '',
    DeviceAddress : '',
    StartAddress : '',
    ReadByte : '',
    Active : ''
}
var Detail={
    Id : '',
    ObjectName : '',
    ChannelId : '',
    FrameId : '',
    ObjectType : '',
    LowLimit : '',
    HighLimit : '',
    StartAddress : '',
    BitOffset : '',
    DataType : '',
    Scale : '',
    Offset : '',
    RecordType : '',
    Units : ''
}
var Excel = {
    loadExcelFile: async function(filepath){
        const workbook = new ExcelJS.Workbook() // 엑셀의 객체
        await workbook.xlsx.readFile(filePath)
        for (let page = 0; page < 3; page++) {
            const sheetData = []
            const worksheet = workbook.worksheets[page] // 첫 번째 sheet 선택
            const options = { includeEmpty: true }
            // worksheet에 접근하여 데이터를 읽어옴
            await worksheet.eachRow(options, (row, rowNum) => {
                sheetData[rowNum] = []
                row.eachCell(options, (cell, cellNum) => {
                    sheetData[rowNum][cellNum] = { value:cell.value, style:cell.style }
                })
            })
            if( page == 0){ // Device 페이지
                DBH.device_delete('channels')// DB깔끔하게 밀어버리기
                for (let i = 2; i < sheetData.length; i++) {
                    Channel.Id          =sheetData[i][1].value
                    Channel.Name	    =sheetData[i][2].value
                    Channel.ComType		=sheetData[i][3].value
                    Channel.IpAddress	=sheetData[i][4].value
                    Channel.Port		=sheetData[i][5].value
                    Channel.Period		=sheetData[i][6].value
                    Channel.WaitTime	=sheetData[i][7].value
                    Channel.Active		=sheetData[i][8].value
                    // 이걸 DB에 저장해야함
                    console.log(Channel)
                    DBH.device_insert(page, Channel)
                }
            }
            else if(page ==1){//Frame 페이지
                DBH.device_delete('frames')// DB깔끔하게 밀어버리기
                for (let i = 2; i < sheetData.length; i++) {
                    Frame.Id            =sheetData[i][1].value
                    Frame.Name	        =sheetData[i][2].value
                    Frame.ChannelId		=sheetData[i][3].value
                    Frame.FunctionCode	=sheetData[i][4].value
                    Frame.DeviceAddress	=sheetData[i][5].value
                    Frame.StartAddress	=sheetData[i][6].value
                    Frame.ReadByte		=sheetData[i][7].value
                    Frame.Active		=sheetData[i][8].value
                    // 이걸 DB에 저장해야함
                    DBH.device_insert(page, Frame)
                }
            }
            else{//Detail 페이지
                DBH.device_delete('details')// DB깔끔하게 밀어버리기
                for (let i = 2; i < sheetData.length; i++) {
                    Detail.Id           =sheetData[i][1].value
                    Detail.ObjectName   =sheetData[i][2].value
                    Detail.ChannelId    =sheetData[i][3].value
                    Detail.FrameId      =sheetData[i][4].value
                    Detail.ObjectType   =sheetData[i][5].value
                    Detail.LowLimit     =sheetData[i][6].value 
                    Detail.HighLimit    =sheetData[i][7].value
                    Detail.StartAddress =sheetData[i][8].value
                    Detail.BitOffset    =sheetData[i][9].value
                    Detail.DataType     =sheetData[i][10].value
                    Detail.Scale        =sheetData[i][11].value
                    Detail.Offset       =sheetData[i][12].value
                    Detail.RecordType   =sheetData[i][13].value
                    Detail.Units        =(typeof sheetData[i][14] === 'undefined') ? '' : sheetData[i][14].value
                    DBH.device_insert(page, Detail)
                }
            }
        }
    }
}
module.exports = Excel