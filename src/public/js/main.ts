
$(document).ready(function () {

    var socket = io.connect();
    var $temperaturePlaceholder = $("#temperature-placeholder");
    var $humidityPlaceholder = $("#humidity-placeholder");
    socket.on('temperature', function (value: any) {

       $temperaturePlaceholder.text(value.temperature);
       $humidityPlaceholder.text(value.humidity);
    })
});