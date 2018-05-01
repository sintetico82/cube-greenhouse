var sensor = require('node-dht-sensor');

export class Farmer {

    private readonly TEMP_HUMIDITY_PIN: number = 4;
 
    checkTemperature(callback: Function)  {


    // Read from GPIO4
    sensor.read(22, this.TEMP_HUMIDITY_PIN, function (err: any, temperature: number, humidity: number) {
        if (!err) {
            /*console.log('temp: ' + temperature.toFixed(1) + '°C, ' +
                'humidity: ' + humidity.toFixed(1) + '%'
            );*/

            callback(temperature,humidity)
        }
    });

    }
}