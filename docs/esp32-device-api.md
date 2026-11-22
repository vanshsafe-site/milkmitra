# MilkMitra ESP32 Device API

## Setup
1. Run `supabase/schema.sql` and then `supabase/device-api.sql` in the Supabase SQL Editor.
2. In Vercel, configure `SUPABASE_SERVICE_ROLE_KEY` with your project's service-role key. The server also uses the existing Supabase URL and anon-key environment values. **Never add the service-role key to a `VITE_` variable or firmware.**
3. Deploy the site, sign in, open **ESP32 Device**, and create a device key. The raw key is shown once. Copy it securely.
4. Open `firmware/esp32-milkmitra/esp32-milkmitra.ino` in Arduino IDE. Install the Arduino ESP32 core 3.x and U8g2 library. Paste the one-time key into `API_KEY` and the API URL shown in your MilkMitra account into `API_URL`. The example defaults to `https://milkmitra.vercel.app/api/milk-readings`.
5. Select **ESP32 Dev Module**. Flash the sketch to the classic ESP32 WROOM board. Wiring: SDA 21, SCL 22, SH1106 I2C address 0x3C, DOWN GPIO4, UP GPIO27. Buttons connect their GPIO to GND; internal pull-ups are enabled.
6. On first boot, the OLED shows a BLE setup name and PIN. Use the Android **ESP Provisioning** app to select the device and provide a 2.4 GHz Wi-Fi network. Credentials are persisted by ESP provisioning; later boots reconnect automatically. If Wi-Fi has not connected after about 15 seconds, BLE setup starts again.

## Button controls
- Short DOWN / UP: increase / decrease the selected simulated measurement.
- Hold DOWN for 0.7 seconds: choose next field (weight, turbidity, temperature, fat, SNF, pH, milk type).
- On milk type, short DOWN/UP cycles Cow, Buffalo, Mixed.
- Hold UP for 0.7 seconds: POST the current test reading.

## Endpoint
`POST https://<your-site>/api/milk-readings`

Headers:
- `Content-Type: application/json`
- `X-API-Key: <per-device key>`

Example JSON (include only measurements the sensors actually provide):

```json
{
  "device_id": "milk-analyser-01",
  "milk_type": "Cow",
  "weight_kg": 12.5,
  "turbidity_ntu": 8.2,
  "temperature_c": 4.1,
  "fat_percent": 4.2,
  "snf_percent": 8.6,
  "ph": 6.7
}
```

Successful uploads return HTTP 201. Values are recorded as sensor readings separately from farmer payment collections. `weight_kg` is mass, not litres. The firmware sample currently simulates values using the buttons; connect and calibrate actual sensors before using measurements operationally. The account's ESP32 Device page lists the most recent 50 readings and allows the owner to revoke device keys. Keys are stored server-side as SHA-256 hashes and only shown once at creation.

The sketch validates HTTPS with the ESP32 certificate bundle. Do not disable certificate checks or use HTTP for the API key.
