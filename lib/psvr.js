"use strict";

const HID = require("node-hid");
const EventEmitter = require("events");
const debug = require("debug")("psvr");

const VID = 1356, PID = 2479; 

class PSVR extends EventEmitter {

  constructor(options) {
    super();
    this._deviceLoop = setInterval(() => {
      if (this.connectIfDeviceFound()) {
        clearInterval(this._deviceLoop);
        this._deviceLoop = null;
      }
    }, 1000);
  }

  connectIfDeviceFound() {
    if (this.isConnected()) {
      debug("device found, initializing...");
      this._initDevice();
      return true;
    } else {
      debug("no device found");
      return false;
    }
  }

  isConnected() {
    let devices = HID.devices().filter((d) => { 
      return d.vendorId === VID && d.productId === PID;
    });
    return devices.length > 0;
  }

  resetYaw() {
    this._yaw = 0;
  }

  _initDevice() {
    this._device = new HID.HID(VID, PID);
    this._yaw = 0;
    this._resetIfRewear = false;
    this._timer = null;
    this._isWorn = 0;
    this._dataReceived = false;

    this._device.on("data", (rawData) => {
      const data = rawData.toJSON();
      if (Number(data.data.length) > 0) {
        if (!this._dataReceived) {
          this._dataReceived = true;
          this.emit("connected");
        }

        let d = rawData.readInt8(21);
        d = d === -1 ? 0 : d;
        this._yaw += d;

        const isWorn = rawData[8] & 1;

        this.emit("data", {
          yawAccel : rawData.readInt8(21),
          pitchAccel: rawData.readInt8(23),
          rollAccel: rawData.readInt8(25),
          yaw: Math.ceil(this._yaw * 0.025),
          pitch: rawData.readInt8(27),
          roll: rawData.readInt8(29),
          xAccel: rawData.readInt8(39),
          yAccel: rawData.readInt8(41),
          isWorn: isWorn
        });
        this.emit("rawData", rawData);

        if (this._isWorn !== isWorn ) {
          if (isWorn) {
            this.emit("worn");
            debug("device is worn");
          } else {
            this.emit("dropped");
            debug("device is dropped");
          }  
            }
        this._isWorn = isWorn;
      }
    });

    this._device.on("error", (err) => {
      debug("on error: ", err);
      this.emit("error", err);
    });

    process.on("exit", () => {
      this._device.close();
    });

    setTimeout(() => {
      debug("start polling");
      this._device.setNonBlocking(1);

      setTimeout(() => {
        if (!this._dataReceived) {
          this.close();        
          debug("cannot receive data, retry connection");
          this._deviceLoop = setInterval(() => {
            if (this.connectIfDeviceFound()) {
              clearInterval(this._deviceLoop);
              this._deviceLoop = null;
            }
          }, 1000);
        }   
      }, 1000);
    }, 500);    

  }


  close() {
    debug("device close");
    this.emit("disconnected");
    if (this._deviceLoop) {
      clearInterval(this._deviceLoop);
      this._deviceLoop = null;
    }
    this._device.setNonBlocking(0);
    this._device.close();
    this._device = null;
  }
    
}

module.exports = PSVR;

