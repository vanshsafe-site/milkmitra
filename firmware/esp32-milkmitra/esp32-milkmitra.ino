/* Vansh OS ESP32 milk-reading demo.
 * Classic ESP32 Dev Module, Arduino ESP32 core 3.x, U8g2.
 * SDA 21 / SCL 22, SH1106 128x64 @ 0x3C, DOWN GPIO4, UP GPIO27.
 * Buttons use INPUT_PULLUP and connect the pin to GND.
 * Short DOWN/UP adjusts the selected simulated value; hold DOWN selects the
 * next field; hold UP uploads. This is a button-driven test UI, not a sensor.
 */
#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <U8g2lib.h>
#include <esp_crt_bundle.h>

const char *WIFI_SSID = "YOUR_2_4_GHZ_WIFI";
const char *WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char *API_URL = "https://milkmitra.vercel.app/api/milk-readings";
const char *API_KEY = "PASTE_ACCOUNT_DEVICE_KEY_HERE";
const char *DEVICE_ID = "milk-analyser-01";

constexpr uint8_t DOWN_PIN = 4, UP_PIN = 27;
constexpr uint32_t DEBOUNCE_MS = 25, LONG_PRESS_MS = 700;
U8G2_SH1106_128X64_NONAME_F_HW_I2C oled(U8G2_R2, U8X8_PIN_NONE);

struct Measurement { const char *name; float value; float step; uint8_t decimals; };
Measurement fields[] = {
  {"Weight kg", 12.5f, 0.1f, 1}, {"Turbidity NTU", 8.2f, 0.5f, 1},
  {"Temp C", 4.1f, 0.1f, 1}, {"Fat %", 4.2f, 0.1f, 1},
  {"SNF %", 8.6f, 0.1f, 1}, {"pH", 6.7f, 0.1f, 1},
};
constexpr size_t FIELD_COUNT = sizeof(fields) / sizeof(fields[0]);
size_t selected = 0;
const char *milkTypes[] = {"Cow", "Buffalo", "Mixed"};
size_t milkType = 0;

struct Button {
  uint8_t pin; bool raw = false, stable = false, longFired = false;
  uint32_t changedAt = 0, downAt = 0;
  void begin(uint8_t p) { pin = p; pinMode(pin, INPUT_PULLUP); raw = stable = digitalRead(pin) == LOW; longFired = stable; }
  uint8_t poll(uint32_t now) {
    bool reading = digitalRead(pin) == LOW;
    if (reading != raw) { raw = reading; changedAt = now; }
    if (raw != stable && now - changedAt >= DEBOUNCE_MS) {
      stable = raw;
      if (stable) { downAt = now; longFired = false; }
      else if (!longFired) return 1;
    }
    if (stable && !longFired && now - downAt >= LONG_PRESS_MS) { longFired = true; return 2; }
    return 0;
  }
};
Button downButton, upButton;
char statusLine[25] = "Ready to simulate";

void drawScreen() {
  oled.clearBuffer(); oled.setFont(u8g2_font_5x8_tf);
  oled.drawStr(0, 9, "MILKMITRA ESP32 TEST");
  oled.drawHLine(0, 12, 128);
  oled.drawStr(0, 25, fields[selected].name);
  char value[24]; dtostrf(fields[selected].value, 1, fields[selected].decimals, value);
  oled.drawStr(0, 39, value);
  char type[24]; snprintf(type, sizeof(type), "Milk: %s", milkTypes[milkType]); oled.drawStr(0, 50, type);
  oled.drawStr(0, 62, statusLine);
  oled.sendBuffer();
}

void uploadReading() {
  if (WiFi.status() != WL_CONNECTED) { snprintf(statusLine, sizeof(statusLine), "Wi-Fi offline"); return; }
  WiFiClientSecure tls;
  tls.setCACertBundle(x509_crt_bundle);
  HTTPClient http;
  if (!http.begin(tls, API_URL)) { snprintf(statusLine, sizeof(statusLine), "HTTPS setup failed"); return; }
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", API_KEY);
  char json[320];
  snprintf(json, sizeof(json),
    "{\"device_id\":\"%s\",\"milk_type\":\"%s\",\"weight_kg\":%.1f,\"turbidity_ntu\":%.1f,\"temperature_c\":%.1f,\"fat_percent\":%.1f,\"snf_percent\":%.1f,\"ph\":%.1f}",
    DEVICE_ID, milkTypes[milkType], fields[0].value, fields[1].value,
    fields[2].value, fields[3].value, fields[4].value, fields[5].value);
  int code = http.POST((uint8_t *)json, strlen(json));
  snprintf(statusLine, sizeof(statusLine), code == 201 ? "Upload successful" : "Upload failed: %d", code);
  http.end();
}

void setup() {
  Serial.begin(115200);
  downButton.begin(DOWN_PIN); upButton.begin(UP_PIN);
  Wire.begin(21, 22); oled.setI2CAddress(0x3C << 1); oled.setBusClock(400000); oled.begin();
  snprintf(statusLine, sizeof(statusLine), "Connecting Wi-Fi..."); drawScreen();
  WiFi.mode(WIFI_STA); WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  uint32_t start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) { delay(250); }
  snprintf(statusLine, sizeof(statusLine), WiFi.status() == WL_CONNECTED ? "Wi-Fi ready" : "Wi-Fi failed");
  drawScreen();
}

void loop() {
  uint32_t now = millis();
  uint8_t down = downButton.poll(now), up = upButton.poll(now);
  bool changed = false;
  if (down == 1) { fields[selected].value += fields[selected].step; changed = true; }
  if (up == 1) {
    if (selected == FIELD_COUNT) milkType = (milkType + 1) % 3;
    else fields[selected].value -= fields[selected].step;
    changed = true;
  }
  if (down == 2) { selected = (selected + 1) % (FIELD_COUNT + 1); changed = true; }
  if (up == 2) { snprintf(statusLine, sizeof(statusLine), "Uploading..."); drawScreen(); uploadReading(); changed = true; }
  if (changed) drawScreen();
  delay(5);
}
