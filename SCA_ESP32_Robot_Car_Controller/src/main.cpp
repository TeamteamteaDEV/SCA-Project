#include "Arduino.h"
#include "WiFi.h"
#include "ESPAsyncWebServer.h"
#include "AsyncTCP.h"
#include "SPIFFS.h"
#include "Arduino_JSON.h"
#include "WebSerial.h"
#include "ESPmDNS.h"
#include "Update.h"


// Motor Driving------------------------------------------------------------------

int IN1_AD = 22;
int IN2_AD = 12;
int IN1_BC = 33;
int IN2_BC = 25;
int EN_A = 27;
int EN_B = 13;
int EN_C = 32;
int EN_D = 26;

int driveSpeed;
int rotateSpeed;

String message = "";
String sliderValue1 = "0";
String sliderValue2 = "0";
String directionData = "000000";
String directionState = "stop";

void motorDriverWrite(int AD_1, int AD_2, int BC_1, int BC_2, int speed_0, int speed_2, int speed_4, int speed_6) {
  ledcWrite(0, speed_0);
  ledcWrite(2, speed_2);
  ledcWrite(4, speed_4);
  ledcWrite(6, speed_6);
  digitalWrite(IN1_AD, AD_1);
  digitalWrite(IN2_AD, AD_2);
  digitalWrite(IN1_BC, BC_1);
  digitalWrite(IN2_BC, BC_2);
}

String driveMotor() {
  if(directionData.charAt(0)=='1' and directionData.substring(1)=="00000") {
    motorDriverWrite(1, 0, 1, 0, driveSpeed, driveSpeed, driveSpeed, driveSpeed); // AD1 AD2 BC1 BC2 D A B C
    return "forward";
  } else if(directionData.charAt(1)=='1' and directionData[0]+directionData.substring(2)=="00000") {
    motorDriverWrite(0, 1, 0, 1, driveSpeed, driveSpeed, driveSpeed, driveSpeed);
    return "backward";
  } else if(directionData.charAt(2)=='1' and directionData.substring(0, 2)+directionData.substring(3)=="00000") {
    motorDriverWrite(0, 1, 1, 0, driveSpeed, driveSpeed, driveSpeed, driveSpeed);
    return "left";
  } else if(directionData.charAt(3)=='1' and directionData.substring(0, 3)+directionData.substring(4)=="00000") {
    motorDriverWrite(1, 0, 0, 1, driveSpeed, driveSpeed, driveSpeed, driveSpeed);
    return "right";
  } else if(String(directionData[0])+String(directionData[3])=="11" and directionData.substring(1, 3)+directionData.substring(4)=="0000") {
    motorDriverWrite(1, 0, 0, 0, driveSpeed, driveSpeed, 0, 0);
    return "forward-right";    
  } else if(String(directionData[0])+String(directionData[2])=="11" and String(directionData[1])+String(directionData[3])+directionData.substring(4)=="0000") {
    motorDriverWrite(0, 0, 1, 0, 0, 0, driveSpeed, driveSpeed);
    return "forward-left";    
  } else if(String(directionData[1])+String(directionData[3])=="11" and String(directionData[0])+String(directionData[2])+directionData.substring(4)=="0000") {
    motorDriverWrite(0, 0, 0, 1, 0, 0, driveSpeed, driveSpeed);
    return "backward-right";    
  } else if(String(directionData[1])+String(directionData[2])=="11" and String(directionData[0])+String(directionData[3])+directionData.substring(4)=="0000") {
    motorDriverWrite(0, 1, 0, 0, driveSpeed, driveSpeed, 0, 0);
    return "backward-left";    
  } else if(directionData.charAt(4)=='1' and directionData.substring(0, 4)+String(directionData[5])=="00000") {
    motorDriverWrite(1, 0, 0, 1, 0, rotateSpeed, rotateSpeed, 0); 
    return "rotate cw";
  } else if(directionData.charAt(5)=='1' and directionData.substring(0, 5)=="00000") {
    motorDriverWrite(0, 1, 1, 0, 0, rotateSpeed, rotateSpeed, 0);
    return "rotate ccw";     
  } else if(directionData == "000000") {
    motorDriverWrite(0, 0, 0, 0, driveSpeed, driveSpeed, driveSpeed, driveSpeed);    
    return "stop"; 
  } else {
    return "undefined";
  }
}







// Websocket------------------------------------------------------------------

// Create AsyncWebServer object on port 80
AsyncWebServer server(80);
// Create a WebSocket object
AsyncWebSocket ws("/ws");

//Json Variable to Hold Slider Values
JSONVar drivingParameter;

//Get Slider Values
String getDrivingParameter(){
  drivingParameter["driveSpeed"] = sliderValue1;
  drivingParameter["rotateSpeed"] = sliderValue2;
  drivingParameter["state"] = directionState;

  String jsonString = JSON.stringify(drivingParameter);
  Serial.println(jsonString);
  return jsonString;
}

void notifyClients(String drivingParameter) {
  ws.textAll(drivingParameter);
}

void handleWebSocketMessage(void *arg, uint8_t *data, size_t len) {
  AwsFrameInfo *info = (AwsFrameInfo*)arg;
  if (info->final && info->index == 0 && info->len == len && info->opcode == WS_TEXT) {
    data[len] = 0;
    message = (char*)data;
    if (message.indexOf("direction") >= 0) {
      directionData = message.substring(message.indexOf("_") + 1);
      directionState = driveMotor();
      WebSerial.print("state : " + directionState + " ");
      WebSerial.println(getDrivingParameter());
      notifyClients(getDrivingParameter());
      Serial.println(directionData);
    }  
    else if (message.indexOf("slider1") >= 0) {
      sliderValue1 = message.substring(message.indexOf("_") + 1);
      driveSpeed = map(sliderValue1.toInt(), 0, 100, 0, 255);
      WebSerial.print("drive speed change to " + String(driveSpeed) + " ");
      WebSerial.println(getDrivingParameter());
      notifyClients(getDrivingParameter());
    }
    if (message.indexOf("slider2") >= 0) {
      sliderValue2 = message.substring(message.indexOf("_") + 1);
      rotateSpeed = map(sliderValue2.toInt(), 0, 100, 0, 255);
      WebSerial.print("rotate speed change to " + String(rotateSpeed) + " ");
      WebSerial.println(getDrivingParameter());
      notifyClients(getDrivingParameter());
    }
    if (strcmp((char*)data, "getValues") == 0) {
      notifyClients(getDrivingParameter());
    }
  }
}

void onEvent(AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len) {
  switch (type) {
    case WS_EVT_CONNECT:
      Serial.printf("WebSocket client #%u connected from %s\n", client->id(), client->remoteIP().toString().c_str());
      WebSerial.print("WebSocket client "+String(client->id())+"connected from "+String(client->remoteIP().toString().c_str()));
      break;
    case WS_EVT_DISCONNECT:
      Serial.printf("WebSocket client #%u disconnected\n", client->id());
      WebSerial.print("WebSocket client "+String(client->id())+"disconnected\n");
      break;
    case WS_EVT_DATA:
      handleWebSocketMessage(arg, data, len);
      break;
    case WS_EVT_PONG:
    case WS_EVT_ERROR:
      break;
  }
}

void initWebSocket() {
  // Initialize WebSocket
  ws.onEvent(onEvent);
  server.addHandler(&ws);
}









// Webserial------------------------------------------------------------------

// Received string from webserial
void recvMsg(uint8_t *data, size_t len){
  WebSerial.println("Received Data...");
  String d = "";
  for(int i=0; i < len; i++){
    d += char(data[i]);
  }
  WebSerial.println(d);
}









// Multitasking------------------------------------------------------------------

TaskHandle_t Task1;

// loop1 to do ultrasonic and encoder task
void loop1(void *pvParameters){
  Serial.print("Ultrasonic and encoder task running on core ");
  Serial.println(xPortGetCoreID());
  for(;;){
    digitalWrite(2, HIGH);
    delay(1000);
    digitalWrite(2, LOW);
    delay(1000);
  } 
}








// Initialization ------------------------------------------------------------------

// Initialize SPIFFS
void initSPIFFS() {
  if (!SPIFFS.begin(true)) {
    Serial.println("An error has occurred while mounting SPIFFS");
  }
  Serial.println("SPIFFS mounted successfully");
}

const char* ssid = "Teamteamtea";
const char* password = "12345678";

// Initialize WiFi
void initWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi ..");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print('.');
    delay(1000);
  }
  Serial.println();
  Serial.println(WiFi.localIP());
}



void setup(){
  Serial.begin(115200);
  pinMode(2, OUTPUT); // board LED
  pinMode(25, OUTPUT);
  pinMode(33, OUTPUT);
  pinMode(32, OUTPUT);
  pinMode(12, OUTPUT);
  pinMode(13, OUTPUT);
  pinMode(22, OUTPUT);
  pinMode(27, OUTPUT);
  pinMode(26, OUTPUT);
  ledcSetup(0, 5000, 8);
  ledcSetup(2, 5000, 8);
  ledcSetup(4, 5000, 8);
  ledcSetup(6, 5000, 8);
  ledcAttachPin(EN_A, 0);
  ledcAttachPin(EN_B, 2);
  ledcAttachPin(EN_C, 4);
  ledcAttachPin(EN_D, 6);

  initSPIFFS();
  initWiFi();
  initWebSocket();

  // Change domain name to controller.local
  if(!MDNS.begin("controller")) {
    Serial.println("Error starting mDNS");
    return;
  }

  // Webserial begin
  WebSerial.begin(&server);
  WebSerial.msgCallback(recvMsg);

  // Route for root / web page
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(SPIFFS, "/index.html", "text/html");
  });
  
  // Route to load style.css file
  server.on("/style.css", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(SPIFFS, "/style.css", "text/css");
  });

  // Route for checking url exist
  // server.on("/url", HTTP_GET, [](AsyncWebServerRequest *request) {
  //   request->send(200); 
  // });
    
  server.serveStatic("/", SPIFFS, "/");
  
  // Start server
  server.begin();


  xTaskCreatePinnedToCore(
    loop1,                /* Task function. */
    "UltrasonicTask",     /* name of task. */
    10000,                /* Stack size of task */
    NULL,                 /* parameter of the task */
    0,                    /* priority of the task */
    &Task1,               /* Task handle to keep track of created task */
    0);                   /* pin task to core 0 */                  
  delay(500);
}


void loop() {
  ws.cleanupClients();
}