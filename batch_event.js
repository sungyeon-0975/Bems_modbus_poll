const DBH = require('./database.js');
const cronJob = require('cron').CronJob;

var object_type = {}
var object_values = {}

DBH.device_select('details', function (rows) {
    rows.forEach(row => {
        object_type[row["object_name"]] = row["record_type"]
        object_values[row["object_name"]] = []
    })
})

const jobs = [
    {
        pattern: '0 */5 * * * *',
        message: 'this runs every 5 minutes',
        get : '1minute',
        table : '5minute',
        time_interval : '5 minute'
    },
    {
        pattern: '0 */15 * * * *',
        message: 'this runs every 15 minutes',
        get : '5minute',
        table : '15minute',
        time_interval : '15 minute'
    },
    {
        pattern: '0 */30 * * * *',
        message: 'this runs every 30 minutes',
        get : '15minute',
        table : '30minute',
        time_interval : '30 minute'
    },
    {
        pattern: '0 0 */1 * * *',
        message: 'this runs every 1 hour',
        get : '30minute',
        table : '1hour',
        time_interval : '1 hour'
    },
    {
        pattern: '0 0 0 */1 * *',
        message: 'this runs every 1 day',
        get : '1hour',
        table : '1day',
        time_interval : '1 day'
    }
];



new cronJob('*/10 * * * * *', () => {
    console.log('this runs every 10 seconds', new Date());
    DBH.device_select('details', function (rows) {
        rows.forEach(row => {      
            object_values[row["object_name"]].push(row["result"])
        })
    })
    // setTimeout(()=>console.log('after timeout'),11000)
}).start();

new cronJob('0 */1 * * * *', () => {
    console.log('this runs every 1 minute', new Date());
    for (const [key, value] of Object.entries(object_values)) {
        const sum = value.reduce((a, b) => a + b, 0);
        const avg = (sum / value.length) || 0;
        DBH.batch_insert('1minute', key , avg )
        object_values[key] = []
      }
}).start();

jobs.forEach(job => {
    new cronJob(job.pattern, () => {
        console.log(job.message, new Date());
        for (const [key, value] of Object.entries(object_values)) {
            DBH.batch_select(job.get,key,job.time_interval,function (rows) {
                if (rows[0]["avg(value)"] != null){
                    DBH.batch_insert(job.table, key, rows[0]["avg(value)"])
                }
            })
          }
    }).start();    
});

//아직 record_type에 대한 처리는 안함
//일단 지금은 잘 도는데 혹시나 연산량 많아지면 스케쥴러가 잘 안돌지도 몰름
