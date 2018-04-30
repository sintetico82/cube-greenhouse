import * as express from "express";
var mustacheExpress = require('mustache-express');
import * as path from "path";
var Raspi = require("raspi-io");
import { Board, Led } from "johnny-five";
var tempSensor = require('node-dht-sensor');

const app = express();
const server = require('http').createServer(app);


// Set view engine
app.engine('html', mustacheExpress());
app.set('view engine', 'htmlnpm so');
app.set("views", path.join(__dirname, "../views"));

app.get('/', function(req, res) { 
        res.render("index"); 
});

var board = new Board({
    repl: false,
    debug: false,
    io: new Raspi()
  });

board.on("ready",function() {

    const LEDpowerOn = new Led(29); // GPIO21

    LEDpowerOn.on();

    setInterval(function() {

        tempSensor.read(22, 4, function(err, temperature, humidity) {
          if (!err) {
              console.log('temp: ' + temperature.toFixed(1) + '°C, ' +
                  'humidity: ' + humidity.toFixed(1) + '%'
              );
          } else 
            console.log(err);
        });
      
    },2500);
    


    this.on("exit", function() {
        console.log('exit')
        LEDpowerOn.off();

    });

    server.listen(3000, function() { // Turn the server on
        console.log("Server's up at http://localhost:3000!");
    });

});

process.stdin.resume();