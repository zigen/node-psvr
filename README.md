# node-psvr

this is the node js package for using psvr.

## how to use
```sh
  npm install psvr
```

```js
  var PSVR = require("psvr");
  var device = new PSVR();
  device.on("data", function(data) {
     console.log(data);
  });
```

## for MacOS

I tried Mac OS 10.11.6
```
 sudo kextunload -b com.apple.driver.usb.IOUSBHostHIDDevice

```


## API
```
var device = new PSVR();
```
### data
- `data` - Object - the data read from the device
```
{ yawGyro0: 2,
  pitchGyro0: 8,
  rollGyro0: 6,
  xAccel0: 16897,
  yAccel0: -113,
  zAccel0: 3361,
  yawGyro1: -8,
  pitchGyro1: 22,
  rollGyro1: -4,
  xAccel1: 16993,
  yAccel1: -225,
  zAccel1: 3345,
  yaw: -2541,
  roll: 74827,
  pitch: 34289,
  isWorn: false,
  isDisplayActive: false,
  isEarphoneConnected: false,
  mute: false,
  volume: 20 
}
```

### rawData
- `rawData` - Buffer - the data read from the device

```
  JSON.stringify(rawData); 


{
  "type": "Buffer",
  "data":[0,0,16,0,10,4,32,0,2,34,1,255,127,0,0,0,26,112,58,0,13,0,0,0,24,0,81,63,31,2,177,20,14,114,58,0,8,0,10,0,18,0,129,63,111,2,209,20,34,1,0,0,0,3,255,115,0,0,0,0,0,254,1,49]
}
```

### error
- `error` - The error Object emitted

### connected
emitted when device is connected.

### disconnected
emitted when device is disconnected.

### worn
emitted when device is worn.

### dropped
emitted when device is dropped.

