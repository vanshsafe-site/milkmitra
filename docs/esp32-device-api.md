# MilkMitra ESP32 Device API

## Setup
1. Run `supabase/schema.sql` and then `supabase/device-api.sql` in the Supabase SQL Editor.
2. In Vercel, configure `SUPABASE_SERVICE_ROLE_KEY` with your project's service-role key. The server also uses the existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment values. **Never add the service-role key to a `VITE_` variable or firmware.**
3. Deploy the site, sign in, open **ESP32 Device**, and create a device key. The raw key is shown once. Copy the displayed API URL and key into the ESP32 sketch. Use HTTPS.
4. Install the Arduino ESP32 core and U8g2 library, configure Wi-Fi/API values at the top of `firmware/esp32-milkmitra/esp32-milkmitra.ino`, then flash a classic ESP32 Dev Module. This sample uses SDA 21/SCL 22, SH1106 OLED I2C address 0x3C, DOWN GPIO4, UP GPIO27, and internal pull-ups.

## Endpoint
`POST https://<your-site>/api/milk-readings`

Headers:
- `Content-Type: application/json`
- `X-API-Key: <per-device key>`

JSON fields (include only what sensors provide):

```json
{
  "device_id": "milk-analyser-01",
  "milk_type": "Cow",
  "weight_kg": 12.5,
  "turbidity_ntu": 8.2,
  "temperature_c": 4.1,
  "fat_percent": 4.2,
  "snf_percent": 8.6,
  "ph": 6.7,
  "measured_at": "2026-11-22T10:30:00Z"
}
```

Successful uploads return HTTP 201 and a reading ID. Use `weight_kg` as mass, not litres. Turbidity is recorded as NTU. Measurements are stored as sensor readings, not automatically turned into farmer payment entries: a farmer, shift, and collection transaction must be selected separately in MilkMitra.

The **ESP32 Device** page lists the most recent 50 readings and allows the account owner to revoke keys. Revoke and create a replacement if a key is lost. API keys are stored server-side as SHA-256 hashes and only returned once at creation.

The Arduino sample uses the two buttons to choose a milk property, adjust a simulated value, cycle milk type, and submit a test reading. It does not claim values are sensor-derived; connect/calibrate actual sensors before using measurements operationally.
