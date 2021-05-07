var express = require('express');
var app = express();
const bodyParser = require('body-parser'); 
app.use(bodyParser.json()); 


var mysql = require('mysql')
// var connection = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: 'College_10!',
//     database: 'whmcs'
// })

var pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'College_10!',
    database: 'whmcs'
})

const cors = require("cors");

app.use(cors());

app.post('/closedtickets', function(req, res){

    pool.getConnection(function (err, connection) {

    var date = req.body.date;
    var did = req.body.did;
    console.log(date)
    console.log(did)


    var sql = `select date_format(date(a.date),'%c/%d/%Y')  as 'DateOpened',
                    a.tid         as 'TicketNum',
                    a.title       as 'TicketTitle',
                    c.companyname as 'Client',
                    date_format(date(b.date),'%c/%d/%Y')  as 'ClosedDate'
                from tbltickets a
                      join tblticketlog b
                        on a.id = b.tid
                      join tblclients c
                        on a.userid = c.id
                where month(b.date) = month(date("${date}"))
                and year(b.date) = year(date("${date}"))
                and a.did = ${did}
                and b.action like '%Closed%'
                and a.status = 'Closed'
                order by a.title`

    connection.query(sql, 
    function (err, rows, fields) {

      res.send(rows)
    
    });
    connection.release();
    });

}); 


app.post('/opentickets', function(req, res){

    pool.getConnection(function (err, connection) {
    console.log(req.params.admin)
    var did = req.body.did;


    var sql = `select cast(tid as char)                   as 'TicketNum',
                title                               as 'TicketSubject', 
                firstname                           as 'AssignedTo',
                status                              as 'CurrentStatus',
                date_format(date(date), '%M %e %Y') as 'DateOpened',
                datediff(curdate(), date)           as 'DaysSinceOpened',
                datediff(curdate(), lastreply)      as 'DayssinceLastReply'
                from tbltickets,
                tbladmins
                where did = ${did}
                and status != 'Closed'
                and date > date_sub(curdate(), interval 1 year)
                and ifnull(tbltickets.flag, 0) = tbladmins.id
                order by date;`

    connection.query(sql, 
    function (err, rows, fields) {

       res.send(rows);
    
    });
    connection.release();
    });

}); 


app.post('/test', function(req, res){

  pool.getConnection(function (err, connection) {


  var date = req.body.date;
  var did = req.body.did;

  var sql = `select IFNULL(AVG(DATEDIFF(b.date, a.date)), 0) AS 'Average Days to Close - Today'
  FROM tbltickets a
        join tblticketlog b
          on a.id = b.tid
  WHERE did = ${did}
    and status = 'Closed'
    and DATE(a.date) = DATE(${date})
    and b.action like '%Closed%';`

  connection.query(sql, 
  function (err, rows, fields) {

     console.log(rows);
     res.send(rows);
  
  });
  connection.release();
  });

}); 

app.post('/daystocloseday', function(req, res){

    pool.getConnection(function (err, connection) {


    var date = req.body.date;
    var did = req.body.did;

    var sql = `select IFNULL(AVG(DATEDIFF(b.date, a.date)), 0) AS 'AverageDaystoClose'
    FROM tbltickets a
          join tblticketlog b
            on a.id = b.tid
    WHERE did = ${did}
      and status = 'Closed'
      and DATE(a.date) = DATE(${date})
      and b.action like '%Closed%'
      and a.merged_ticket_id = 0;`

    connection.query(sql, 
    function (err, rows, fields) {

       console.log(rows);
       res.send(rows[0]);
    
    });
    connection.release();
    });

}); 

app.post('/daystocloseweek', function(req, res){

    pool.getConnection(function (err, connection) {

    var date = req.body.date;
    var did = req.body.did;

    var sql = `select IFNULL(AVG(DATEDIFF(b.date, a.date)), 0) AS 'AverageDaystoClose'
    FROM tbltickets a
          join tblticketlog b
            on a.id = b.tid
    WHERE did = ${did}
      AND status = 'Closed'
      and b.action like '%Closed%'
      AND b.date >= DATE_SUB(DATE("${date}"), INTERVAL WEEKDAY(DATE("${date}")) DAY)
      and b.date <= DATE_ADD(DATE("${date}"), INTERVAL (7 - WEEKDAY(DATE("${date}"))) day)
      and a.merged_ticket_id = 0;`

    connection.query(sql, 
    function (err, rows, fields) {

       console.log(rows);
       res.send(rows[0]);
    
    });
    connection.release();
    });

}); 

app.post('/daystoclosemonth', function(req, res){

    pool.getConnection(function (err, connection) {
    
    var date = req.body.date;
    var did = req.body.did;

    var sql = `select IFNULL(AVG(DATEDIFF(b.date, a.date)), 0) AS 'AverageDaystoClose'
    FROM tbltickets a
          join tblticketlog b
            on a.id = b.tid
    WHERE did = ${did}
      AND status = 'Closed'
      and b.action like '%Closed%'
      AND MONTH(b.date) = MONTH(DATE("${date}"))
      AND YEAR(b.date) = YEAR(DATE("${date}"))
      and DATE(b.date) <= DATE(DATE("${date}"))
      and a.merged_ticket_id = 0;`

    connection.query(sql, 
    function (err, rows, fields) {

       console.log(rows);
       res.send(rows[0]);
    
    });
    connection.release();
    });

}); 

app.post('/daystocloseyear', function(req, res){

    pool.getConnection(function (err, connection) {
    
    var date = req.body.date;
    var did = req.body.did;

    var sql = `select IFNULL(AVG(DATEDIFF(b.date, a.date)), 0) AS 'AverageDaystoClose'
    FROM tbltickets a
          join tblticketlog b
            on a.id = b.tid
    WHERE did = ${did}
      AND status = 'Closed'
      and b.action like '%Closed%'
      AND YEAR(b.date) = YEAR(DATE("${date}"))
      and DATE(b.date) <= DATE(DATE("${date}"))
      and a.merged_ticket_id = 0;`

    connection.query(sql, 
    function (err, rows, fields) {

       console.log(rows);
       res.send(rows[0]);
    
    });
    connection.release();
    });

}); 

app.post('/timetofirstreplyday', function(req, res){

    pool.getConnection(function (err, connection) {
    
    var date = req.body.date;
    var did = req.body.did;

    var sql = `select IFNULL(SEC_TO_TIME(ROUND(AVG(ABS(TIMESTAMPDIFF(second, TIME(IFNULL(first_reply, date)), TIME(date)))), 0)),
    SEC_TO_TIME(0)) as "AverageTimetoFirstReply"
    from tbltickets
    where did = ${did}
      and date(date) = date("${date}")
      and date != first_reply;`

    connection.query(sql, 
    function (err, rows, fields) {

       console.log(rows);
       res.send(rows[0]);
    
    });
    connection.release();
    });

}); 

app.post('/timetofirstreplyweek', function(req, res){

    pool.getConnection(function (err, connection) {
    
    var date = req.body.date;
    var did = req.body.did;

    var sql = `select IFNULL(SEC_TO_TIME(ROUND(AVG(ABS(TIMESTAMPDIFF(second, TIME(IFNULL(first_reply, date)), TIME(date)))), 0)),
    SEC_TO_TIME(0)) as "AverageTimetoFirstReply"
    from tbltickets
    where did = ${did}
      and date >= DATE_SUB(DATE("${date}"), INTERVAL WEEKDAY(DATE("${date}")) DAY)
      and date <= DATE_ADD(DATE("${date}"), INTERVAL (7 - WEEKDAY(DATE("${date}"))) day)
      and date != first_reply;`

    connection.query(sql, 
    function (err, rows, fields) {

       console.log(rows);
       res.send(rows[0]);
    
    });
    connection.release();
    });

}); 

app.post('/timetofirstreplymonth', function(req, res){

    pool.getConnection(function (err, connection) {
    var date = req.body.date;
    var did = req.body.did;

    var sql = `select IFNULL(SEC_TO_TIME(ROUND(AVG(ABS(TIMESTAMPDIFF(second, TIME(IFNULL(first_reply, date)), TIME(date)))),0)),
    SEC_TO_TIME(0)) as "AverageTimetoFirstReply"
    from tbltickets
    where did = ${did}
      and DATE(date) <= date("${date}")
      and MONTH(date) = MONTH(date("${date}"))
      and YEAR(date) = YEAR(date("${date}"))
      and date != first_reply;`

    connection.query(sql, 
    function (err, rows, fields) {

       console.log(rows);
       res.send(rows[0]);
    
    });
    connection.release();
    });

}); 

app.post('/timetofirstreplyyear', function(req, res){

    pool.getConnection(function (err, connection) {
    var date = req.body.date;
    var did = req.body.did;

    var sql = `select IFNULL(SEC_TO_TIME(ROUND(AVG(ABS(TIMESTAMPDIFF(second, TIME(IFNULL(first_reply, date)), TIME(date)))), 0)),
    SEC_TO_TIME(0)) as "AverageTimetoFirstReply"
    from tbltickets
    where did = ${did}
      and DATE(date) <= date("${date}")
      and YEAR(date) = YEAR(date("${date}"))
      and date != first_reply;`

    connection.query(sql, 
    function (err, rows, fields) {

       console.log(rows);
       res.send(rows[0]);
    
    });
    connection.release();
    });

}); 

app.post('/ticketsopenday', function(req, res){

    pool.getConnection(function (err, connection) {
    var date = req.body.date;
    var did = req.body.did;

    var sql = `select count(date) as 'SupportTicketsOpened'
    from tbltickets
    where DATE(date) = DATE("${date}")
    and merged_ticket_id = '0'
      and did = ${did};`

    connection.query(sql, 
    function (err, rows, fields) {

       console.log(rows);
       res.send(rows[0]);
    
    });
    connection.release();
    });

}); 

app.post('/ticketsopenweek', function(req, res){

    pool.getConnection(function (err, connection) {
    var date = req.body.date;
    var did = req.body.did; 

    var sql = `select count(date) as 'SupportTicketsOpened'
    from tbltickets
    where date >= DATE_SUB(DATE("${date}"), INTERVAL WEEKDAY(DATE("${date}")) DAY)
      and date <= DATE_ADD(DATE("${date}"), INTERVAL (7 - WEEKDAY(DATE("${date}"))) day)
      and merged_ticket_id = '0'
      and did = ${did};`

    connection.query(sql, 
    function (err, rows, fields) {

       console.log(rows);
       res.send(rows[0]);
    
    });
    connection.release();
    });

}); 

app.post('/ticketsopenmonth', function(req, res){

    pool.getConnection(function (err, connection) {
    var date = req.body.date;
    var did = req.body.did; 

    var sql = `select count(date) as 'SupportTicketsOpened'
    from tbltickets
    where month(date) = month(DATE("${date}"))
      AND year(date) = year(DATE("${date}"))
      and DATE(date) <= DATE(DATE("${date}"))
      and merged_ticket_id = '0'
      and did = ${did};`

    connection.query(sql, 
    function (err, rows, fields) {

       console.log(rows);
       res.send(rows[0]);
    
    });
    connection.release();
    });

}); 

app.post('/ticketsopenyear', function(req, res){

    pool.getConnection(function (err, connection) {
    var date = req.body.date;
    var did = req.body.did; 

    var sql = `select count(date) as 'SupportTicketsOpened'
    from tbltickets
    where year(date) = year(DATE("${date}"))
      and DATE(date) <= DATE(DATE("${date}"))
    and merged_ticket_id = '0'
    and did = ${did};`

    connection.query(sql, 
    function (err, rows, fields) {

       console.log(rows);
       res.send(rows[0]);
    
    });
    connection.release();
    });

}); 

app.post('/ticketsclosedday', function(req, res){

    pool.getConnection(function (err, connection) {
    console.log(req.params.admin)

    var date = req.body.date;
    var did = req.body.did; 

    var sql = `select count(distinct b.tid) as 'SupportTicketsClosed'
    from tbltickets a
      join tblticketlog b
        on a.id = b.tid
    where DATE(b.date) = DATE(DATE("${date}}"))
      and a.did = ${did}
      and a.status = 'Closed'
      and a.merged_ticket_id = '0'
      and b.action LIKE '%Closed%';`

    connection.query(sql, 
    function (err, rows, fields) {

       console.log(rows);
       res.send(rows[0]);
    
    });
    connection.release();
    });

}); 

app.post('/ticketsclosedweek', function(req, res){

    pool.getConnection(function (err, connection) {

    var date = req.body.date;
    var did = req.body.did; 

    var sql = `select count(distinct b.tid) as 'SupportTicketsClosed'
    from tbltickets a
      join tblticketlog b
        on a.id = b.tid
    where b.date >= DATE_SUB(DATE("${date}"), INTERVAL WEEKDAY(DATE("${date}")) DAY)
      and b.date <= DATE_ADD(DATE("${date}"), INTERVAL (7 - WEEKDAY(DATE("${date}"))) day)
      and a.did = ${did}
      and a.status = 'Closed'
      and a.merged_ticket_id = '0'
      and b.action LIKE '%Closed%';`

    connection.query(sql, 
    function (err, rows, fields) {

       console.log(rows);
       res.send(rows[0]);
    
    });
    connection.release();
    });

}); 

app.post('/ticketsclosedmonth', function(req, res){

    pool.getConnection(function (err, connection) {

    var date = req.body.date;
    var did = req.body.did; 

    var sql = `select count(distinct b.tid) as 'SupportTicketsClosed'
    from tbltickets a
      join tblticketlog b
        on a.id = b.tid
    where month(b.date) = month(DATE("${date}"))
      AND year(b.date) = year(DATE("${date}"))
      and DATE(b.date) <= DATE(DATE("${date}"))
      and did = ${did}
      and status = 'Closed'
      and a.merged_ticket_id = '0'
      and b.action LIKE '%Closed%';`

    connection.query(sql, 
    function (err, rows, fields) {

       console.log(rows);
       res.send(rows[0]);
    
    });
    connection.release();
    });

}); 

app.post('/ticketsclosedyear', function(req, res){

    pool.getConnection(function (err, connection) {

    var date = req.body.date;
    var did = req.body.did; 

    var sql = `select count(distinct b.tid) as 'SupportTicketsClosed'
    from tbltickets a
      join tblticketlog b
        on a.id = b.tid
    where year(b.date) = year(DATE("${date}"))
      and DATE(b.date) <= DATE(DATE("${date}"))
      and did = ${did}
      and status = 'Closed'
      and a.merged_ticket_id = '0'
      and b.action like '%Closed%';`

    connection.query(sql, 
    function (err, rows, fields) {

       console.log(rows);
       res.send(rows[0]);
    
    });
    connection.release();
    });

}); 

app.post('/avgticketageday', function(req, res){

    pool.getConnection(function (err, connection) {

    var date = req.body.date;
    var did = req.body.did; 

    var sql = `select a.date as 'Open Date',
    b.date as 'Closed Date',
    DATEDIFF(b.date, a.date) as 'DaysOpen'
    from tbltickets a
      join tblticketlog b
        on a.id = b.tid
    where a.status = 'Closed'
    and a.did = ${did}
    and b.action LIKE '%Closed%'
    and DATE(a.date) = DATE("${date}");`

    connection.query(sql, 
    function (err, rows, fields) {

      var returnAvg = 0;

      for(i=0; i<rows.length; i++){
        returnAvg += rows[i].DaysOpen;
      }

      returnAvg = Math.round((returnAvg/rows.length) * 10)/10

      if(!returnAvg) {
        returnAvg = "N/A"
        res.send(returnAvg)
      } else {
        res.send(returnAvg.toString());
      }
    
    });
    connection.release();
    });

}); 

app.post('/avgticketageweek', function(req, res){

    pool.getConnection(function (err, connection) {

    var date = req.body.date;
    var did = req.body.did; 

    var sql = `select DISTINCT b.tid as 'Ticket #',
    a.date as 'Open Date',
           b.date as 'Closed Date',
           DATEDIFF(b.date, a.date) as 'DaysOpen'
    from tbltickets a
      join tblticketlog b
        on a.id = b.tid
    where a.status = 'Closed'
    and a.did = ${did}
    and b.action LIKE '%Closed%'
      and a.date >= DATE_SUB(DATE("${date}"), INTERVAL WEEKDAY(DATE("${date}")) DAY)
      and a.date <= DATE_ADD(DATE("${date}"), INTERVAL (7 - WEEKDAY(DATE("${date}"))) day)`

    connection.query(sql, 
    function (err, rows, fields) {

      var returnAvg = 0;

      for(i=0; i<rows.length; i++){
        returnAvg += rows[i].DaysOpen;
      }

      returnAvg = Math.round((returnAvg/rows.length) * 10)/10

      if(!returnAvg) {
        returnAvg = "N/A"
        res.send(returnAvg)
      } else {
        res.send(returnAvg.toString());
      }
    
    });
    connection.release();
    });

}); 

app.post('/avgticketagemonth', function(req, res){

    pool.getConnection(function (err, connection) {
    
    var date = req.body.date;
    var did = req.body.did; 

    var sql = `select DISTINCT a.tid as 'Ticket #',
    a.date as 'Open Date',
           ifnull(b.date, curdate()) as 'Closed Date',
           DATEDIFF(ifnull(b.date, curdate()), a.date) as 'DaysOpen'
    from tbltickets a
      join tblticketlog b
        on a.id = b.tid
    where a.status = 'Closed'
    and a.did = ${did}
    and b.action LIKE '%Closed%'
    and a.date <= DATE("${date}")
      and MONTH(a.date) = MONTH(DATE("${date}"))
    and YEAR(a.date) = YEAR(DATE("${date}"));`

    connection.query(sql, 
    function (err, rows, fields) {

      var returnAvg = 0;

      for(i=0; i<rows.length; i++){
        returnAvg += rows[i].DaysOpen;
      }

      returnAvg = Math.round((returnAvg/rows.length) * 10)/10

      if(!returnAvg) {
        returnAvg = "N/A"
        res.send(returnAvg)
      } else {
        res.send(returnAvg.toString());
      }
    
    });
    connection.release();
    });

}); 

app.post('/avgticketageyear', function(req, res){

    pool.getConnection(function (err, connection) {
    var date = req.body.date;
    var did = req.body.did; 

    var sql = `select a.date as 'Open Date',
    b.date as 'Closed Date',
    DATEDIFF(b.date, a.date) as 'DaysOpen'
    from tbltickets a
      join tblticketlog b
        on a.id = b.tid
    where a.status = 'Closed'
    and a.did = ${did}
    and b.action LIKE '%Closed%'
    and a.merged_ticket_id = 0
    and YEAR(a.date) = YEAR(DATE("${date}"))
    and a.date <= DATE("${date}");`

    connection.query(sql, 
    function (err, rows, fields) {

      var returnAvg = 0;

      for(i=0; i<rows.length; i++){
        returnAvg += rows[i].DaysOpen;
      }

      returnAvg = Math.round((returnAvg/rows.length) * 10)/10

      if(!returnAvg) {
        returnAvg = "N/A"
        res.send(returnAvg)
      } else {
        res.send(returnAvg.toString());
      }
    
    });
    connection.release();
    });

}); 

app.post('/ageofopentickets', function(req, res){

    pool.getConnection(function (err, connection) {
      if(err) {
        console.log(err);
      }
    var did = req.body.did;

    var sql = `select ROUND(avg(datediff(date(curdate()), date)), 2) as 'AverageTicketAge'
    from tbltickets
    where did = ${did}
      and NOT status = 'Closed';`

    connection.query(sql, 
    function (err, rows, fields) {
  
       res.send(rows[0]);
    
    });
    connection.release();
    });

}); 



var server = app.listen(process.env.PORT || 4000, function () {
    console.log('Server is running..');
});