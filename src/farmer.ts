var sensor = require('node-dht-sensor');
import { Led, Board, Pin, LCD, Sensor } from "johnny-five";
import util from "util";
import cron, { CronJob } from "cron";
import EventEmitter from "events";
import moment from 'moment';
import * as fs from 'fs';

class FarmerData {
    public static readonly FILE_NAME = "cube-greenhouse-data.json";
    public lightStartTime: moment.Moment | undefined;
    public lightEndTime: moment.Moment | undefined;
    constructor() { }
}


export class Farmer extends EventEmitter {

    private data: FarmerData = new FarmerData();
    private board: Board;

    private readonly TEMP_HUMIDITY_PIN: number = 4; // GPIO4
    private readonly LIGHT_PIN: number = 22;//GPIO6
    private readonly LIGHT_HOUR_START: number = 20;
    private readonly LIGHT_HOUR_END: number = 25;
    private readonly FAN_PIN: number = 24; // GPIO19
    private readonly WATER_PIN: number = 2; // GPIO27

    private light = new Led(this.LIGHT_PIN); //GPIO6
    private pinFan = new Pin(this.FAN_PIN); // GPIO19
    private lcd = new LCD({ controller: "PCF8574" });
    private waterSensor = new Pin({ pin: this.WATER_PIN, type: "digital" });

    private isWaterIn: boolean = false;
    private isLightOn: boolean = false;
    private isFanOn: boolean = false;

    private jobCheckTheLight: CronJob;

    constructor(board: Board) {
        super();
        let t = this;
        this.board = board;

        let light = this.light;
        let pinFan = this.pinFan;
        let lcd = this.lcd;

        this.board.on("exit", function () {
            light.off();
            pinFan.low();
            lcd.off();
            // @ts-ignore
            lcd.noBacklight();
        });





        this.jobCheckTheLight = this.checkTheLightJob();
        this.jobCheckTheLight.start();

        this.lcd.on();
        // @ts-ignore
        this.lcd.backlight();
        this.lcd.useChar("duck");
        this.lcd.useChar("box2");
        this.lcd.print("Cube Greenhouse ");

        this.loadState(() => { 
            this.displayDataInfo() 
        });

    }

    checkTheLightJob(): CronJob {

        let t = this;
        return new cron.CronJob({
            cronTime: '*/30 * * * * *',
            runOnInit: true,
            onTick: function () {

                if (t.data.lightStartTime && t.data.lightEndTime && t.data.lightStartTime.isValid() && t.data.lightEndTime.isValid()) {

                    moment().isBetween(t.data.lightStartTime, t.data.lightEndTime) ? t.lightOn() : t.lightOff();
                    t.emit("light", t.isLightOn);

                }

            }
        });
    }

    checkWater(callback?: Function) {
        let t = this;
        this.waterSensor.read(function (err, data) {

            if (!err) {
                t.isWaterIn = data > 0;
                t.emit("water", t.isWaterIn);
                if (callback)
                    callback(t.isWaterIn);

                t.lcd.cursor(0, 15);
                t.isWaterIn ? t.lcd.print(":duck:") : t.lcd.print(" ");
            } else {
                console.error(err);
            }

        })
    }

    checkTemperature(callback?: Function) {
        let t = this;
        let lcd = this.lcd;
        // Read from GPIO4
        sensor.read(22, this.TEMP_HUMIDITY_PIN, function (err: any, temperature: number, humidity: number) {
            if (!err) {
                t.emit("temperature", { temperature: temperature.toFixed(2), humidity: temperature.toFixed(2) });
                if (callback)
                    callback({ temperature: temperature.toFixed(2), humidity: temperature.toFixed(2) })
                lcd.cursor(1, 0);
                lcd.print(util.format("T:%s:box2: H:%s %", temperature.toFixed(1), humidity.toFixed(1)));
            }
        });

    }

    lightOn(callback?: Function) {
        this.light.on();
        this.isLightOn = true;
        this.emit("light", this.isLightOn);
    }

    lightOff(callback?: Function) {
        this.light.off();
        this.isLightOn = false;
        this.emit("light", this.isLightOn);
    }

    getLightStatus(callback: Function) {

        callback(this.isLightOn);

    }

    fanOn(callback?: Function) {

        this.pinFan.high();
        this.isFanOn = true;
        this.emit("fan", this.isFanOn);
    }

    fanOff(callback?: Function) {

        this.pinFan.low();
        this.isFanOn = false;
        this.emit("fan", this.isFanOn);
    }

    setLightTime(start: string, end: string) {
        if(this.jobCheckTheLight) {
            this.jobCheckTheLight.start();
            console.log("FF %s",this.jobCheckTheLight.lastDate());
        }
        this.data.lightStartTime = moment(start, "HH:mm");
        this.data.lightEndTime = moment(end, "HH:mm");
        this.saveState();
        this.displayDataInfo();

    }

    displayDataInfo() {
        if (this.data.lightStartTime && this.data.lightStartTime.isValid() && this.data.lightEndTime && this.data.lightEndTime.isValid()) {
            this.lcd.clear();
            this.lcd.cursor(0, 0);
            this.lcd.print(util.format("L:%s-%s  ", this.data.lightStartTime.format("HH:mm"), this.data.lightEndTime.format("HH:mm")));
        }
    }

    saveState() {
        var json = JSON.stringify(this.data);
        fs.writeFile('cube-greenhouse-data.json', json, 'utf8', (err) => {
            if (err) {
                console.error(err)
            }
        });
    }

    loadState(callback?: Function) {
        let t = this;
        fs.exists(FarmerData.FILE_NAME, function (r: boolean) {
            if (r) {
                fs.readFile(FarmerData.FILE_NAME, 'utf8', function readFileCallback(err, data) {
                    if (err) {
                        console.error(err);
                    } else {
                        t.data = JSON.parse(data, function (k, v) {
                            if (k == 'lightStartTime' || k == 'lightEndTime')
                                return moment(v);


                            return v;
                        });

                        if (callback)
                            callback();
                    }
                });
            }

        });

    }

    getStartTime() {
        if (this.data.lightStartTime && this.data.lightStartTime.isValid())
            return this.data.lightStartTime.format("HH:mm");
        else
            return null;
    }

    getEndTime() {
        if (this.data.lightEndTime && this.data.lightEndTime.isValid())
            return this.data.lightEndTime.format("HH:mm");
        else
            return null;
    }

}