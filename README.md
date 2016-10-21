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


## API
```
var device = new PSVR();
```
### data
- `data` - Object - the data read from the device
```
{
  "yawAccel": -1,
  "pitchAccel": -1,
  "rollAccel": -1,
  "yaw": -66,
  "pitch": 64,
  "roll": 2,
  "xAccel": 0,
  "yAccel": -1,
  "zAccel": 64,
  "isWorn": false,
  "isDisplayActive": true,
  "isEarphoneConnected": false,
  "mute": false,
  "volume": 16
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

