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
            console.log('User info is: ', rows);
            callback(rows);
        })
    },
    tableToJson:function(data){

    },
    device_delete:function(tablename){
        connection.query('DELETE from '+ tablename, (error, rows, fields) => {
            if (error) throw error;
            console.log('User info is: ', rows);
        });
    },
    device_insert:function(page,data){
        if(page == 0){//Channel
            connection.query(`INSERT INTO Channels (id,name,com_type,ip_address,port,period,wait_time,active) 
            VALUES(${data.Id},'${data.Name}','${data.ComType}','${data.IpAddress}',${data.Port},${data.Period},${data.WaitTime},${data.Active})`, (error, rows, fields) => {
                if (error) throw error;
                console.log('User info is: ', rows);
            });
        }
        else if(page == 1){//Frame
            connection.query(`INSERT INTO Frames (id,name,channel_id,function_code,device_address,start_address,read_byte,active)
            VALUES(${data.Id},'${data.Name}',${data.ChannelId},${data.FunctionCode},${data.DeviceAddress},${data.StartAddress},${data.ReadByte},${data.Active})`, (error, rows, fields) => {
                if (error) throw error;
                console.log('User info is: ', rows);
            });
        }
        else{//Detail
            connection.query(`INSERT INTO Details (id,object_name,channel_id,frame_id,object_type,low_limit,high_limit,start_address,bit_offset,data_type,scale,offset,record_type,units)
             VALUES(${data.Id},'${data.ObjectName}',${data.ChannelId},${data.FrameId},'${data.ObjectType}',${data.LowLimit},${data.HighLimit},${data.StartAddress},${data.BitOffset},${data.DataType},${data.Scale},${data.Offset},${data.RecordType},'${data.Units}')`, (error, rows, fields) => {
                if (error) throw error;
                console.log('User info is: ', rows);
            });
        }
        
    }
}
module.exports = Database