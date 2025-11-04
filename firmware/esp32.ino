/******** ESP32-CAM AIO — HC-SR04 + Camera + Flash + 2x Relay + MQTT Settings/Control ********
 * - Sensor utama: HC-SR04 (publish 1 Hz ke .../sensor/distance)
 * - Window deteksi [min..max] cm -> pipeline: foto+upload -> tunda -> solenoid ON (lockMs) -> OFF -> buzzer buzzerMs
 * - Control: capture, flash on/off/pulse, buzzer start/stop, lock open/closed/pulse, pipeline stop
 * - Settings: {"ultra":{"min":..,"max":..},"lock":{"ms":..},"buzzer":{"ms":..},"apply":true}
 * Pin (ESP32-CAM AI-Thinker):
 *   TRIG=GPIO15, ECHO=GPIO2 (wajib divider 5V->3V3), REL1=GPIO13 (solenoid), REL2=GPIO14 (buzzer), FLASH=GPIO4
 ***************************************************************************************/

#include <WiFi.h>
#include <PubSubClient.h>
#include "esp_camera.h"
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"
#include <limits.h>  // untuk LONG_MIN

// ===================== KONFIG WIFI & MQTT =====================
const char* WIFI_SSID = "ppp";
const char* WIFI_PASS = "12345678";

const char* MQTT_HOST = "13.213.57.228";
const uint16_t MQTT_PORT = 1883;
const char* MQTT_USER = "smartbox";
const char* MQTT_PASSW = "engganngodinginginmcu";

// Device/Topics
const char* DEV_ID = "box-01";
String T_STATUS   = String("smartparcel/")+DEV_ID+"/status";
String T_DIST     = String("smartparcel/")+DEV_ID+"/sensor/distance";
String T_EVENT    = String("smartparcel/")+DEV_ID+"/event";
String T_PHSTAT   = String("smartparcel/")+DEV_ID+"/photo/status";
String T_CTRL     = String("smartparcel/")+DEV_ID+"/control";
String T_CTRLACK  = String("smartparcel/")+DEV_ID+"/control/ack";
String T_SETSET   = String("smartparcel/")+DEV_ID+"/settings/set";
String T_SETCUR   = String("smartparcel/")+DEV_ID+"/settings/cur";
String T_SETACK   = String("smartparcel/")+DEV_ID+"/settings/ack";

// Backend HTTP (RAW TCP hemat RAM)
const char* SERVER_HOST = "13.213.57.228";  // ganti ke backend kamu
const uint16_t SERVER_PORT = 8080;
const char* SERVER_PATH = "/api/v1/packages";
const char* API_BEARER  = "device_token_change_this"; // samakan dengan backend

// ===================== PIN ESP32-CAM (AI-Thinker) =====================
// HC-SR04
#define PIN_TRIG   15
#define PIN_ECHO    2   // WAJIB divider 5V->3V3 ke pin ini
// Relay
#define PIN_REL1   13   // solenoid (door lock)
#define PIN_REL2   14   // buzzer (via relay/MOSFET)
// Flash LED
#define PIN_FLASH   4   // LED flash kamera

// Kamera pins (default)
#define PWDN_GPIO_NUM 32
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM 0
#define SIOD_GPIO_NUM 26
#define SIOC_GPIO_NUM 27
#define Y9_GPIO_NUM 35
#define Y8_GPIO_NUM 34
#define Y7_GPIO_NUM 39
#define Y6_GPIO_NUM 36
#define Y5_GPIO_NUM 21
#define Y4_GPIO_NUM 19
#define Y3_GPIO_NUM 18
#define Y2_GPIO_NUM 5
#define VSYNC_GPIO_NUM 25
#define HREF_GPIO_NUM 23
#define PCLK_GPIO_NUM 22

// ===================== GLOBALS & TYPES =====================
WiFiClient tcp;
PubSubClient mqtt(tcp);
const bool RELAY_ACTIVE_LOW = true;

struct Settings {
  float     minCm   = 12.0f;    // window deteksi minimal
  float     maxCm   = 25.0f;    // window deteksi maksimal
  uint32_t  lockMs  = 5000;     // lama solenoid ON
  uint32_t  buzzerMs= 60000;    // lama buzzer berbunyi total
  uint16_t  buzzOn  = 500;      // pola buzzer ON
  uint16_t  buzzOff = 300;      // pola buzzer OFF
} S;

bool busy = false;
volatile bool stopAll = false;
volatile bool stopBuzz = false;
volatile bool stopLock = false;

unsigned long tLastPub = 0;
unsigned long lastPipeline = 0;
const unsigned long PIPELINE_COOLDOWN_MS = 15000;
float lastCm = NAN;

// H A R U S dideklarasi sebelum dipakai:
struct UploadResult { bool ok; int http; String body; };

// ===================== UTIL =====================
inline void relayWrite(uint8_t pin, bool on){
  if (RELAY_ACTIVE_LOW) digitalWrite(pin, on ? LOW : HIGH);
  else                  digitalWrite(pin, on ? HIGH : LOW);
}
inline void flashOn(bool on){ pinMode(PIN_FLASH, OUTPUT); digitalWrite(PIN_FLASH, on ? HIGH : LOW); }

// “delay” yang tetap proses WiFi/MQTT dan bisa dibatalkan
bool breatheDelayCancelable(unsigned long ms){
  unsigned long start = millis();
  while (millis()-start < ms){
    if (stopAll) return false;
    if (WiFi.status()!=WL_CONNECTED) WiFi.reconnect();
    if (mqtt.connected()) mqtt.loop();
    delay(5);
  }
  return true;
}

float ultraOne(uint32_t tout=40000UL){
  digitalWrite(PIN_TRIG, LOW); delayMicroseconds(3);
  digitalWrite(PIN_TRIG, HIGH); delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  unsigned long dur = pulseIn(PIN_ECHO, HIGH, tout);
  if (!dur) return NAN;
  return dur * 0.0343f / 2.0f;
}
float ultraCmStable(){
  float a=ultraOne(); delay(25);
  float b=ultraOne(); delay(25);
  float c=ultraOne();
  float v[3]={a,b,c};
  for(int i=0;i<3;i++) for(int j=i+1;j<3;j++) if (v[j]<v[i]){ float t=v[i]; v[i]=v[j]; v[j]=t; }
  int nanCnt=(isnan(a)?1:0)+(isnan(b)?1:0)+(isnan(c)?1:0);
  if (nanCnt>=2) return NAN;
  return v[1];
}

// ===================== WIFI =====================
void ensureWiFi(){
  if (WiFi.status()==WL_CONNECTED) return;
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  unsigned long t0=millis();
  while (WiFi.status()!=WL_CONNECTED){
    delay(300);
    if (millis()-t0>20000){ WiFi.reconnect(); t0=millis(); }
  }
}

// ===================== HTTP MULTIPART (RAW TCP) =====================
UploadResult httpUploadMultipart(const String& metaJson, const uint8_t* img, size_t len){
  UploadResult r{false, 0, ""};
  String boundary="----parcelboxBoundary7e3f9b";
  String head = "--"+boundary+"\r\n"
    "Content-Disposition: form-data; name=\"meta\"\r\n"
    "Content-Type: application/json\r\n\r\n"+metaJson+"\r\n"
    "--"+boundary+"\r\n"
    "Content-Disposition: form-data; name=\"photo\"; filename=\"capture.jpg\"\r\n"
    "Content-Type: image/jpeg\r\n\r\n";
  String tail = "\r\n--"+boundary+"--\r\n";
  size_t contentLen = head.length()+len+tail.length();

  if (!tcp.connect(SERVER_HOST, SERVER_PORT)){ r.ok=false; r.http=0; return r; }

  tcp.print(String("POST ")+SERVER_PATH+" HTTP/1.1\r\n");
  tcp.print(String("Host: ")+SERVER_HOST+":"+SERVER_PORT+"\r\n");
  tcp.print("Connection: close\r\n");
  tcp.print(String("Authorization: Bearer ")+API_BEARER+"\r\n");
  tcp.print(String("Content-Type: multipart/form-data; boundary=")+boundary+"\r\n");
  tcp.print(String("Content-Length: ")+contentLen+"\r\n\r\n");

  tcp.print(head);
  tcp.write(img, len);
  tcp.print(tail);

  // OPTIMIZED: Increased timeout 10s -> 30s for slow backend operations
  unsigned long t0=millis(); String statusLine="";
  while (tcp.connected() && millis()-t0<30000){
    if (tcp.available()){ statusLine = tcp.readStringUntil('\n'); break; }
    delay(10);
  }
  if (statusLine.length() < 12){ tcp.stop(); r.ok=false; r.http=0; return r; }
  r.http = statusLine.substring(9,12).toInt();
  r.ok = (r.http>=200 && r.http<300);

  while (tcp.connected()){
    String h = tcp.readStringUntil('\n');
    if (h == "\r" || h.length()==0) break;
  }
  while (tcp.connected() || tcp.available()){
    if (tcp.available()){ r.body += (char)tcp.read(); }
    else delay(1);
  }
  tcp.stop();
  return r;
}

// ===================== JSON HELPERS simpel =====================
long extractJsonLong(const String& body, const char* key){
  String k = String("\"")+key+"\":";
  int p = body.indexOf(k); if (p<0) return LONG_MIN;
  p += k.length();
  while (p < (int)body.length() && (body[p]==' ')) p++;
  int q=p;
  while (q < (int)body.length() && ( (body[q]>='0'&&body[q]<='9') || body[q]=='-' ) ) q++;
  if (q==p) return LONG_MIN;
  return body.substring(p,q).toInt();
}
String extractJsonString(const String& body, const char* key){
  String k = String("\"")+key+"\":";
  int p = body.indexOf(k); if (p<0) return String("");
  p += k.length();
  while (p < (int)body.length() && (body[p]==' ')) p++;
  if (p >= (int)body.length() || body[p] != '\"') return String("");
  p++; int q=p;
  while (q < (int)body.length() && body[q] != '\"') q++;
  if (q>= (int)body.length()) return String("");
  return body.substring(p,q);
}

// ===================== CAPTURE + UPLOAD (ACK detail) =====================
bool captureAndUploadWithRetry(const char* reason, float cm){
  const int MAX_TRY = 5;
  for (int attempt=1; attempt<=MAX_TRY; ++attempt){
    if (stopAll) return false;
    flashOn(true); delay(80);
    camera_fb_t* fb = esp_camera_fb_get();
    flashOn(false);

    if (!fb){
      mqtt.publish(T_PHSTAT.c_str(), "{\"ok\":false,\"err\":\"no_frame\"}", false);
      delay(500 * attempt);
      continue;
    }

    String meta = String("{\"deviceId\":\"")+DEV_ID+
                  "\",\"reason\":\""+String(reason)+
                  "\",\"distanceCm\":"+(isnan(cm)?String("null"):String(cm,1))+
                  ",\"firmware\":\"esp32cam-allinone\",\"try\":"+String(attempt)+"}";

    UploadResult ur = httpUploadMultipart(meta, fb->buf, fb->len);

    long id = extractJsonLong(ur.body, "id");
    String photoUrl = extractJsonString(ur.body, "photoUrl");
    String thumbUrl = extractJsonString(ur.body, "thumbUrl");
    String ts       = extractJsonString(ur.body, "ts");

    String ack = String("{\"ok\":") + (ur.ok?"true":"false") +
      ",\"http\":"+ String(ur.http) +
      ",\"try\":"+ String(attempt) +
      ",\"bytes\":"+ String((int)fb->len) +
      ",\"id\":"+ (id==LONG_MIN ? String("null"):String(id)) +
      ",\"photoUrl\":"+ (photoUrl.length()? String("\"")+photoUrl+"\"":"null") +
      ",\"thumbUrl\":"+ (thumbUrl.length()? String("\"")+thumbUrl+"\"":"null") +
      ",\"ts\":"+ (ts.length()? String("\"")+ts+"\"":"null") +
      ",\"deviceId\":\""+ DEV_ID + "\"" +
      ",\"meta\":{\"cm\":"+ (isnan(cm)?String("null"):String(cm,1)) + "}" +
      "}";

    mqtt.publish(T_PHSTAT.c_str(), ack.c_str(), false);
    esp_camera_fb_return(fb);
    if (ur.ok) return true;
    delay(700 * attempt);
  }
  return false;
}

// ===================== BUZZER & LOCK =====================
void buzzerPatternMs(uint32_t totalMs){
  stopBuzz = false;
  unsigned long start = millis();
  while (millis() - start < totalMs){
    if (stopAll || stopBuzz) break;
    relayWrite(PIN_REL2, true);  if (!breatheDelayCancelable(S.buzzOn)) break;
    relayWrite(PIN_REL2, false); if (!breatheDelayCancelable(S.buzzOff)) break;
  }
  relayWrite(PIN_REL2, false);
}
void lockPulseMs(uint32_t ms){
  stopLock = false;
  relayWrite(PIN_REL1, true);
  if (!breatheDelayCancelable(ms) || stopAll || stopLock){
    relayWrite(PIN_REL1, false);
    return;
  }
  relayWrite(PIN_REL1, false);
}

// ===================== PIPELINE =====================
void runPipeline(float cm){
  busy = true; stopAll=false; stopBuzz=false; stopLock=false;

  // 1) Tunggu acak 2–3s
  uint32_t d1 = 2000 + (esp_random() % 1001);
  mqtt.publish(T_EVENT.c_str(), String("{\"step\":\"wait_before_photo\",\"ms\":"+String(d1)+"}").c_str(), false);
  if (!breatheDelayCancelable(d1)){ busy=false; return; }

  // 2) Foto + upload
  bool sent = captureAndUploadWithRetry("detect", cm);
  mqtt.publish(T_EVENT.c_str(), sent? "{\"step\":\"photo_ok\"}" : "{\"step\":\"photo_failed\"}", false);
  if (!sent){ busy=false; lastPipeline=millis(); return; }

  // 3) Tunggu acak 1–2s
  uint32_t d2 = 1000 + (esp_random() % 1001);
  mqtt.publish(T_EVENT.c_str(), String("{\"step\":\"wait_before_lock\",\"ms\":"+String(d2)+"}").c_str(), false);
  if (!breatheDelayCancelable(d2)){ busy=false; return; }

  // 4) Solenoid ON (lockMs) lalu OFF
  mqtt.publish(T_EVENT.c_str(), String("{\"step\":\"lock_on_ms\",\"ms\":"+String(S.lockMs)+"}").c_str(), false);
  lockPulseMs(S.lockMs);
  mqtt.publish(T_EVENT.c_str(), "{\"step\":\"lock_off\"}", false);

  // 5) Buzzer (buzzerMs)
  mqtt.publish(T_EVENT.c_str(), String("{\"step\":\"buzzer_ms\",\"ms\":"+String(S.buzzerMs)+"}").c_str(), false);
  buzzerPatternMs(S.buzzerMs);

  busy = false;
  lastPipeline = millis();
}

// ===================== SETTINGS =====================
void publishSettingsCur(){
  String js = String("{\"ultra\":{\"min\":")+S.minCm+",\"max\":"+S.maxCm+"},"
               "\"lock\":{\"ms\":"+S.lockMs+"},"
               "\"buzzer\":{\"ms\":"+S.buzzerMs+"}}";
  mqtt.publish(T_SETCUR.c_str(), js.c_str(), true);
}

// ===================== MQTT CALLBACK =====================
void onMqtt(char* topic, byte* payload, unsigned int len){
  String top(topic);
  String s; s.reserve(len+1);
  for (unsigned i=0;i<len;i++) s += (char)payload[i];

  auto ack = [&](const String& j){ mqtt.publish(T_CTRLACK.c_str(), j.c_str(), false); };

  // -------- CONTROL --------
  if (top == T_CTRL){
    // pipeline stop
    if (s.indexOf("\"pipeline\"")>=0 && s.indexOf("\"stop\"")>=0){
      stopAll = true; stopBuzz = true; stopLock = true;
      ack("{\"ok\":true,\"action\":\"pipeline\",\"state\":\"stopping\"}");
      return;
    }
    // capture
    if (s.indexOf("\"capture\"")>=0 && s.indexOf("true")>=0){
      bool ok = captureAndUploadWithRetry("manual", lastCm);
      ack(String("{\"ok\":")+(ok?"true":"false")+",\"action\":\"capture\"}");
      return;
    }
    // flash
    if (s.indexOf("\"flash\"")>=0){
      if (s.indexOf("\"on\"")>=0){ flashOn(true);  ack("{\"ok\":true,\"action\":\"flash\",\"state\":\"on\"}"); return; }
      if (s.indexOf("\"off\"")>=0){ flashOn(false); ack("{\"ok\":true,\"action\":\"flash\",\"state\":\"off\"}"); return; }
      int pms = s.indexOf("\"ms\"");
      int ms = 150; if (pms>=0) ms = s.substring(s.indexOf(':',pms)+1).toInt();
      flashOn(true); delay(ms); flashOn(false);
      ack(String("{\"ok\":true,\"action\":\"flash\",\"detail\":\"pulse_")+ms+"ms\"}");
      return;
    }
    // buzzer
    if (s.indexOf("\"buzzer\"")>=0){
      if (s.indexOf("\"stop\"")>=0){ stopBuzz = true; relayWrite(PIN_REL2,false); ack("{\"ok\":true,\"action\":\"buzzer\",\"state\":\"stopping\"}"); return; }
      // start
      int pms = s.indexOf("\"ms\"");
      uint32_t ms = (pms>=0) ? (uint32_t)s.substring(s.indexOf(':',pms)+1).toInt() : S.buzzerMs;
      ack(String("{\"ok\":true,\"action\":\"buzzer\",\"state\":\"start\",\"ms\":")+ms+"}");
      buzzerPatternMs(ms);
      return;
    }
    // lock
    if (s.indexOf("\"lock\"")>=0){
      if (s.indexOf("\"open\"")>=0){ stopLock=true; relayWrite(PIN_REL1,false); ack("{\"ok\":true,\"action\":\"lock\",\"state\":\"open\"}"); return; }
      if (s.indexOf("\"closed\"")>=0){ relayWrite(PIN_REL1,true); ack("{\"ok\":true,\"action\":\"lock\",\"state\":\"closed\"}"); return; }
      if (s.indexOf("\"pulse\"")>=0){
        int pms = s.indexOf("\"ms\"");
        uint32_t ms = (pms>=0) ? (uint32_t)s.substring(s.indexOf(':',pms)+1).toInt() : S.lockMs;
        ack(String("{\"ok\":true,\"action\":\"lock\",\"state\":\"pulse\",\"ms\":")+ms+"}");
        lockPulseMs(ms);
        return;
      }
    }
    return;
  }

  // -------- SETTINGS --------
  if (top == T_SETSET){
    int p;
    p = s.indexOf("\"ultra\"");
    if (p>=0){
      int pmin = s.indexOf("\"min\"", p), pmax = s.indexOf("\"max\"", p);
      if (pmin>=0) S.minCm = s.substring(s.indexOf(':',pmin)+1).toFloat();
      if (pmax>=0) S.maxCm = s.substring(s.indexOf(':',pmax)+1).toFloat();
    }
    p = s.indexOf("\"lock\"");
    if (p>=0){
      int pms = s.indexOf("\"ms\"", p);
      if (pms>=0) S.lockMs = (uint32_t)s.substring(s.indexOf(':',pms)+1).toInt();
    }
    p = s.indexOf("\"buzzer\"");
    if (p>=0){
      int pms = s.indexOf("\"ms\"", p);
      if (pms>=0) S.buzzerMs = (uint32_t)s.substring(s.indexOf(':',pms)+1).toInt();
    }

    // validasi sederhana
    if (S.minCm<2 || S.maxCm>S.minCm+300 || S.maxCm>95 || S.minCm>=S.maxCm ||
        S.lockMs>300000UL || S.buzzerMs>300000UL){
      mqtt.publish(T_SETACK.c_str(), "{\"ok\":false,\"err\":\"bad_range\"}", false);
    } else {
      publishSettingsCur();
      mqtt.publish(T_SETACK.c_str(), "{\"ok\":true,\"reason\":\"applied\"}", false);
    }
    return;
  }
}

// ===================== MQTT =====================
void ensureMQTT(){
  if (mqtt.connected()) return;
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setCallback(onMqtt);
  while (!mqtt.connected()){
    mqtt.connect(DEV_ID, MQTT_USER, MQTT_PASSW, T_STATUS.c_str(), 0, true, "offline");
    if (!mqtt.connected()) delay(500);
  }
  mqtt.publish(T_STATUS.c_str(), "online", true);
  mqtt.subscribe(T_CTRL.c_str());
  mqtt.subscribe(T_SETSET.c_str());
}

// ===================== CAMERA =====================
bool initCameraSafe(){
  camera_config_t c{};
  c.ledc_channel=LEDC_CHANNEL_0; c.ledc_timer=LEDC_TIMER_0;
  c.pin_d0=Y2_GPIO_NUM; c.pin_d1=Y3_GPIO_NUM; c.pin_d2=Y4_GPIO_NUM; c.pin_d3=Y5_GPIO_NUM;
  c.pin_d4=Y6_GPIO_NUM; c.pin_d5=Y7_GPIO_NUM; c.pin_d6=Y8_GPIO_NUM; c.pin_d7=Y9_GPIO_NUM;
  c.pin_xclk=XCLK_GPIO_NUM; c.pin_pclk=PCLK_GPIO_NUM; c.pin_vsync=VSYNC_GPIO_NUM; c.pin_href=HREF_GPIO_NUM;
  c.pin_sccb_sda=SIOD_GPIO_NUM; c.pin_sccb_scl=SIOC_GPIO_NUM;
  c.pin_pwdn=PWDN_GPIO_NUM; c.pin_reset=RESET_GPIO_NUM;
  c.xclk_freq_hz=10000000;
  c.pixel_format=PIXFORMAT_JPEG;
  c.frame_size=FRAMESIZE_VGA;    // 640x480
  c.jpeg_quality=12;             // 12=lebih tajam; bisa naikkan ke 14..15 kalau butuh RAM lebih longgar
  c.fb_count=1;                  // DRAM only
  c.fb_location=CAMERA_FB_IN_DRAM;
  c.grab_mode=CAMERA_GRAB_WHEN_EMPTY;
  return esp_camera_init(&c)==ESP_OK;
}

// ===================== SETUP/LOOP =====================
void setup(){
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);
  Serial.begin(115200); delay(50);
  Serial.println("\n=== ESP32-CAM SmartParcel AIO ===");

  // IO init
  pinMode(PIN_TRIG, OUTPUT); digitalWrite(PIN_TRIG, LOW);
  pinMode(PIN_ECHO, INPUT); // via divider!
  pinMode(PIN_REL1, OUTPUT); pinMode(PIN_REL2, OUTPUT);
  relayWrite(PIN_REL1, false); relayWrite(PIN_REL2, false);
  pinMode(PIN_FLASH, OUTPUT); digitalWrite(PIN_FLASH, LOW);

  if (!initCameraSafe()){
    Serial.println("[ERR] Camera init failed"); delay(2000); ESP.restart();
  }

  ensureWiFi();
  mqtt.setClient(tcp);
  ensureMQTT();
  publishSettingsCur();
  Serial.println("[BOOT] Ready.");
}

void loop(){
  if (WiFi.status()!=WL_CONNECTED) ensureWiFi();
  if (!mqtt.connected()) ensureMQTT();
  mqtt.loop();

  // Publish jarak & trigger pipeline
  if (millis()-tLastPub > 1000){
    tLastPub = millis();
    float cm = ultraCmStable();
    lastCm = cm;

    if (!isnan(cm)){
      char js[48]; snprintf(js, sizeof(js), "{\"cm\":%.2f}", cm);
      mqtt.publish(T_DIST.c_str(), js, false);
      Serial.printf("[ULTRA] %.2f cm\n", cm);

      bool inWindow = (cm>=S.minCm && cm<=S.maxCm);
      if (inWindow && !busy && (millis()-lastPipeline>PIPELINE_COOLDOWN_MS)){
        char ev[80]; snprintf(ev, sizeof(ev), "{\"type\":\"detect\",\"cm\":%.1f}", cm);
        mqtt.publish(T_EVENT.c_str(), ev, false);
        runPipeline(cm);
      }
    } else {
      Serial.println("[ULTRA] NaN");
    }
  }

  delay(5);
}
