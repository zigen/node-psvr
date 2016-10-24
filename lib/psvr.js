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

      let d = rawData.readInt8(21);
      d = d === -1 ? 0 : d;
      this._yaw += d;

      const volume = rawData[2];
      const isWorn = !!(rawData[8] & 1);
      const isDisplayActive = !((rawData[8] & 2) >> 1);
      const mute = !!((rawData[8] & 8) >> 3);
      const isEarphoneConnected = !!((rawData[8] & 16) >> 4);

      this.emit("data", {

        yawGyro: rawData.readInt8(21),
        pitchGyro: rawData.readInt8(23),
        rollGyro: rawData.readInt8(25),

        yaw: Math.ceil(this._yaw * 0.025),
        pitch: rawData.readInt8(27),
        roll: rawData.readInt8(29),

        xAccel: rawData.readInt8(39),
        yAccel: rawData.readInt8(41),
        zAccel: rawData.readInt8(43),

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

