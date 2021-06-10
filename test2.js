
var mysql = require('mysql')
var config={
    host:"127.0.0.1",
    port: 8000,
    user: "root",
    password: "1231223",
    database: "bems",
}
var connection = mysql.createConnection(config)//연결안되서 터지면?
var tmp = connection.query('SELECT * from test;', config, (error, rows, fields) => {
    console.log(rows)
    connection.end()
});

