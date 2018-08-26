declare var Vue: any;

var socket: SocketIOClient.Socket;
var data = {
    humidity: 0,
    temperature: 0,
    water: 'n.d.',
    isWater: false,
    isLight: false,
    isFan: false,
    lightStartTime: '',
    lightEndTime: ''
}

var cubeApp = new Vue({
    el: '#cube-app',
    delimiters: ["[[", "]]"],
    data: data,
    created: initSocket,
    methods: {

        lightSwitch: function() {
            socket.emit('light-switch', data.isLight);
        },
        fanSwitch: function() {
            socket.emit('fan-switch',data.isFan);
        },
        setLightTime: function() {
            socket.emit('set-light-time',{
                start: data.lightStartTime,
                end: data.lightEndTime
            })
        }
    }

})

function initSocket() {
    socket = io.connect();

    socket.on('temperature', function (value: any) {

        data.humidity = value.humidity;
        data.temperature = value.temperature;
    })

    socket.on("water", function (value: boolean) {

        data.isWater = !value;
        data.water = !value ? "I am fine" : "Need water!";
    })

    socket.on("light", function (value: any) {

        data.isLight = value.status;
        data.lightStartTime = value.start;
        data.lightEndTime = value.end;
    })
    socket.on("fan", function (value: boolean) {
        
        data.isFan = value;
    })

    socket.emit("ready");
}

