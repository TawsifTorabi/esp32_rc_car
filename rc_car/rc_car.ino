//ibrary from me-no-dev
#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>

const char *ssid = "+++";
const char *password = "+++";

int motor1Pin1 = 27;
int motor1Pin2 = 26;
int enable1Pin = 14;

int motor2Pin1 = 32;
int motor2Pin2 = 33;
int enable2Pin = 25;

int motor1Speed = 0;
int motor2Speed = 0;

const int ledPin = 12; // Change this to the pin where your LED is connected
// Variable to track the LED state
bool ledState = LOW;

AsyncWebServer server(80);
AsyncWebSocket ws("/remote");

unsigned long lastMessageTime = 0;
const unsigned long messageTimeout = 500; // 2 seconds

void stopMotors() {
  motor1Speed = 0;
  motor2Speed = 0;
  digitalWrite(motor1Pin1, LOW);
  digitalWrite(motor1Pin2, LOW);
  digitalWrite(motor2Pin1, LOW);
  digitalWrite(motor2Pin2, LOW);
  analogWrite(enable1Pin, motor1Speed);
  analogWrite(enable2Pin, motor2Speed);
}

void notifyClients() {
  ws.textAll(String("Notification"));
}


//Switch ON or OFF LED
void toggleLED() {
  ledState = !ledState; // Toggle the state (LOW to HIGH or HIGH to LOW)
  digitalWrite(ledPin, ledState); // Set the LED to the new state
}
// Function to blip the LED
void blipLED(int duration) {
  digitalWrite(ledPin, HIGH); // Turn on the LED
  delay(duration); // Wait for the specified duration in milliseconds
  digitalWrite(ledPin, LOW); // Turn off the LED
  delay(duration); // Wait for the same duration again
}




/*
Stay Cautious while using voltage detection, 
I've used tuned voltage divider circuit with R1=95k and R2=20k 
*/

const int analogInputBat = 34; // Use pin 4 on your ESP32
const float vRef = 3.3;    // ESP32 reference voltage
const float batteryVoltageScalingFactor = 3.01; // Adjusted based on your voltage divider
const float voltageOffset = 2.62; // Offset correction value (adjust as needed)

String measureOriginalBatteryVoltage() {
  int rawValue = analogRead(analogInputBat); // Read the analog input
  Serial.print("Raw Value: ");
  Serial.println(rawValue);
  float voltage = (rawValue / 4095.0) * vRef; // Convert to voltage

  // Use map() to upscale the voltage
  float originalBatteryVoltage = map(voltage * 100, 0, batteryVoltageScalingFactor * 100, 0, 1600) / 100.0;

  // Apply the offset correction
  originalBatteryVoltage += voltageOffset;

  Serial.print("Battery Voltage: ");
  Serial.print(originalBatteryVoltage, 2); // Display voltage with 2 decimal places
  Serial.println("V");

  // Convert the voltage to a String with two decimal places
  String voltageString = String(originalBatteryVoltage, 2);

  return voltageString;
}





void handleWebSocketMessage(void *arg, uint8_t *data, size_t len) {
    lastMessageTime = millis(); // Reset the timeout timer
    AwsFrameInfo *info = (AwsFrameInfo *)arg;
    if (info->final && info->index == 0 && info->len == len && info->opcode == WS_TEXT) {
        data[len] = 0;
        const char *message = (char *)data;
        Serial.println(message);
        if (strncmp(message, "direction:", 10) == 0) {
            // Parse the direction and speed values
            char direction[10];
            int speed1, speed2;
            if (sscanf(message + 10, "%9[^,],speed:%d,%d", direction, &speed1, &speed2) == 3) {
                motor1Speed = speed1;
                motor2Speed = speed2;

                if (strcmp(direction, "forward") == 0) {
                    // Handle forward direction
                    digitalWrite(motor1Pin1, LOW);
                    digitalWrite(motor1Pin2, HIGH);
                    digitalWrite(motor2Pin1, HIGH);
                    digitalWrite(motor2Pin2, LOW);
                } else if (strcmp(direction, "backward") == 0) {
                    // Handle backward direction
                    digitalWrite(motor1Pin1, HIGH);
                    digitalWrite(motor1Pin2, LOW);
                    digitalWrite(motor2Pin1, LOW);
                    digitalWrite(motor2Pin2, HIGH);

                } else if (strcmp(direction, "left") == 0) {
                    // Handle left direction
                    digitalWrite(motor1Pin1, HIGH);
                    digitalWrite(motor1Pin2, LOW);
                    digitalWrite(motor2Pin1, HIGH);
                    digitalWrite(motor2Pin2, LOW);
                } else if (strcmp(direction, "right") == 0) {
                    // Handle right direction
                    digitalWrite(motor1Pin1, LOW);
                    digitalWrite(motor1Pin2, HIGH);
                    digitalWrite(motor2Pin1, LOW);
                    digitalWrite(motor2Pin2, HIGH);
                } else {
                    // Default to stop
                    stopMotors();
                }

                notifyClients();
            }
        } else if (strcmp(message, "stop") == 0) {
            stopMotors();
            notifyClients();
        } else if (strcmp(message, "ping") == 0) {
            ws.textAll("pong");
        } else if (strcmp(message, "batlvl") == 0) {
            ws.textAll("battery:" + measureOriginalBatteryVoltage());
        } else if (strcmp(message, "headlight") == 0) {
            toggleLED();
        } else if (strcmp(message, "dipper") == 0) {
            blipLED(50);
        }

        analogWrite(enable1Pin, motor1Speed);
        analogWrite(enable2Pin, motor2Speed);
    }
}







void onEvent(AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type,
             void *arg, uint8_t *data, size_t len) {
  switch (type) {
    case WS_EVT_CONNECT:
      Serial.printf("WebSocket client #%u connected from %s\n", client->id(), client->remoteIP().toString().c_str());
      break;
    case WS_EVT_DISCONNECT:
      Serial.printf("WebSocket client #%u disconnected\n", client->id());
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
  ws.onEvent(onEvent);
  server.addHandler(&ws);
}



void setup() {
  Serial.begin(115200);

  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW);

  pinMode(motor1Pin1, OUTPUT);
  pinMode(motor1Pin2, OUTPUT);
  pinMode(enable1Pin, OUTPUT);

  pinMode(motor2Pin1, OUTPUT);
  pinMode(motor2Pin2, OUTPUT);
  pinMode(enable2Pin, OUTPUT);

  stopMotors(); // Initialize motors to a stopped state

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }

  Serial.println("Connected to WiFi");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  initWebSocket();

  server.begin();

  Serial.println("Configuring Watch Dog Timer...");
}

void loop() {
  ws.cleanupClients();

  // Check if the timeout has been reached and stop motors if needed
  if (millis() - lastMessageTime >= messageTimeout) {
    stopMotors();
  }
}
