"use strict";

const EventEmitter = require("events");
const debug = require("debug")("psvr");
const usb = require("usb");

const VID = 1356, PID = 2479; 

class PSVR extends EventEmitter {

  constructor(options) {
    super();
    
    this._device = usb.findByIds(VID, PID);

    if (this._device) {
      this.initUSBDevice();
    } else {
      debug("PSVR usb device not found");
      usb.on("attach", (d) => {
        if (d.deviceDescriptor.idVendor === VID &&
          d.deviceDescriptor.idProduct === PID) {
          this._device = d;
          this.initUSBDevice();
        }
      });
    }

  }

  initUSBDevice() {
    debug("Initalize usb device");
    this._device.__open();
    this._device.__claimInterface(0);
    this._device.open();
    let ctrlIface = this._device.interface(5);
    let ctrlEp = ctrlIface.endpoint(4);
    ctrlIface.claim();
    ctrlEp.transfer(Buffer.from([0x11, 0x00, 0xaa, 0x08, 0x80, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0x00]), (err, data) => {
      debug("crtlerr: ", err);
      debug("ctrl: ", data);    
    });

    let iface = this._device.interface(4);
    iface.claim();
    let endpoint = iface.endpoint(131);

    this._yaw = 0;
    this._roll = 0;
    this._pitch = 0;
    this._resetIfRewear = false;
    this._timer = null;
    this._isWorn = 0;
    this._dataReceived = false;

    endpoint.on("data", this._parseData.bind(this));

    endpoint.on("error", (error) => {
      debug(`endpoint ${endpoint.descriptor.bEndpointAddress}`, error);
    });
    endpoint.startPoll();


    endpoint.on("error", (err) => {
      debug("on error: ", err);
      this.emit("error", err);
    });

    process.on("SIGINT", () => {
      endpoint.stopPoll();
      this._device.close();
    });

  }

  resetYaw() {
    this._yaw = 0;
  }

  _parseData (rawData) {

    const data = rawData.toJSON();
    if (Number(data.data.length) > 0) {
      if (!this._dataReceived) {
        this._dataReceived = true;
        this.emit("connected");
      }

      let 
        yawGyro0 = rawData.readInt16LE(20),
        pitchGyro0 = rawData.readInt16LE(22),
        rollGyro0 = rawData.readInt16LE(24),
        yawGyro1 = rawData.readInt16LE(36),
        pitchGyro1 = rawData.readInt16LE(38),
        rollGyro1 = rawData.readInt16LE(40)
      ;

      this._yaw += yawGyro0 + yawGyro1 ;
      this._roll += rollGyro0 + rollGyro1;
      this._pitch += pitchGyro0 + pitchGyro1;

      const volume = rawData[2];
      const isWorn = !!(rawData[8] & 1);
      const isDisplayActive = !((rawData[8] & 2) >> 1);
      const mute = !!((rawData[8] & 8) >> 3);
      const isEarphoneConnected = !!((rawData[8] & 16) >> 4);

      this.emit("data", {

        yawGyro0,
        pitchGyro0,
        rollGyro0,

        xAccel0: rawData.readInt16LE(26),
        yAccel0: rawData.readInt16LE(28),
        zAccel0: rawData.readInt16LE(30),

        yawGyro1,
        pitchGyro1,
        rollGyro1,

        xAccel1: rawData.readInt16LE(42),
        yAccel1: rawData.readInt16LE(44),
        zAccel1: rawData.readInt16LE(46),

        yaw: this._yaw,
        roll: this._roll,
        pitch: this._pitch,

        isWorn,
        isDisplayActive,
        isEarphoneConnected,
        mute,
        volume
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
  }

  close() {
    debug("device close");
    this.emit("disconnected");
    this._device.close();
    this._device = null;
  }
    
}

module.exports = PSVR;

