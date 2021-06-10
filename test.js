const pg = require('pg')
var config = {
  host:'127.0.0.1',
  user:'postgres',
  password:'123123',
  database:'test',
  port: 5432
}
const client =  new pg.Client(config)
client.connect()
client.query('SELECT * from pgtest where objectname=$1', ['1번'] ,(err, res) => {
//client.query('SELECT $1::text as message', ['Hello world!'],(err, res) => {
  if(err) throw err;
  console.log(err,res)
  client.end()
})