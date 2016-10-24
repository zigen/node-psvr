"use strict";

const HID = require("node-hid");
const EventEmitter = require("events");
const debug = require("debug")("psvr");
const usb = require("usb");

const VID = 1356, PID = 2479; 

class PSVR extends EventEmitter {

  constructor(options) {
    super();
    
    usb.setDebugLevel(4);
    this.usb = usb.findByIds(1356, 2479);
    if (this.usb) {
      this.initUSBDevice();
    } else {
      debug("PSVR usb device not found");
      usb.on("attach", (d) => {
        if (d.deviceDescriptor.idVendor === VID &&
          d.deviceDescriptor.idProduct === PID) {
          this.usb = d;
          this.initUSBDevice();
        }
      });
    }
    this._deviceLoop = setInterval(() => {
      if (this.connectIfDeviceFound()) {
        clearInterval(this._deviceLoop);
        this._deviceLoop = null;
      }
    }, 1000);

  }

  initUSBDevice() {
    debug("Initalize usb device");
    this.usb.__open();
    this.usb.__claimInterface(0);
    this.usb.open();
    let ctrlIface = this.usb.interface(5);
    let ctrlEp = ctrlIface.endpoint(4);
    ctrlIface.claim();
    ctrlEp.transfer(Buffer.from([0x11, 0x00, 0xaa, 0x08, 0x80, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0x00]), (err, data) => {
      debug("crtlerr: ", err);
      debug("ctrl: ", data);    
    });


    let iface = this.usb.interface(4);
    iface.claim();
    let endpoint = iface.endpoint(131);
    endpoint.on("data", (data) => {
      debug(`endpoint ${endpoint.descriptor.bEndpointAddress}`, data.toJSON().data);
    });
    endpoint.on("error", (error) => {
      debug(`endpoint ${endpoint.descriptor.bEndpointAddress}`, error);
    });
    endpoint.startPoll();

    process.on("SIGINT", () => {
      endpoint.stopPoll();
      this.usb.close();
    });

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

        const volume = rawData[2];
        const isWorn = !!(rawData[8] & 1);
        const isDisplayActive = !((rawData[8] & 2) >> 1);
        const mute = !!((rawData[8] & 8) >> 3);
        const isEarphoneConnected = !!((rawData[8] & 16) >> 4);

        this.emit("data", {
          yawAccel : rawData.readInt8(21),
          pitchAccel: rawData.readInt8(23),
          rollAccel: rawData.readInt8(25),
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

