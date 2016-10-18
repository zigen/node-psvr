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

### rawData
- `rawData` - Buffer - the data read from the device

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

