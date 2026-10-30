// {Project}: one-line purpose.
// Board: {board} ({FQBN in sketch.yaml}). Wiring: see the project README.
// The loop never blocks: every task runs when its interval has passed, so inputs stay responsive.

#if __has_include("credentials.h")
#include "credentials.h"  // local, gitignored; copy credentials.h.example to create it
#endif
#include "config.h"  // non-secret settings and safe defaults for anything credentials.h did not define

struct Task {
  unsigned long intervalMs;
  unsigned long lastRunMs;
  void (*run)();
};

void blinkStatus();
void readSensors();

Task tasks[] = {
  {STATUS_BLINK_MS, 0, blinkStatus},
  {SENSOR_INTERVAL_MS, 0, readSensors},
};

bool ledOn = false;

void setup() {
  Serial.begin(SERIAL_BAUD);
  pinMode(STATUS_LED_PIN, OUTPUT);
}

void loop() {
  const unsigned long now = millis();
  for (Task &task : tasks) {
    // Unsigned subtraction stays correct when millis() wraps around after ~49 days
    if (now - task.lastRunMs >= task.intervalMs) {
      task.lastRunMs = now;
      task.run();
    }
  }
}

void blinkStatus() {
  ledOn = !ledOn;
  digitalWrite(STATUS_LED_PIN, ledOn ? HIGH : LOW);
}

void readSensors() {
  const int raw = analogRead(SENSOR_PIN);
  Serial.print(F("sensor="));  // F() keeps constant strings in flash on small boards
  Serial.println(raw);
}
