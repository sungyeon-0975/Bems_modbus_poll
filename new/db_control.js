const ExcelJS = require('exceljs')
var mysql = require('mysql')
var pgsql = require('pg')

const filePath = './bidirectionExcel.xlsx'

DATABASE = []
CONNECT = {}
// key = [
//     'DB_Id',         'Details',
//     'DB_Ip',         'DB_Port',
//     'DB_Type',       'DB_Userid',
//     'DB_Userpwd',    'DB_Name',
//     'DB_TableName',  'DB_ObjectName',
//     'DB_ObjectType', 'DB_LogName',
//     'DB_LogType'
// ]

//Excel의 Database 긁어오기
async function get_database_info() {
    return new Promise(async (resolve, reject) => {//비동기로 엑셀에서 데이터를 긁어온다.
        console.log("[+] Get Excel Data : start")
        const workbook = new ExcelJS.Workbook() // 엑셀의 객체
        await workbook.xlsx.readFile(filePath)
        const sheetData = []
        const worksheet = workbook.worksheets[0]
        const options = { includeEmpty: true }
        await worksheet.eachRow(options, (row, rowNum) => {
            sheetData[rowNum] = []
            row.eachCell(options, (cell, cellNum) => {
                sheetData[rowNum][cellNum] = { value: cell.value, style: cell.style }
            })
        })
        //sheetData[0]은 비어있고, sheetData[1]은 컬럼들, sheetData[2]부터 데이터가 들어있다.
        //컬럼들로 구조체만들 key를 받아오기
        key = []
        for (let i = 1; i < sheetData[1].length; i++) {
            key.push(sheetData[1][i].value)
        }
        //DB정보를 전역변수에 담는다.
        for (let i = 2; i < sheetData.length; i++) {
            tmp = {}
            for (let j = 1; j < sheetData[i].length; j++) {
                tmp[key[j - 1]] = sheetData[i][j].value
            }
            DATABASE.push(tmp)//데이터객체를  넣어준다.
        }
        //console.log(DATABASE)
        console.log("[+] Get Excel Data : done")
        resolve(true)
    });
}
async function connect_mysql(config) {
    return new Promise((resolve, reject) => {
        var connection = mysql.createConnection(config)//연결안되면 어케 확인함?
        connection.connect(function (err) {
            if (err) {
                console.log("[-] connection fail!! / host :", config.host, err);
                connection.end()
                resolve(false)
            }
            else {
                console.log("[+] connection success / host : ", config.host)
                resolve(connection)
            }
        })
    })
}
async function connect_postgresql(config) {
    return new Promise((resolve, reject) => {
        var connection = new pgsql.Client(config);//pg의 Clinet객체를 이용하여 초기화
        connection.connect(function (err) {
            if (err) {
                console.log("[-] connection fail!! / host :", config.host, err);
                connection.end()
                resolve(false)
            }
            else {
                console.log("[+] connection success / host : ", config.host)
                resolve(connection)
            }
        })
    })
}
function set_database() {
    return new Promise(async (resolve, reject) => {
        console.log("[+] Connect Database : start")
        //DATABASE의 리스트에서 DB정보를 하나씩 꺼내와서 연결시켜놓는다.
        for (let i = 0; i < DATABASE.length; i++) {
            switch (DATABASE[i].DB_Type) {
                case 0://MS-SQL
                    console.log("This database is MS-SQL")
                    config = {
                        user: DATABASE[i].DB_Userid,
                        password: DATABASE[i].DB_Userpwd.toStrnig(),
                        database: DATABASE[i].DB_Name,
                        server: DATABASE[i].DB_Ip
                    }
                    break;
                case 1://My-SQL
                    console.log("This database is My-SQL")
                    config = {
                        host: DATABASE[i].DB_Ip,
                        port: DATABASE[i].DB_Port,
                        user: DATABASE[i].DB_Userid,
                        password: DATABASE[i].DB_Userpwd.toString(),
                        database: DATABASE[i].DB_Name,
                        connectTimeout: 5000
                    }
                    check = await connect_mysql(config)
                    if (check) {
                        CONNECT[DATABASE[i].DB_Id] = check;
                    }
                    break;
                case 2://Maria mysql 과 동일함
                    console.log("This database is Maria")
                    config = {
                        host: DATABASE[i].DB_Ip,
                        port: DATABASE[i].DB_Port,
                        user: DATABASE[i].DB_Userid,
                        password: DATABASE[i].DB_Userpwd,
                        database: DATABASE[i].DB_Name,
                        connectTimeout: 5000
                    }
                    check = await connect_mysql(config)
                    if (check) {
                        CONNECT[DATABASE[i].DB_Id] = check;
                    }
                    break;
                case 3://PostgreSQL
                    console.log("This database is postgreSQL")
                    //여기서 postgre접근한뒤 config 설정해준다.
                    config = {
                        host: DATABASE[i].DB_Ip,
                        port: DATABASE[i].DB_Port,
                        user: DATABASE[i].DB_Userid,
                        password: DATABASE[i].DB_Userpwd,
                        database: DATABASE[i].DB_Name
                    }
                    check = await connect_postgresql(config)//연결이 되면 connection을 반환한다.바로 접근가능해짐
                    if (check) {
                        CONNECT[DATABASE[i].DB_Id] = check;
                    }
                    break;
                case 4://Acces
                    console.log("This database is Acces")
                    //.mdb에 접근해서 무언가 해야함.
                    break;
                default:
                    console.log("[-] This is Wrong DataType, DB_Id is :", DATABASE[i].DB_Id)
                    break;
            }
        }
        resolve(true)
        console.log("[+] Connect Database : done")
    })
}
function disconnect_all() {
    keys = Object.keys(CONNECT)
    for (let i = 0; i < keys.length; i++) {
        CONNECT[keys[i]].end()
    }
    console.log("[+] Successfully Connection Ended");
}
async function start_sending() {
    //엑셀에 접근하여 한 행마다 비동기로 데이터를 주고 받게 만들어준다.
    console.log("[+] Start Sending Data : start")
    const workbook = new ExcelJS.Workbook() // 엑셀의 객체
    await workbook.xlsx.readFile(filePath)
    const sheetData = []
    const worksheet = workbook.worksheets[1]//page 설정
    const options = { includeEmpty: true }
    await worksheet.eachRow(options, (row, rowNum) => {
        sheetData[rowNum] = []
        row.eachCell(options, (cell, cellNum) => {
            sheetData[rowNum][cellNum] = { value: cell.value, style: cell.style }
        })
    })
    //본격적인 전송시작
    //비동기로 돌기때문에 순서에 구애받지 않고 데이터를 가져오고 전송한다.
    console.log("[+] Start Sending data : working...")
    //컬럼들로 구조체만들 key를 받아오기
    key = []
    for (let i = 1; i < sheetData[1].length; i++) {
        key.push(sheetData[1][i].value)
    }
    for (let i = 2; i < sheetData.length; i++) {
        //데이터를 구조에 맞게 편집
        tmp = {}
        for (let j = 1; j < sheetData[i].length; j++) {
            tmp[key[j - 1]] = sheetData[i][j].value
        }
        //S_DB_Id가 존재하는지 && R_DB_Id가 존재하는지
        if (Object.keys(CONNECT).includes(tmp.S_DB_Id.toString()) && Object.keys(CONNECT).includes(tmp.R_DB_Id.toString())) {
            console.log("both exist")
        } else {
            console.log("can't connect")
            continue;
        }
        //둘다 통신가능한 경우 S_DB_Id에서 데이터를 가져온다. (비동기)
        select_update(tmp);
        // R_DB_Id에서 데이터를 수정한다.(비동기)
    }
}
async function select_update(row) {
    //table명, object명, 등등을 받아서 query를 날려야함.
    var S_database;
    var R_database;
    for (let i = 0; i < DATABASE.length; i++) {
        if(DATABASE[i].DB_Id == row.S_DB_Id){
            S_database = DATABASE[i]
        }
        if(DATABASE[i].DB_Id == row.R_DB_Id){
            R_database = DATABASE[i]
        }
        if(S_database != undefined && R_database != undefined){
            console.log("[.] find S_database and R_database")
            break;
        }
    }
    if(S_database == undefined || R_database == undefined){//둘중에 데이터가 하나가 비어있거나 매칭이 안되는경우
        console.log("[-] Database ID is wrong")
        console.log("[.] check table : ", row)
        return // 계산하지 않고 함수 종료시킨다
    }
    //ObjectName의 형식이 int거나 char일수 있으므로 이에대한 필터링이 필요함
    sqlstring = `SELECT * from ${S_database.DB_TableName} where ${S_database.DB_ObjectName}='${row.S_Objectname}';`
    //
    //
    var value = await (async function () {
        return new Promise((resolve, reject) => {
            CONNECT[row.S_DB_Id.toString()].query(`SELECT * from ${S_database.DB_TableName} where ${S_database.DB_ObjectName}='${row.S_Objectname}';`, (err, res) => {
                if (err) {
                    console.log(err)
                    resolve()
                } else {
                    console.log(res)
                    resolve(res)
                }
            })
        })
    })()
    if(value == undefined){
        return
    }
    //ObjectName의 형식이 int거나 char일수 있으므로 이에대한 필터링이 필요함
    console.log(S_database.DB_LogName)
    console.log(value)
    sqlstring = `UPDATE ${R_database.DB_TableName} SET ${R_database.DB_LogName}=${value[0][S_database.DB_LogName]} WHERE ${R_database.DB_ObjectName}='${row.R_Objectname}';`
    //
    //
    console.log(sqlstring)
    CONNECT[row.S_DB_Id.toString()].query(sqlstring, (err, res) => {
        if (err) {
            console.log(err)
        } else {
            console.log(res)
        }
    })
}

async function main() {
    await get_database_info()//DB의 정보를 받는다.
    //DB의 정보를 받았기 때문에 각 객체에 대해 sql 연결을 진행한다.
    await set_database()
    //Excel에서 다시 데이터를 하나씩 받으며 통신을 시작한다. (비동기로 진행한다)
    start_sending()
    //통신이 종료되면 모든 CONNECT의 값들을 end시킨다.(아마 쓸일 거의 없을듯)
    //disconnect_all();
}
main()