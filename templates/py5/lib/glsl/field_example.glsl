// GPU field example: domain-warped noise between two colors
// Copy to sketch/{work_name}/{name}.glsl and draw it with draw_fullscreen(shader, seed=..., colorA=..., colorB=...)
#ifdef GL_ES
precision highp float;
#endif

uniform vec2 resolution;
uniform float time;
uniform float seed;
uniform vec3 colorA;
uniform vec3 colorB;

#include "noise.glsl"

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.y; // square units, independent of aspect
  vec3 p = vec3(uv * 2.0, time * 0.05) + seed;
  vec3 warp = vec3(fbm(p, 4), fbm(p + 5.2, 4), 0.0);
  float v = fbm(p + warp * 1.5, 5) * 0.5 + 0.5;
  gl_FragColor = vec4(mix(colorA, colorB, smoothstep(0.2, 0.8, v)), 1.0);
}
