var amqp = require('amqp'),util = require('util');


var rbmqhost='localhost';
var queues = ["flutura"];
var httpport = '8080';
//var logger = require('./logger.js').logger;
var express = require('express');


var app = express();
app.use(express.bodyParser());
app.listen(httpport);

// Wait for connection to become established.
var connOn=false;
var qs = [];

var conOnReady= function () {
  connOn=true;
  loggerm("connection ready");
  for(var i=0;i<queues.length;i++){
    q = connection.queue(queues[i],{autoDelete:false,closeChannelOnUnsubscribe: true}, qOnReady);
    qs[i]=q;
   }
}



app.get('/flutura',function(req,res){

var msg = req.query['q'];
loggerm("received "+msg);
connection.publish(queues[0],msg);
res.send(msg);

res.end();

});


app.post('/flutura',function(req,res){

var msg = req.body;
loggerm("post received "+req.body);
connection.publish(queues[0],msg);
res.send(msg);
res.end();

});
var connection = null;
function launch(){
loggerm("starting up");

connection = amqp.createConnection({ host: rbmqhost },{reconnect:false});
loggerm("created connection ");
connection.on('ready',conOnReady);





connection.on('close',function(){ 
loggerm('connection close called ');
connOn=false;

});

connection.on('error',function(err){
loggerm("connection errored out "+err);
//loggerm("connection errored out );
loggerm(err);
 setTimeout(launch,5000);
});



}

function qOnReady(q){
 // Catch all messages
  loggerm("Q "+q.name+" is ready");
  q.bind('#');
 // Receive messages
  q.subscribe({cosumerTag:q.name},subscriber);
  
}


function subscriber(message,headers,deliveryinfo){
  loggerm("am i "+message);

var msg = message.data.toString();

loggerm("received from rab"+msg);

}



function errHandler(err){
if(err) throw err;


}

 function sleep(milliSeconds) {
    var startTime = new Date().getTime();
    while (new Date().getTime() < startTime + milliSeconds);
  }

function loggerm(mess){// because during shutdown winston would still be buffering so we will use loggerm
console.log(mess);

} 

function shutdown(){
  loggerm( "\n trying to gracefully shut down from  SIGINT (Crtl-C)" );
  loggerm("Calling  connection end");
  connection.end();
 
	process.exit();

}



process.on( 'SIGINT', shutdown);

process.on('uncaughtException', function (exception) {
    loggerm("unexcepted exception :"+exception.stack+ " Date : "+new Date());
    shutdown();    
  });


launch();

//TODO 1. graceful exit test 2. Log file rotation and config 3.File rotation to be synchronized 4. proper config 5 .fs operations to be flushed before shutdown
//TODO seperate buckets for different teams


