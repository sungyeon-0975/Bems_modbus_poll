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
    object_name : '',
    object_type : '',
    id : '',
    units : '',
    low_limit : '',
    high_limit : '',
    m_enable : '',
    m_ip : '',
    m_channel : '',
    m_func : '',
    m_addr : '',
    m_offsetbit : '',
    m_dattype : '',
    m_r_scale : '',
    m_r_offset	 : '',
    m_w_ip : '',
    m_w_id : '',
    m_w_fc : '',
    m_w_addr : '',
    m_w_datatype : '',
    m_w_scale : '',
    m_w_offset : '',
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
                    Detail.object_name   =sheetData[i][1].value
                    Detail.object_type   =sheetData[i][2].value
                    Detail.id           =sheetData[i][3].value
                    Detail.units        =(typeof sheetData[i][4] === 'undefined') ? '' : sheetData[i][4].value
                    Detail.low_limit     =sheetData[i][5].value
                    Detail.high_limit    =sheetData[i][6].value
                    Detail.m_enable     =sheetData[i][7].value
                    Detail.m_ip         =sheetData[i][8].value
                    Detail.m_channel    =sheetData[i][9].value
                    Detail.m_func       =sheetData[i][10].value
                    Detail.m_addr       =sheetData[i][11].value
                    Detail.m_offsetbit  =sheetData[i][12].value
                    Detail.m_dattype    =sheetData[i][13].value
                    Detail.m_r_scale    =sheetData[i][14].value
                    Detail.m_r_offset   =sheetData[i][15].value
                    Detail.m_w_ip       =(typeof sheetData[i][16] === 'undefined') ? null : sheetData[i][16].value
                    Detail.m_w_id       =(typeof sheetData[i][17] === 'undefined') ? null : sheetData[i][17].value
                    Detail.m_w_fc       =(typeof sheetData[i][18] === 'undefined') ? null : sheetData[i][18].value
                    Detail.m_w_addr     =(typeof sheetData[i][19] === 'undefined') ? null : sheetData[i][19].value
                    Detail.m_w_dattype =(typeof sheetData[i][20] === 'undefined') ? null : sheetData[i][20].value
                    Detail.m_w_scale    =(typeof sheetData[i][21] === 'undefined') ? null : sheetData[i][21].value.result
                    Detail.m_w_offset   =(typeof sheetData[i][22] === 'undefined') ? null : sheetData[i][22].value
                    DBH.device_insert(page, Detail)
                }
            }
        }
    }
}
module.exports = Excel