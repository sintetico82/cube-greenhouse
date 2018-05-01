import { Board, Led } from "johnny-five";
import express from "express";
import socketIo from "socket.io";
import { createServer, Server } from 'http';

import { Farmer } from "./farmer"

var Raspi = require("raspi-io");
var mustacheExpress = require('mustache-express');


var board = new Board({
    repl: false,
    io: new Raspi()
});


const env = process.env.NODE_ENV || 'development';


const app = express();
app.set('env', env);
// configure mustache as default template engine for html extention
let mustacheInstance = mustacheExpress();

if(env == "development")
    mustacheInstance.cache = null;

app.engine('html', mustacheInstance);
app.set('view engine', 'html');
app.set('views', __dirname + '/../views');
app.use(express.static(__dirname + "/public"));


var server = createServer(app);
var io = socketIo(server);

// Create e new farmer
var farmer = new Farmer();

board.on("ready", function () {
    var led = new Led(29); //GPIO21

    // turn on power LED
    led.on();

    // Web server routing
    app.get('/', function (req, res) { 
        res.render("index");
    });


    board.loop(2000,function() {

        farmer.checkTemperature(function(t : number,h: number) {
            io.sockets.emit("temperature", { temperature: t.toFixed(2), humidity: h.toFixed(2) });
        })

    });


    

    board.on("exit", function () {
        led.off();

        setTimeout(function() {
            console.log('Exit from board');
        }, 2000);
    })


    server.listen(process.env.PORT || 3000,function() {
        console.log( ("Server's up at http://localhost:%d"),process.env.PORT || 3000);
    })

});

