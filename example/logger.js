// var PSVR = require("psvr");
var PSVR = require("../index.js");

var device = new PSVR();
var showLog = false;
device.on("data", function(data) {
  if (showLog) {
    console.log(JSON.stringify(data));
  }
});

device.on("dropped", function() {
  showLog = false;
});

device.on("worn", function() {
  device.resetYaw();
  showLog = true;
});

device.on("connected", function() {
  console.log("Device ready");
});
