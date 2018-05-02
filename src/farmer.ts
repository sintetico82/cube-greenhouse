var sensor = require('node-dht-sensor');
import { Led, Board, Pin, LCD } from "johnny-five";
import util from "util";
import cron, { CronJob } from "cron";
import EventEmitter from "events";

export class Farmer extends EventEmitter {

    private board: Board;
    private readonly TEMP_HUMIDITY_PIN: number = 4;
    private readonly LIGHT_PIN: number = 22;//GPIO6


    private readonly LIGHT_HOUR_START: number = 20;
    private readonly LIGHT_HOUR_END : number = 25;

    private readonly FAN_PIN: number = 24; // GPIO19

    private light = new Led(this.LIGHT_PIN); //GPIO6
    private pinFan = new Pin(this.FAN_PIN); // GPIO19
    private lcd = new LCD({
        controller: "PCF8574"
    });

    private isLightOn : boolean = false;

    private jobCheckTheLight : CronJob;

    

    constructor(board: Board) {
        super();
        this.board = board;

        let light = this.light;
        let pinFan = this.pinFan;
        let lcd = this.lcd;
        this.board.on("exit", function () {
            light.off();
            pinFan.low();
            lcd.off();
        });


        this.jobCheckTheLight = this.checkTheLightJob();
        this.jobCheckTheLight.start();

        this.lcd.on();
        this.lcd.cursor(0,0);
        this.lcd.useChar("box2");
        this.lcd.print("Farmer ready!");

    }

    checkTheLightJob() : CronJob {

        let t = this;
        return new cron.CronJob({
            cronTime: '*/3 * * * * *',
            onTick: function() {
                
              console.log("Check the light");
             
              t.isLightOn = !t.isLightOn;
   
              t.isLightOn ? t.light.on()  : t.light.off();
              
              t.emit("light",t.isLightOn);
            }
          });
    }

    checkTemperature(callback: Function) {

        let lcd = this.lcd;
        // Read from GPIO4
        sensor.read(22, this.TEMP_HUMIDITY_PIN, function (err: any, temperature: number, humidity: number) {
            if (!err) {
                callback(temperature, humidity)
                lcd.cursor(1,0);
                lcd.print( util.format("T:%s:box2: H:%s %",temperature.toFixed(1),humidity.toFixed(1)));
            }
        });

    }

    lightOn(callback?: Function) {
        this.light.on();
        this.isLightOn = true;
    }

    lightOff(callback?: Function) {
        this.light.fadeOut(3000);
        this.isLightOn = false;
    }

    getLightStatus(callback: Function)  {

        callback(this.isLightOn);     
       
    }

    freshAir(callback?: Function) {

        this.pinFan.high();

    }

}