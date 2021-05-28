const DBH = require('./database.js')
var mysql = require('mysql')

const net = require('net')
const { timeStamp } = require('console')
const { stringify } = require('querystring')
error_list = []

function Database() {
    db_id = 0
    db_ip = "",
    db_port = 0,
    db_type = "",
    db_userid = "",
    db_userpwd = "",
    db_name = "",
    db_tablename = "",
    object_name = "",
    log_value = "",
    lv_type = "",
    ctrl_value = "",
    cv_type = "",
    log_time = "",
    lt_type = "",
    object_type = ""
}
async function dabase_type_check(db_row) {
    return new Promise(function (resolve, reject) {
        var config
        console.log("start type check:", db_row)
        console.log("db_data is:....", db_row)
        console.log("db_row.db_type:",db_row.db_type)
        switch (db_row.db_type) {
            case 0://MS-SQL
            console.log("this database is MS-SQL")
                config = {
                    user: db_row.db_userid,
                    password: db_row.db_userpwd,
                    database: db_row.db_name,
                    server: db_row.db_ip
                }
                break;
            case 1://My-SQL
            console.log("this database is My-SQL")
                config = {
                    host: db_row.db_ip,
                    user: db_row.db_userid,
                    password: db_row.db_userpwd,
                    database: db_row.db_name
                }
                const connection = mysql.createConnection(config)//연결안되서 터지면?
                const tmp = connection.query('SELECT * from ?;',[db_row.db_tablename,config], (error, rows, fields) => {
                    if (error) {
                        console.log(error)
                        error_list.push(config)
                        resolve(false)
                    }
                    else {//DB접근에 문제가 없는 경우
                        console.log(rows);
                        resolve(rows)
                    }
                })
                break;
            case 2://Maria
            console.log("this database is Maria")
                config = {
                    host: db_row.db_ip,
                    user: db_row.db_userid,
                    password: db_row.db_userpwd,
                    database: db_row.db_name
                }
                break;
            case 3://Acces
            console.log("this database is Access")
                //.mdb에 접근해서 무언가 해야함.
                break;
            case 4://Excel
            console.log("this database is Excel")

                break;
            case 5://Text
            console.log("this database is Text")
                break;
            default:
            console.log("this is not option")
                break;
        }
    })
}
async function DatabaseStart() {
    //데이터 베이스의 개수를 가져오기
    //get db_id => 리스트에 담고 하나씩 가져오면서 통신을 진행한다.
    id_list = await DBH.database_get_ids()
    console.log(id_list)
    for (let i = 0; i < id_list.length; i++) {//id당 데이터를 받아온다.
        db_row = await DBH.database_get_row(id_list[i])
        //db종류가 먼지
        console.log("What DB type?");
        result = await dabase_type_check(db_row)
        if (result == false){
            continue
        }
        console.log(result)
        //db 통신 시작
    }

}
DatabaseStart()