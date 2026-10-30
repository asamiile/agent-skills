// Settings that are not secret: pins, intervals, thresholds. Committed.
#pragma once

#include <Arduino.h>

// Pins: from the project's wiring table. Check the board's pin numbering before reusing on another board
constexpr uint8_t STATUS_LED_PIN = LED_BUILTIN;
constexpr uint8_t SENSOR_PIN = A0;

constexpr unsigned long SERIAL_BAUD = 115200;  // match the monitor setting in sketch.yaml
constexpr unsigned long STATUS_BLINK_MS = 500;
constexpr unsigned long SENSOR_INTERVAL_MS = 2000;

// Defaults used only when credentials.h is missing or omits a value, so the sketch still compiles
// (network features stay disabled with empty values)
#ifndef WIFI_SSID
#define WIFI_SSID ""
#endif
#ifndef WIFI_PASSWORD
#define WIFI_PASSWORD ""
#endif
#ifndef MQTT_SERVER
#define MQTT_SERVER ""
#endif
#ifndef MQTT_PORT
#define MQTT_PORT 8883
#endif
