import { Board, Led } from "johnny-five";
import express from "express";
import socketIo from "socket.io";
import { createServer } from 'http';

import { Farmer } from "./farmer"


var Raspi = require("raspi-io");
var mustacheExpress = require('mustache-express');


var board = new Board({
    repl: false,
    io: new Raspi(),
    debug: false
});


const env = process.env.NODE_ENV || 'development';


const app = express();
app.set('env', env);
// configure mustache as default template engine for html extention
let mustacheInstance = mustacheExpress();

if (env == "development")
    mustacheInstance.cache = null;

app.engine('html', mustacheInstance);
app.set('view engine', 'html');
app.set('views', __dirname + '/../views');
app.use(express.static(__dirname + "/public"));
app.use('/css', express.static(__dirname + "/../src/public/css"));


var server = createServer(app);
var io = socketIo(server);



board.on("ready", function () {

    // Create e new farmer
    var farmer = new Farmer(board);
    farmer.checkWater();

    var led = new Led(0); //GPIO17

    // turn on power LED
    led.on();

    // Web server routing
    app.get('/', function (req, res) {
        res.render("index");
    });


    board.loop(2000, function () {

        farmer.checkTemperature(); // The temperature and humidity sensor need to read explicitly

    });


    farmer.on("temperature", function (data: any) {
        io.sockets.emit("temperature", data);
    });

    farmer.on("light", function (status: any) {
        io.sockets.emit("light",  { status: status, start: farmer.getStartTime(), end: farmer.getEndTime() });
    });

    farmer.on("water", function (status: boolean) {
        io.sockets.emit("water", status);
    })
    farmer.on("fan", function (status: boolean) {
        io.sockets.emit("fan", status);
    }) 

    


    io.on('connection', function (socket) {


        socket.on("ready", function () {

            farmer.getLightStatus(function (status: any) {
                io.sockets.emit("light", { status: status, start: farmer.getStartTime(), end: farmer.getEndTime() });
            });

        })

        socket.on('light-switch', function (checked:boolean) {
            checked ? farmer.lightOn() : farmer.lightOff();
        })
        socket.on('fan-switch', function (checked:boolean) {
            checked ? farmer.fanOn() : farmer.fanOff();
        })
        socket.on('set-light-time',function(data:any) {
            farmer.setLightTime(data.start,data.end);
        })
    });


    board.on("exit", function () {
        led.off();

        setTimeout(function () {
            console.log('Exit from board');
        }, 2000);
    })


    server.listen(process.env.PORT || 3000, function () {
        console.log(("Server's up at http://localhost:%d"), process.env.PORT || 3000);
    })

});

