/*
 * MilkMitra ESP32 milk-reading demo and BLE Wi-Fi setup.
 * Board: classic ESP32 Dev Module / WROOM, Arduino-ESP32 core 3.4.0 or newer.
 * OLED: SH1106 128x64 I2C @ 0x3C, SDA=21, SCL=22.
 * Buttons: DOWN=GPIO4 and UP=GPIO27, each connected between GPIO and GND.
 *
 * Setup:
 * 1. In MilkMitra, sign in -> ESP32 Device -> create a key for this device.
 * 2. Paste the per-device key below. Set API_URL to the exact URL shown there.
 * 3. Flash this sketch. On first boot the OLED shows the BLE device name and
 *    PIN. In the Android ESP Provisioning app, provision over BLE using that
 *    name/PIN and enter a 2.4 GHz Wi-Fi network.
 *
 * This is a button-driven SIMULATOR. Values are not sensor readings. Replace
 * them with calibrated sensor measurements before relying on them operationally.
 * Short DOWN/UP: increment/decrement current value. Hold DOWN: next field.
 * Hold UP: upload the reading. On Milk type, short UP cycles Cow/Buffalo/Mixed.
 */
#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <U8g2lib.h>
#include <Preferences.h>
#include <atomic>
#include <time.h>
#include <esp_arduino_version.h>
#include <esp_wifi.h>
#include <network_provisioning/manager.h>
#include <network_provisioning/scheme_ble.h>

#if ESP_ARDUINO_VERSION < ESP_ARDUINO_VERSION_VAL(3, 4, 0)
#error "Use Arduino-ESP32 core 3.4.0 or newer for built-in HTTPS CA bundle support."
#endif
#if !CONFIG_IDF_TARGET_ESP32
#error "This sketch targets the classic ESP32 (WROOM/Dev Module)."
#endif
#if !CONFIG_ESP_PROTOCOMM_SUPPORT_SECURITY_VERSION_1
#error "Enable ESP provisioning Security 1 support in the ESP32 core configuration."
#endif

// Paste the API URL and key generated in the MilkMitra account's ESP32 Device page.
const char *API_URL = "https://milkmitra.vercel.app/api/milk-readings";
const char *API_KEY = "PASTE_ACCOUNT_DEVICE_KEY_HERE";
const char *DEVICE_ID = "milk-analyser-01";

constexpr uint8_t DOWN_PIN = 4, UP_PIN = 27;
constexpr uint32_t DEBOUNCE_MS = 25, LONG_PRESS_MS = 700;
constexpr uint32_t PROVISION_AFTER_MS = 15000;
U8G2_SH1106_128X64_NONAME_F_HW_I2C oled(U8G2_R2, U8X8_PIN_NONE);

struct Measurement { const char *name; float value; float step; uint8_t decimals; };
Measurement fields[] = {
  {"Weight kg", 12.5f, 0.1f, 1}, {"Turbidity NTU", 8.2f, 0.5f, 1},
  {"Temp C", 4.1f, 0.1f, 1}, {"Fat %", 4.2f, 0.1f, 1},
  {"SNF %", 8.6f, 0.1f, 1}, {"pH", 6.7f, 0.1f, 1},
};
constexpr size_t FIELD_COUNT = sizeof(fields) / sizeof(fields[0]);
constexpr size_t TYPE_FIELD = FIELD_COUNT;
size_t selected = 0, milkType = 0;
const char *const milkTypes[] = {"Cow", "Buffalo", "Mixed"};

struct Button {
  uint8_t pin = 0; bool raw = false, stable = false, longFired = false;
  uint32_t changedAt = 0, downAt = 0;
  void begin(uint8_t p) {
    pin = p; pinMode(pin, INPUT_PULLUP); raw = stable = digitalRead(pin) == LOW;
    longFired = stable; // Ignore a button held during boot until it is released.
  }
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
char statusLine[25] = "Starting...";
char provisionName[24] = {}, provisionPin[9] = {};
std::atomic<bool> gotIp{false}, provisionEnded{false};
bool provisioningStarted = false;
uint32_t bootAt = 0, frameAt = 0;

void onWiFiEvent(arduino_event_t *event) {
  if (event->event_id == ARDUINO_EVENT_WIFI_STA_GOT_IP) gotIp.store(true);
  else if (event->event_id == ARDUINO_EVENT_PROV_END) provisionEnded.store(true);
}

bool startProvisioning() {
  network_prov_mgr_config_t config = {};
  config.scheme = network_prov_scheme_ble;
  config.scheme_event_handler = NETWORK_PROV_EVENT_HANDLER_NONE;
  if (network_prov_mgr_init(config) != ESP_OK) return false;
  static uint8_t serviceUuid[16] = {
    0xb4, 0xdf, 0x5a, 0x1c, 0x3f, 0x6b, 0xf4, 0xbf,
    0xea, 0x4a, 0x82, 0x03, 0x04, 0x90, 0x1a, 0x02
  };
  if (network_prov_scheme_ble_set_service_uuid(serviceUuid) != ESP_OK ||
      network_prov_mgr_start_provisioning(NETWORK_PROV_SECURITY_1, provisionPin, provisionName, nullptr) != ESP_OK) {
    network_prov_mgr_deinit();
    return false;
  }
  provisioningStarted = true;
  snprintf(statusLine, sizeof(statusLine), "BLE setup active");
  return true;
}

void drawScreen() {
  oled.clearBuffer(); oled.setFont(u8g2_font_5x8_tf);
  oled.drawStr(0, 9, "MILKMITRA ESP32 TEST"); oled.drawHLine(0, 12, 128);
  if (WiFi.status() != WL_CONNECTED && provisioningStarted) {
    oled.drawStr(0, 24, "Android ESP Provisioning");
    oled.drawStr(0, 36, provisionName);
    char pinLine[20]; snprintf(pinLine, sizeof(pinLine), "PIN: %s", provisionPin);
    oled.drawStr(0, 48, pinLine);
    oled.drawStr(0, 62, "Select BLE device in app");
  } else {
    if (selected == TYPE_FIELD) {
      oled.drawStr(0, 25, "Milk type");
      oled.drawStr(0, 39, milkTypes[milkType]);
    } else {
      oled.drawStr(0, 25, fields[selected].name);
      char value[24]; dtostrf(fields[selected].value, 1, fields[selected].decimals, value);
      oled.drawStr(0, 39, value);
    }
    char wifiLine[24]; snprintf(wifiLine, sizeof(wifiLine), "Wi-Fi: %s", WiFi.status() == WL_CONNECTED ? "online" : "offline");
    oled.drawStr(0, 50, wifiLine);
    oled.drawStr(0, 62, statusLine);
  }
  oled.sendBuffer();
}

void uploadReading() {
  if (WiFi.status() != WL_CONNECTED) { snprintf(statusLine, sizeof(statusLine), "Wi-Fi offline"); return; }
  if (strstr(API_KEY, "PASTE_") != nullptr || strlen(API_KEY) < 20) {
    snprintf(statusLine, sizeof(statusLine), "Set API key in sketch"); return;
  }

  // Certificate validation checks certificate dates, so synchronize the clock first.
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  time_t now = time(nullptr);
  uint32_t clockWaitStarted = millis();
  while (now < 8 * 3600 * 2 && millis() - clockWaitStarted < 15000) {
    delay(250);
    now = time(nullptr);
  }
  if (now < 8 * 3600 * 2) {
    snprintf(statusLine, sizeof(statusLine), "Clock sync failed");
    return;
  }

  WiFiClientSecure tls;
  tls.useBuiltinCACertBundle(); // Validate HTTPS with the ESP32 built-in Mozilla CA bundle.
  HTTPClient http;
  http.setTimeout(12000);
  if (!http.begin(tls, API_URL)) { snprintf(statusLine, sizeof(statusLine), "HTTPS setup failed"); return; }
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", API_KEY);
  char json[320];
  snprintf(json, sizeof(json),
    "{\"device_id\":\"%s\",\"milk_type\":\"%s\",\"weight_kg\":%.1f,\"turbidity_ntu\":%.1f,\"temperature_c\":%.1f,\"fat_percent\":%.1f,\"snf_percent\":%.1f,\"ph\":%.1f}",
    DEVICE_ID, milkTypes[milkType], fields[0].value, fields[1].value,
    fields[2].value, fields[3].value, fields[4].value, fields[5].value);
  int code = http.POST((uint8_t *)json, strlen(json));
  if (code == 201) snprintf(statusLine, sizeof(statusLine), "Upload successful");
  else if (code == 401) snprintf(statusLine, sizeof(statusLine), "API key rejected");
  else snprintf(statusLine, sizeof(statusLine), "Upload failed: %d", code);
  http.end();
}

void setup() {
  Serial.begin(115200); bootAt = millis();
  downButton.begin(DOWN_PIN); upButton.begin(UP_PIN);
  Wire.begin(21, 22); oled.setI2CAddress(0x3C << 1); oled.setBusClock(400000); oled.begin();
  snprintf(provisionPin, sizeof(provisionPin), "%08lu", (unsigned long)(esp_random() % 100000000));
  uint64_t mac = ESP.getEfuseMac();
  snprintf(provisionName, sizeof(provisionName), "MILKMITRA_%06lX", (unsigned long)(mac & 0xffffff));
  WiFi.onEvent(onWiFiEvent);
  WiFi.persistent(true); WiFi.mode(WIFI_STA); WiFi.setAutoReconnect(true);
  WiFi.begin(); // Reconnect to credentials previously saved by ESP BLE provisioning.
  snprintf(statusLine, sizeof(statusLine), "Checking saved Wi-Fi");
  drawScreen();
}

void loop() {
  uint32_t now = millis();
  if (gotIp.exchange(false)) snprintf(statusLine, sizeof(statusLine), "Wi-Fi connected");
  if (provisionEnded.exchange(false)) {
    provisioningStarted = false;
    snprintf(statusLine, sizeof(statusLine), "Setup ended; reconnect");
  }
  if (WiFi.status() != WL_CONNECTED && !provisioningStarted && now - bootAt >= PROVISION_AFTER_MS) {
    if (!startProvisioning()) snprintf(statusLine, sizeof(statusLine), "BLE setup failed");
  }

  uint8_t down = downButton.poll(now), up = upButton.poll(now);
  bool changed = false;
  if (down == 1) {
    if (selected == TYPE_FIELD) milkType = (milkType + 1) % 3;
    else fields[selected].value += fields[selected].step;
    changed = true;
  }
  if (up == 1) {
    if (selected == TYPE_FIELD) milkType = (milkType + 2) % 3;
    else fields[selected].value -= fields[selected].step;
    changed = true;
  }
  if (down == 2) { selected = (selected + 1) % (FIELD_COUNT + 1); changed = true; }
  if (up == 2) {
    snprintf(statusLine, sizeof(statusLine), "Uploading..."); drawScreen(); uploadReading(); changed = true;
  }
  if (changed || now - frameAt >= 500) { frameAt = now; drawScreen(); }
  delay(5);
}
