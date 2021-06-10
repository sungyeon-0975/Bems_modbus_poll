var mysql = require('mysql')

const connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '123123',
  database : 'bems'
});
connection.connect();

var Database = {
    device_select:function(table, callback){
        connection.query(`SELECT * from ${table}`, (error, rows, fields) => {
            if (error) throw error;
            callback(rows);
        })
    },
    device_delete:function(tablename){
        connection.query('DELETE from '+ tablename, (error, rows, fields) => {
            if (error) throw error;
        });
    },
    device_insert:function(page,data){
        if(page == 0){//Channel
            connection.query(`INSERT INTO Channels (id,name,com_type,ip_address,port,period,wait_time,active) 
            VALUES(${data.Id},'${data.Name}','${data.ComType}','${data.IpAddress}',${data.Port},${data.Period},${data.WaitTime},${data.Active})`, (error, rows, fields) => {
                if (error) throw error;
            });
        }
        else if(page == 1){//Frame
            connection.query(`INSERT INTO Frames (id,name,channel_id,function_code,device_address,start_address,read_byte,active)
            VALUES(${data.Id},'${data.Name}',${data.ChannelId},${data.FunctionCode},${data.DeviceAddress},${data.StartAddress},${data.ReadByte},${data.Active})`, (error, rows, fields) => {
                if (error) throw error;
            });
        }
        else{//Detail
            connection.query(`INSERT INTO Details (id,object_name,channel_id,frame_id,object_type,low_limit,high_limit,start_address,bit_offset,data_type,scale,offset,record_type,units)
             VALUES(${data.Id},'${data.ObjectName}',${data.ChannelId},${data.FrameId},'${data.ObjectType}',${data.LowLimit},${data.HighLimit},${data.StartAddress},${data.BitOffset},${data.DataType},${data.Scale},${data.Offset},${data.RecordType},'${data.Units}')`, (error, rows, fields) => {
                if (error) throw error;
            });
        }
        
    },
    database_insert:function(data){
        console.log(data)
        connection.query('INSERT database_details VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?); ', data, (error, rows, fields) => {
            if (error) throw error;
            console.log("inert success")
        })

    },
    database_get_ids:async function(){
        return new Promise(function(resolve, reject){
            connection.query('SELECT db_id FROM database_details;', (error, rows, fields) => {
                if (error) throw error;
                console.log(rows)
                db_ids = []
                for(let i= 0; i<rows.length; i++){
                    db_ids.push(rows[i].db_id)
                }
                resolve(db_ids)
            });
        });
    },
    database_get_row:async function(db_id){
        return new Promise(function(resolve, reject){
            connection.query('SELECT * FROM database_details where db_id=?',[db_id], (error, rows, fields) => {
                if (error) throw error;
                resolve(rows[0])
            });
        })
    },
    details_update:function(details_id, resData){
        connection.query(`UPDATE details SET update_date=now(), result=${resData} WHERE id=${details_id}`, (error, rows, fields) => {
            if (error) throw error;
        });
    },
    insert_realtime_table:function(params, time_value){
        //여기 upsert로 집어넣어야 할듯
        console.log("db time:################3", time_value)
        if(time_value === false){ // 시간데이터 없는 경우
            connection.query('INSERT INTO realtime_table VALUES(?,?,?,'+'now()'+',?,?,?) '+
            'ON DUPLICATE KEY UPDATE '+ 
            'objectname=?, logvalue=?, ctrlvalue=?, logtime=now(), object_type=?, com_type=?, com_id=?', params.concat(params), (error, rows, fields) => {
                if(error) console.log(error)
                else{
                    console.log("success");
                }
            })
        }
        else{//시간데이터 있는 경우
            connection.query('INSERT INTO realtime_table VALUES(?,?,?,\''+time_value+'\',?,?,?) '+
            'ON DUPLICATE KEY UPDATE '+
            'objectname=?, logvalue=?, ctrlvalue=?, logtime=\''+time_value+'\', object_type=?, com_type=?, com_id=?', params.concat(params), (error, rows, fields) => {
                if(error) console.log(error)
                else{
                    console.log("success");
                }
            })
        }
    },
    batch_insert: function(table_name, object_name, value){
        connection.query(`INSERT INTO ${table_name} (object_name, update_time, value) 
        VALUES ("${object_name}",now(),${value})`, (error, rows, fields) => {
            if (error) throw error;
        });
    },
    batch_select : function(table_name,object_name, time_interval,callback){
        connection.query(`SELECT avg(value) from ${table_name} where object_name = "${object_name}" and update_time between timestamp(DATE_SUB(NOW(), INTERVAL ${time_interval})) and timestamp(NOW())`, (error, rows, fields) => {
            if (error) throw error;
            callback(rows);
        });
    }

}
module.exports = Database