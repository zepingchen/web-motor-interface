const DISABLE_MOSFETS = 0
const ENABLE_MOSFETS = 1
const TRAPEZOID_MOVE = 2
const SET_MAX_VELOCITY = 3
const MOVE_WITH_FINISH_TIME = 4
const SET_MAX_ACCELERATION = 5
const START_CALIBRATION = 6
const CAPTURE_HALL_SENSOR_DATA = 7
const RESET_TIME = 8
const GET_MOTOR_TIME = 9
const TIME_SYNC = 10
const GET_NUM_OF_ITEMS_IN_QUEUE = 11
const EMERGENCY_STOP = 12
const SET_ORIGIN = 13
const HOMMING = 14
const GET_MOTOR_POSITION = 15
const GET_MOTOR_STATUS = 16
const GO_TO_CLOSE_LOOP = 17
const GET_UPDATE_FREQUENCY = 18
const MOVE_WITH_ACCELERATION = 19
const DETECT_DEVICES = 20
const SET_DEVICE_ALIAS = 21
const GET_PRODUCT_VERSION_AND_DETAILS = 22
const FIRMWARE_UPGRADE = 23
const MOVE_WITH_VELOCITY = 26
const SYSTEM_RESET = 27

const ASCII_R = 82
const ASCII_X = 88
const ASCII_Y = 89
const ASCII_Z = 90
const ALL_AXIS = 255

const ASCII_TABLE = {
"31": "",      "32": " ",     "33": "!",     "34": "\"",    "35": "#",
"36": "$",     "37": "%",     "38": "&",     "39": "'",     "40": "(",
"41": ")",     "42": "*",     "43": "+",     "44": ",",     "45": "-",
"46": ".",     "47": "/",     "48": "0",     "49": "1",     "50": "2",
"51": "3",     "52": "4",     "53": "5",     "54": "6",     "55": "7",
"56": "8",     "57": "9",     "58": ":",     "59": ";",     "60": "<",
"61": "=",     "62": ">",     "63": "?",     "64": "@",     "65": "A",
"66": "B",     "67": "C",     "68": "D",     "69": "E",     "70": "F",
"71": "G",     "72": "H",     "73": "I",     "74": "J",     "75": "K",
"76": "L",     "77": "M",     "78": "N",     "79": "O",     "80": "P",
"81": "Q",     "82": "R",     "83": "S",     "84": "T",     "85": "U",
"86": "V",     "87": "W",     "88": "X",     "89": "Y",     "90": "Z",
"91": "[",     "92": "\\",    "93": "]",     "94": "^",     "95": "_",
"96": "`",     "97": "a",     "98": "b",     "99": "c",     "100": "d",
"101": "e",    "102": "f",    "103": "g",    "104": "h",    "105": "i",
"106": "j",    "107": "k",    "108": "l",    "109": "m",    "110": "n",
"111": "o",    "112": "p",    "113": "q",    "114": "r",    "115": "s",
"116": "t",    "117": "u",    "118": "v",    "119": "w",    "120": "x",
"121": "y",    "122": "z",    "123": "{",    "124": "|",    "125": "}",
"126": "~",    "127": ""
};

function intToBytes(value, length) {
  var byteArray = new Uint8Array(length);
  for(var i = 0; i < byteArray.length; i++) {
        var byte = value & 0xff;
        byteArray[i] = byte;
        value = (value - byte) / 256;
  }
  return byteArray;
}

function bytesToInt(byteArray) {
  var value = 0;
  for(var i = byteArray.length - 1; i >= 0; i--) {
      value = (value * 256) + byteArray[i];
  }
  return value;
};

function checkDefaultResponse(byteArray) {
  if(byteArray.length !== 3) {
    console.log("Did not receive 3-byte response");
    return false;
  }
  console.log("Ok");
  return true;
}

function checkGetPositionResponse(byteArray) {
  if(byteArray.length !== 7) {
    console.log("Did not receive 7-byte response");
    return false;
  }
  var position = bytesToInt(byteArray.slice(3, byteArray.length));
  return position;
}

function checkGetTimeResponse(byteArray) {
  if(byteArray.length !== 9) {
    console.log("Did not receive 9-byte response");
    return false;
  }
  var time = bytesToInt(byteArray.slice(3, byteArray.length));
  return time;
}

function checkGetUpdateFrequencyResponse(byteArray) {
  if(byteArray.length !== 7) {
    console.log("Did not receive 7-byte response");
    return false;
  }
  var frequency = bytesToInt(byteArray.slice(3, byteArray.length));
  return frequency;
}

function checkDetectDevicesResponse(byteArray) {
  if(byteArray.length !== 11) {
    console.log("Did not receive 11-byte response");
    return false;
  }
  var id = bytesToInt(byteArray.slice(3, byteArray.length));
  return id;
}

function parseMotorStatusResponse(resp) {
  if(resp[0] !== ASCII_R) {
    return;
  }
  if(resp.length !== 5) {
    console.log("Did not receive 5-byte response");
  }
  var flagByte = resp[3];
  var errorByte = resp[4];
  var flagBits = toBitString(flagByte);
  var errorBits = toBitString(errorByte);
  var flagMessage = ` Bootloader: ${flagBits[0]} MOSFET: ${flagBits[1]} CloseLoop: ${flagBits[2]} Calibration: ${flagBits[3]} Homing: ${flagBits[4]}\n`;
  // var errorMessage = ` `;
  var message = flagBits + flagMessage;
  return message;
}

// 16 = get the status
// input:     none
// response:  R 1 2 followed by 2 bytes. The first byte holds a series of flags which are 1 bit each. These are:
//               Bit 0: In the bootloader (if this flag is set then the other flags below will all be 0)
//               Bit 1: MOSFETs are enabled
//               Bit 2: Motor is in closed loop mode
//               Bit 3: Motor is currently executing the calibration command
//               Bit 4: Motor is currently executing a homing command
//               Bit 5: Not used, set to 0
//               Bit 6: Not used, set to 0
//               Bit 7: Not used, set to 0
//            The second byte holds the fatal error code. If 0 then there is no fatal error. Once a fatal error happens, the motor becomes disabled
//            and cannot do much anymore until reset. You can press the reset button on the motor or you can execute the soft reset command.

function parseDetectDeviceResponse(resp) {
  if(resp[0] !== ASCII_R) {
    return;
  }
  if(resp.length !== 16) {
    console.log("Did not receive 16-byte response");
  }
  var idBytes = resp.slice(3, 11);
  var aliasByte = resp[11];
  var crc32Bytes = resp.slice(12);
  var id = '';
  for(let i = 0; i < idBytes.length; i++) {
    id += idBytes[i].toString(16);
  }
  var alias = String.fromCharCode(aliasByte);
  var crc32 = bytesToInt(crc32Bytes);

  console.log(idBytes, id);
  console.log(aliasByte, alias);
  console.log(crc32Bytes, crc32);

  if(crc32 !== 0x04030201) { //67305985 in decimal
    console.log("CRC32 check failed")
  }
  return [id, alias];
}

function disableMOSFET(axis) {
  var byteArray = new Uint8Array([axis.charCodeAt(0), DISABLE_MOSFETS, 0]);
  console.log("Disable MOSFET");
  console.log(byteArray);
  return byteArray;
}

function enableMOSFET(axis) {
  var byteArray = new Uint8Array([axis.charCodeAt(0), ENABLE_MOSFETS, 0]);
  console.log("Enable MOSFET");
  console.log(byteArray);
  return byteArray;
}

function setPositionAndMove(axis, position) {
  var axisBytes = new TextEncoder().encode(axis);
  var commandBytes = intToBytes(SET_POSITION_AND_MOVE, 1);
  var lengthBytes = intToBytes(4, 1);
  var positionBytes = intToBytes(position, 4);
  var concatArray = new Uint8Array([ ...axisBytes, ...commandBytes, ...lengthBytes, ...positionBytes ]);
  console.log("Set position and move");
  console.log(concatArray);
  return concatArray;

  // var byteArray = new Uint8Array([axis.charCodeAt(0), SET_POSITION_AND_MOVE, 4, ...positionBytes]);
  // return byteArray;
}

function trapezoidMove(axis, displacement, timeSteps) {
  var axisBytes = new TextEncoder().encode(axis);
  var commandBytes = intToBytes(TRAPEZOID_MOVE, 1);
  var lengthBytes = intToBytes(8, 1);
  var displacementBytes = intToBytes(displacement, 4);
  var timeBytes = intToBytes(timeSteps, 4)
  var concatArray = new Uint8Array([ ...axisBytes, ...commandBytes, ...lengthBytes, ...displacementBytes, ...timeBytes ]);
  console.log("Do trapezoid move");
  console.log(concatArray);
  return concatArray;

  // var byteArray = new Uint8Array([axis.charCodeAt(0), TRAPEZOID_MOVE, 8, ...displacementBytes, ...timeBytes]);
  // return byteArray;
}

function setMaxVelocity(axis, velocity) {
  var velocityBytes = intToBytes(velocity, 4);
  var byteArray = new Uint8Array([axis.charCodeAt(0), SET_MAX_VELOCITY, 4, ...velocityBytes]);
  console.log(`Set maxVelocity: ${velocity}`);
  // displayMessage(`Set maxVelocity: ${velocity}`);
  console.log(byteArray);
  return byteArray;
}

function setMaxAcceleration(axis, acceleration) {
  var accelerationBytes = intToBytes(acceleration, 4);
  var byteArray = new Uint8Array([axis.charCodeAt(0), SET_MAX_ACCELERATION, 4, ...accelerationBytes]);
  console.log(`Set maxAcceleration: ${acceleration}`);
  console.log(byteArray);
  return byteArray;
}

function resetTime(axis) {
  var byteArray = new Uint8Array([axis.charCodeAt(0), RESET_TIME, 0]);
  console.log("Reset time");
  console.log(byteArray);
  return byteArray;
}

function getMotorStatus(axis) {
  var byteArray = new Uint8Array([axis.charCodeAt(0), GET_MOTOR_STATUS, 0]);
  console.log("Get motor status");
  console.log(byteArray);
  return byteArray;
}

function motorHoming(axis) {
  var byteArray = new Uint8Array([axis.charCodeAt(0), HOMMING, 0]);
  console.log("Motor Homing");
  console.log(byteArray);
  return byteArray;
}

function motorCloseLoop(axis) {
  var byteArray = new Uint8Array([axis.charCodeAt(0), GO_TO_CLOSE_LOOP, 0]);
  console.log("Motor CloseLoop");
  console.log(byteArray);
  return byteArray;
}

function moveWithVelocity(axis, velocity, timeSteps) {
  var velocityBytes = intToBytes(velocity, 4);
  var timeBytes = intToBytes(timeSteps, 4)
  var byteArray = new Uint8Array([axis.charCodeAt(0), MOVE_WITH_VELOCITY, 8, ...velocityBytes, ...timeBytes]);
  console.log(`Move with velocity: ${velocity} time: ${timeSteps}`);
  console.log(byteArray);
  return byteArray;
}

function moveWithAcceleration(axis, acceleration, timeSteps) {
  var accelerationBytes = intToBytes(acceleration, 4);
  var timeBytes = intToBytes(timeSteps, 4)
  var byteArray = new Uint8Array([axis.charCodeAt(0), MOVE_WITH_ACCELERATION, 8, ...accelerationBytes, ...timeBytes]);
  console.log(`Move with acceleration: ${acceleration} time: ${timeSteps}`);
  console.log(byteArray);
  return byteArray;
}

function detectDevice() {
  var byteArray = new Uint8Array([255, DETECT_DEVICES, 0]);
  console.log("Detect device");
  console.log(byteArray);
  return byteArray;
}

function setAlias(id, alias) {
  var idBytes = hexToBytes(id);
  var aliasByte = intToBytes(alias, 1);
  var byteArray = new Uint8Array([ALL_AXIS, SET_DEVICE_ALIAS, 9, ...idBytes, ...aliasByte]);
  console.log("Set alias");
  console.log(byteArray);
  return byteArray
}

function systemReset() {
  var byteArray = new Uint8Array([255, SYSTEM_RESET, 0]);
  console.log("System reset");
  return byteArray
}

function toBitString(byte) {
  return ("000000000" + byte.toString(2)).substr(-8);
}

function toHexString(byteArray) {
  return Array.from(byteArray, function(byte) {
    if(byte >= 31 && byte <= 127) {
      return ASCII_TABLE[byte.toString()];
    }
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('\\')
}

function hexToBytes(hex) {
  for (var bytes = [], c = 0; c < hex.length; c += 2)
      bytes.push(parseInt(hex.substr(c, 2), 16));
  return bytes;
}

var makeCRCTable = function() {
    var c;
    var crcTable = [];
    for(var n =0; n < 256; n++){
        c = n;
        for(var k =0; k < 8; k++){
            c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        }
        crcTable[n] = c;
    }
    return crcTable;
}

var crc32 = function(data) {
    var crcTable = window.crcTable || (window.crcTable = makeCRCTable());
    var crc = 0 ^ (-1);
    for (var i = 0; i < data.length; i++ ) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
};

const FLASH_PAGE_SIZE = 2048

// function programOnePage(pageNum, data) {
//   console.log(`Writing to page: ${pageNum}`);
//   var byteArray = new Uint8Array([255, FIRMWARE_UPGRADE, 255, ...intToBytes(FLASH_PAGE_SIZE + 1, 2), pageNum]);
//   byteArray = new Uint8Array([...byteArray, ...data]);
//   // console.log(byteArray);
//   return byteArray;
// }

function programOnePage(modelCode, firmwareCompatibilityCode, pageNum, data) {
  console.log(`Writing to page: ${pageNum}`);
  var byteArray = new Uint8Array([255, FIRMWARE_UPGRADE, 255, ...intToBytes(8 + 1 + 1 + FLASH_PAGE_SIZE, 2), ...modelCode, firmwareCompatibilityCode, pageNum]);
  byteArray = new Uint8Array([...byteArray, ...data]);
  // console.log(byteArray);
  return byteArray;
}


// setInterval(() => {
//   // var array = new Uint8Array([82, 0, 0, 0, 1, 2, 11, 35, 100]);
//   // var array = new Uint8Array([83, 84, 65, 82, 84]);
//   var array = new Uint8Array([82, 1, 13, 110, 76, 195, 49, 124, 229, 54, 55, 90, 1, 2, 3, 4, 82, 1, 13, 173, 237, 12, 32, 186, 22, 89, 99, 89, 1, 2, 3, 4, 82, 1, 13, 175, 147, 1, 46, 212, 65, 71, 22, 88, 1, 2, 3, 4]);
//   function toHexString(byteArray) {
//     return Array.from(byteArray, function(byte) {
//       if(byte >= 31 && byte <= 127) {
//         return ASCII_TABLE[byte.toString()];
//       }
//       return ('0' + (byte & 0xFF).toString(16)).slice(-2);
//     }).join('\\')
//   }
//   hexString = toHexString(array);
//   console.log(hexString);
// }, 2000);

// unique id: 0x3736E57C31C34C6E and alias Z
// unique id: 0x164741D42E0193AF and alias X
// unique id: 0x635916BA200CEDAD and alias Y

array = [55, 54, 229, 124, 49, 195, 76, 110];
setInterval(() => {
  var sum = Number(0);
  for(let i = 0; i < array.length; i++) {
    console.log(`${sum} = ${sum} * 256 + ${array[i]}`);
    sum = sum * 256 + array[i];
  }
  console.log(sum);
  var byteArray = intToBytes(3978619642402000000, 8);
  console.log(byteArray)
}, 2000)

// setInterval(() => {
//   var string = '';
//   for(let i = 0; i < array.length; i++) {
//     string += array[i].toString(16);
//   }
//   console.log(string)
//
//   var bytes = hexToBytes(string);
//   console.log(bytes);
//
//   for(let i = 0; i < string.length; i += 2) {
//     var byte = string[i] + string[i + 1];
//     byte = byte.toString(10);
//     console.log(byte);
//   }
// }, 2000);
