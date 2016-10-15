"use strict";

const HID = require("node-hid");
const psvr = new HID.HID(1356, 2479);
console.log(psvr.getDeviceInfo());

process.on('uncaughtException', function(err) {
    console.log(err);
});

process.on('unhandledRejection', (reason, p) => {
     console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

process.on("SIGINT", () => {
  psvr.setNonBlocking(0);
  psvr.close();
  console.log("bye");
});

psvr.on("data", (rawData) => {
  const data = rawData.toJSON();
  if (Number(data.data.length) > 0) {
    // console.log(`${String(data.data[20])} - ${String(data.data[22])} - ${String(data.data[24])}` );
    // 
    if (data.data[23] === 255) {
       console.log("== ", rawData.toString("hex"));
    } else {
       console.log("-- ", rawData.toString("hex"));
      // console.log(String(data.data[24]), String(data.data[23]));
    }
  }
});

psvr.setNonBlocking(1);
