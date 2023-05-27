#include <Arduino.h>
#include <update.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <math.h>
#include "Update.h"
#include <Firebase_ESP_Client.h>
#include <addons/TokenHelper.h> // Provide the token generation process info.

/* Define the WiFi credentials */
#define WIFI_SSID ""
#define WIFI_PASSWORD ""

/* Define the API Key */
#define API_KEY ""

/* Define the project ID */
#define FIREBASE_PROJECT_ID ""

/* Define the user Email and password that alreadey registerd or added in your project */
#define USER_EMAIL ""
#define USER_PASSWORD ""


// Define Firebase Data object
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// timer variable
hw_timer_t *Timer = NULL;
#define INTERRUPT_PIN 27
int timeBase = 0;
int currentTime = 0;
int counterPulse = 0;









void firebaseWrite(double voltage, int counts, String id) {
    // Firebase.ready() should be called repeatedly to handle authentication tasks.
    // Append counts and channel
    for(;;) {
        if (Firebase.ready()) {
            std::vector<struct fb_esp_firestore_document_write_t> writes;
            struct fb_esp_firestore_document_write_t transform_write;
            transform_write.type = fb_esp_firestore_document_write_type_transform;
            transform_write.document_transform.transform_document_path = id; // id of Project
            struct fb_esp_firestore_document_write_field_transforms_t field_transforms;
            field_transforms.fieldPath = "dataCounts"; // field path
            field_transforms.transform_type = fb_esp_firestore_transform_type_append_missing_elements;

            FirebaseJson content;
            content.set("values/[0]/integerValue", counts);

            field_transforms.transform_content = content.raw();
            transform_write.document_transform.field_transforms.push_back(field_transforms);
            writes.push_back(transform_write);

            if (Firebase.Firestore.commitDocument(&fbdo, FIREBASE_PROJECT_ID, "" /* databaseId can be (default) or empty */, writes /* dynamic array of fb_esp_firestore_document_write_t */, "" /* transaction */)) {
                //Serial.println("Add counts to an array");
                break;
            } else {
                Serial.println(fbdo.errorReason());
            }
        } else {
            Serial.println("[Firebase] Firebase not ready");
        }
        delay(100);
    }
    
    for(;;) {
        // Append Channel
        if (Firebase.ready()) {
            std::vector<struct fb_esp_firestore_document_write_t> writes;
            struct fb_esp_firestore_document_write_t transform_write;
            transform_write.type = fb_esp_firestore_document_write_type_transform;
            transform_write.document_transform.transform_document_path = id; // id of Project
            struct fb_esp_firestore_document_write_field_transforms_t field_transforms;
            field_transforms.fieldPath = "dataVoltage"; // field path
            field_transforms.transform_type = fb_esp_firestore_transform_type_append_missing_elements;

            FirebaseJson content;
            content.set("values/[0]/doubleValue", voltage);

            field_transforms.transform_content = content.raw();
            transform_write.document_transform.field_transforms.push_back(field_transforms);
            writes.push_back(transform_write);

            if (Firebase.Firestore.commitDocument(&fbdo, FIREBASE_PROJECT_ID, "" /* databaseId can be (default) or empty */, writes /* dynamic array of fb_esp_firestore_document_write_t */, "" /* transaction */)) {
                //Serial.println("Add counts to an array");
                break;
            } else {
                Serial.println(fbdo.errorReason());
            }
        } else {
            Serial.println("[Firebase] Firebase not ready");
        }
        delay(100);
    }

    Serial.println("[Database] Add counts and channel to database");
}

void IRAM_ATTR onTimer() {
    currentTime++;
    timerWrite(Timer, 0);
}

void IRAM_ATTR myISR() { // increment counts from external interrupts
    counterPulse++;
}

int counting(int inputTime) {
    inputTime++; // always plus 1 to time 
    timeBase = inputTime; 
    currentTime = 0;
    int counts = 0;
    timerAlarmEnable(Timer); // Enable the timer
    attachInterrupt(digitalPinToInterrupt(INTERRUPT_PIN), myISR, RISING); 
    counterPulse = 0;
    for(;;) {
        if(currentTime >= timeBase){
            counts = counterPulse;
            break;
        } 
        delayMicroseconds(5); // delay for stability
    }
    delay(100);
    detachInterrupt(digitalPinToInterrupt(INTERRUPT_PIN));
    timerAlarmDisable(Timer);

    return counts;
}

void singleScan(double LLD, double ULD, int time, String id) {
    double dummyLLD = LLD;
    double dummyULD = ULD;    
    if (LLD>ULD){
        dummyULD = LLD;
    }
    
    int bitLLD = (dummyLLD+4E-15)/0.0381;
    int bitULD = (dummyULD+4E-15)/0.0381;
    int bitWindow = bitULD - bitLLD;

    dacWrite(26, bitWindow); // Window Voltage
    dacWrite(25, bitLLD); // LLD Voltage    

    int counts = counting(time);
    firebaseWrite(dummyLLD, counts, id);

    Serial.print("[SCA Auto Scan] ");
    Serial.print(bitLLD);
    Serial.print("-");
    Serial.print(dummyLLD);
    Serial.print(" ");
    Serial.print(bitULD);
    Serial.print("-");
    Serial.print(dummyULD);
    Serial.print(" ");
    Serial.println(counts);

    if (Firebase.ready()) {
        FirebaseJson content;
        String documentPath = "Project/Document";
        content.set("fields/status/booleanValue", false);
        if (Firebase.Firestore.patchDocument(&fbdo, FIREBASE_PROJECT_ID, "" /* databaseId can be (default) or empty */, documentPath.c_str(), content.raw(), "count,status" /* updateMask */)) {
            Serial.println("[Status] Set status to waiting");
            //Serial.printf("ok\n%s\n\n", fbdo.payload().c_str());
        } else {
            Serial.println(fbdo.errorReason());
        }
    }
}


void autoScan(double LLD, double window, int time, String id) {
    
    int bitLLD = (LLD+4E-15)/0.0381;
    int bitWindow = (window+4E-15)/0.0381;
    double dummyLLD = LLD;
    double dummyWindow = window;

    for (int i = 1; i <= ceil((10-LLD)/window); i++) {
        bitWindow = (bitLLD + bitWindow > 255) ? 255 - bitLLD : bitWindow;
        dacWrite(26, bitWindow); // Window Voltage
        dacWrite(25, bitLLD); // LLD Voltage
        int counts = counting(time);
        firebaseWrite(dummyLLD, counts, id);
        
        Serial.print("[SCA Auto Scan] ");
        Serial.print(i);
        Serial.print(" ");
        Serial.print(bitLLD);
        Serial.print("-");
        Serial.print(dummyLLD);
        Serial.print(" ");
        Serial.print(bitWindow);
        Serial.print("-");
        Serial.print(dummyWindow);
        Serial.print(" ");
        Serial.println(counts);
 
        bitLLD += bitWindow;
        dummyLLD += dummyWindow;
    }

    if (Firebase.ready()) {
        FirebaseJson content;
        String documentPath = "Project/Document";
        content.set("fields/status/booleanValue", false);
        if (Firebase.Firestore.patchDocument(&fbdo, FIREBASE_PROJECT_ID, "" /* databaseId can be (default) or empty */, documentPath.c_str(), content.raw(), "count,status" /* updateMask */)) {
            Serial.println("[Status] Set status to waiting");
            //Serial.printf("ok\n%s\n\n", fbdo.payload().c_str());
        } else {
            Serial.println(fbdo.errorReason());
        }
    }

}

void setup() {

    Serial.begin(9600);
    pinMode(LED_BUILTIN, OUTPUT);

    Timer = timerBegin(0, 80, true);
    timerAttachInterrupt(Timer, &onTimer, true);
    timerAlarmWrite(Timer, 1000000, true); // ISR every 1 second

    pinMode(INTERRUPT_PIN, INPUT_PULLUP);

    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.print("[Wi-Fi] Try to Connected");
    while (WiFi.status() != WL_CONNECTED)
    {
        Serial.print(".");
        delay(1000);
        digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
    }
    digitalWrite(LED_BUILTIN, HIGH);    
    Serial.println();
    Serial.print("[Wi-Fi] Connected with IP: ");
    Serial.println(WiFi.localIP());
    Serial.println();

    Serial.printf("[Database] Firebase Client v%s\n\n", FIREBASE_CLIENT_VERSION);

    /* Assign the api key and user sign in credentials */
    config.api_key = API_KEY;
    auth.user.email = USER_EMAIL;
    auth.user.password = USER_PASSWORD;

    /* Assign the callback function for the long running token generation task */
    config.token_status_callback = tokenStatusCallback; 

    /* Limit the size of response payload to be collected in FirebaseData */
    fbdo.setResponseSize(2048);
    Firebase.begin(&config, &auth);
    Firebase.reconnectWiFi(true);
    Serial.println("");
}

void loop() {

    dacWrite(26, 0); // Window Voltage
    dacWrite(25, 0); // LLD Voltage

    if ((WiFi.status() == WL_CONNECTED)) { //Check the current connection status

        HTTPClient http;
        http.begin("https://zany-pink-dalmatian-hat.cyclic.app/"); //Specify the URL

        int httpCode = http.GET();                             
        if (httpCode > 0) { //Check for the returning code
            String payload = http.getString();

            char json[200];
            payload.toCharArray(json, 200);

            DynamicJsonDocument doc(1024);
            deserializeJson(doc, json);

            double LLD = doc["LLD"];
            double window = doc["window"];
            int time = doc["time"];
            String id = doc["id"];
            bool status = doc["status"];
            String mode = doc["mode"];

            

            if (status==true) {
                Serial.println("[Status] Starting...");
                Serial.print("[Path] ");
                Serial.print(id);
                Serial.println("");
                if (mode=="Auto Scan") {
                    autoScan(LLD, window, time, id);
                } else if (mode=="Integral") {
                    singleScan(LLD, window, time, id);
                } else if (mode=="Manual") {
                    singleScan(LLD, window, time, id);
                } else {
                    Serial.println("[ERROR] Mode did not match");
                }
            } else {
                Serial.println("[Status] Waiting for request...");
            }

        } else {
            Serial.println("[ERROR] Error on HTTP request");
        }
        http.end(); // Free the resources
    }
  
    delay(5000); // Delay to prevent too much request
}