
// WebSocket section-------------------------------------------

var gateway = `ws://${window.location.hostname}/ws`;
var websocket;
window.addEventListener('load', onload);

function onload(event) {
  initWebSocket();
}

function getValues(){
  websocket.send("getValues");
}

function initWebSocket() {
  console.log('Trying to open a WebSocket connection…');
  websocket = new WebSocket(gateway);
  websocket.onopen = onOpen;
  websocket.onclose = onClose;
  websocket.onmessage = onMessage;
}

function onOpen(event) {
    console.log('Connection opened');
    getValues();
}

function onClose(event) {
    console.log('Connection closed');
    setTimeout(initWebSocket, 2000);
}

function onMessage(event) {
    console.log(event.data);
    var myObj = JSON.parse(event.data);
    var keys = Object.keys(myObj);

    for (var i = 0; i < keys.length; i++){
        var key = keys[i];
        if(key=="driveSpeed") {
          document.getElementById("slider1").value = myObj[key];
        } else if(key=="rotateSpeed") {
          document.getElementById("slider2").value = myObj[key];
        }
        document.getElementById(key).innerHTML = myObj[key];
    }
}

// function call section-------------------------------------------

var forward = "0";
var backward = "0";
var left = "0";
var right = "0";
var cw = "0";
var ccw = "0";
var touch = false

function updateSliderPWM(element) {
    var sliderValue = document.getElementById(element.id).value;
    console.log(sliderValue);
    websocket.send(element.id + "_" + sliderValue.toString());
}

function updateDirection(dirData) {
    websocket.send("direction_" + dirData);
}

function buttonHold(element){ 
  switch (element.id) {
    case "forward": 
      forward = "1";
      break;
    case "backward":
      backward = "1";
      break;
    case "left": 
      left = "1";
      break;
    case "right": 
      right = "1";
      break;
    case "cw": 
      ccw = "1";
      break;
    case "ccw": 
      cw = "1";
      break;  
    case "forward-left": 
      forward = "1";  
      left = "1";
      break;
    case "forward-right": 
      forward = "1";    
      right = "1";
      break;
    case "backward-left": 
      backward = "1";  
      left = "1";
      break;
    case "backward-right": 
      backward = "1";  
      right = "1";
      break;        
  }
  var dirData = forward+backward+left+right+cw+ccw;
  updateDirection(dirData);
}

function touchHold(element){ 
  switch (element.id) {
    case "forward": 
      forward = "1";
      break;
    case "backward":
      backward = "1";
      break;
    case "left": 
      left = "1";
      break;
    case "right": 
      right = "1";
      break;
    case "cw": 
      ccw = "1";
      break;
    case "ccw": 
      cw = "1";
      break;  
    case "forward-left": 
      forward = "1";  
      left = "1";
      break;
    case "forward-right": 
      forward = "1";    
      right = "1";
      break;
    case "backward-left": 
      backward = "1";  
      left = "1";
      break;
    case "backward-right": 
      backward = "1";  
      right = "1";
      break;        
  }
  var dirData = forward+backward+left+right+cw+ccw;
  updateDirection(dirData);
}

function touchRelease(element){ 
  switch (element.id) {
    case "forward": 
      forward = "0";
      break;
    case "backward":
      backward = "0";
      break;
    case "left": 
      left = "0";
      break;
    case "right": 
      right = "0";
      break;
    case "cw": 
      ccw = "0";
      break;
    case "ccw": 
      cw = "0";
      break;    
    case "forward-left": 
      forward = "0";  
      left = "0";
      break;
    case "forward-right": 
      forward = "0";    
      right = "0";
      break;
    case "backward-left": 
      backward = "0";  
      left = "0";
      break;
    case "backward-right": 
      backward = "0";  
      right = "0";
      break;    
  }
  touch = false
  var dirData = forward+backward+left+right+cw+ccw;
  updateDirection(dirData);
}

function buttonRelease(element){ 
  switch (element.id) {
    case "forward": 
      forward = "0";
      break;
    case "backward":
      backward = "0";
      break;
    case "left": 
      left = "0";
      break;
    case "right": 
      right = "0";
      break;
    case "cw": 
      ccw = "0";
      break;
    case "ccw": 
      cw = "0";
      break;    
    case "forward-left": 
      forward = "0";  
      left = "0";
      break;
    case "forward-right": 
      forward = "0";    
      right = "0";
      break;
    case "backward-left": 
      backward = "0";  
      left = "0";
      break;
    case "backward-right": 
      backward = "0";  
      right = "0";
      break;    
  }
  var dirData = forward+backward+left+right+cw+ccw;
  updateDirection(dirData);
}

//event listener
window.addEventListener("keydown", onKeyDown, false);
window.addEventListener("keyup", onKeyUp, false);

function onKeyDown(event) {
  if (event.repeat) return;
  var keyCode = event.keyCode;
  switch (keyCode) {
    case 68: //d
      right = "1";
      break;
    case 83: //s
      backward = "1";
      break;
    case 65: //a
      left = "1";
      break;
    case 87: //w
      forward = "1";
      break;
    case 81: //q
      ccw = "1";
      break;
    case 69: //e
      cw = "1";
      break;        
  }
  var dirData = forward+backward+left+right+cw+ccw;
  updateDirection(dirData);
}

function onKeyUp(event) {
  var keyCode = event.keyCode;
  switch (keyCode) {
    case 68: //d
      right = "0";
      break;
    case 83: //s
      backward = "0";
      break;
    case 65: //a
      left = "0";
      break;
    case 87: //w
      forward = "0";
      break;
    case 81: //q
      ccw = "0";
      break;
    case 69: //e
      cw = "0";
      break; 
  }
  var dirData = forward+backward+left+right+cw+ccw;
  updateDirection(dirData);
}