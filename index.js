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
  setTimeout(() => {
    psvr.close();
  }, 500);
});

let yaw = 0;
psvr.on("data", (rawData) => {
  const data = rawData.toJSON();
  if (Number(data.data.length) > 0) {
       let str = "";
       for(let i = 35; i < 50; i++) {
          // str += ("000" + data.data[i]).slice(-3) + ", ";
          str += ("00000000" + data.data[i].toString(2)).slice(-8) + ", ";
       }
       // console.log("== ", data.data.slice(162, 64).toString());
      // console.log(str);
      // console.log("-- ", rawData.toString("hex"));
      // console.log(rawData.toString());
      yaw += toSigned(data.data[21], 255);
      let state = {
        yawAcc1 : toSigned(data.data[21], 255),
        pitchAcc1: toSigned(data.data[23], 255),
        rollAcc: toSigned(data.data[25], 255),
        yaw: Math.ceil(yaw * 0.025),
        pitch: toSigned(data.data[27], 255),
        roll: toSigned(data.data[29], 255)
      };
      console.log(JSON.stringify(state));

      // console.log(("00000000" + data.data[21].toString(2)).slice(-8));
      // console.log(String(toSigned(data.data[21], 255))); // yaw angular accel
      // console.log(String(toSigned(data.data[23], 255))); // pitch angular accel
      // console.log(String(toSigned(data.data[25], 255))); // roll angular accell
      // console.log(String(toSigned(data.data[27], 255))); // pitch angle
      // console.log(String(toSigned(data.data[29], 255))); // roll angle
      // console.log(String(toSigned(data.data[31], 255))); //  pitch or yaw?
      // console.log(String(toSigned(data.data[34], 255))); //  count up?
      // console.log(String(toSigned(data.data[35], 255))); //
      // console.log(String(toSigned(data.data[36], 255))); // is there some rule?
      // console.log(String(toSigned(data.data[37], 255))); // yaw angular accel?
      // console.log(String(toSigned(data.data[38], 255))); // 
      //
      // console.log(String(toSigned(data.data[39], 255))); // pitch angular accel?
      // console.log(String(toSigned(data.data[41], 255))); // roll angular accel?
      //
      // console.log(String(toSigned(data.data[43], 255))); // pitch angle 
      // console.log(String(toSigned(data.data[45], 255))); // roll angle 
      //
      // console.log(String(toSigned(data.data[47], 255))); // pitch angle ?
      // console.log(data.data[8] & 1); // is worn?
       //console.log(data.data[9].toString(2));
      
    /*
    console.log("A: ", convert(data.data[20], data.data[19]));
    console.log("B: ", convert(data.data[22], data.data[21]));
    console.log("C: ", convert(data.data[24], data.data[23]));
    console.log("D: ", convert(data.data[26], data.data[25]));
    */
  }
});

function convert(x,y) {
  return x * 255 + y;
}

function toSigned(x, base) {
  return x > base * 0.5 ? x - base : x;
}

setTimeout(() => {
  psvr.setNonBlocking(1);
}, 500);
