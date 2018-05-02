
$(document).ready(function () {

    var socket = io.connect();
    var $temperaturePlaceholder = $("#temperature-placeholder");
    var $humidityPlaceholder = $("#humidity-placeholder");
    var $lightPlaceholder = $("#light-placeholder");
    socket.on('temperature', function (value: any) {

        $temperaturePlaceholder.text(value.temperature);
        $humidityPlaceholder.text(value.humidity);
    })

    socket.on("light", function (value: boolean) {
        if (value)
            $(".fa-lightbulb").addClass("text-warning");
        else
            $(".fa-lightbulb").removeClass("text-warning");
        
        $lightPlaceholder.text(value ? "On" : "Off");
    })

    socket.emit("ready");
});