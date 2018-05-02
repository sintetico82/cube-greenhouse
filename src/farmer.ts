var sensor = require('node-dht-sensor');
import { Led, Board, Pin, LCD } from "johnny-five";
import util from "util";

export class Farmer {

    private board: Board;
    private readonly TEMP_HUMIDITY_PIN: number = 4;
    private readonly LIGHT_PIN: number = 22;//GPIO6
    private readonly LIGHT_HOURS: number = 18;
    private readonly FAN_PIN: number = 24; // GPIO19

    private light = new Led(this.LIGHT_PIN); //GPIO6
    private pinFan = new Pin(this.FAN_PIN); // GPIO19
    private lcd = new LCD({
        controller: "PCF8574"
    });

    constructor(board: Board) {
        this.board = board;

        let light = this.light;
        let pinFan = this.pinFan;
        let lcd = this.lcd;
        this.board.on("exit", function () {
            light.off();
            pinFan.low();
            lcd.off();
        });

        this.lcd.on();
        this.lcd.cursor(0,0);
        this.lcd.useChar("box2");
        this.lcd.print("Farmer ready!");

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

    lightToggle(callback?: Function) {

        this.light.toggle();
    }

    freshAir(callback?: Function) {

        this.pinFan.high();

    }

}