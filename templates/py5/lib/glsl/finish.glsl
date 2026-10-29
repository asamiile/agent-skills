// Finishing grade: bloom, exposure, filmic tone map, chromatic aberration, saturation, vignette, grain
// Every effect is off at 0 (saturation: 1 = unchanged)
#ifdef GL_ES
precision highp float;
#endif
#define PROCESSING_TEXTURE_SHADER

uniform sampler2D texture;
uniform sampler2D bloomTex;
uniform vec2 resolution;
uniform float time;
uniform float bloom;
uniform float exposure;
uniform float tonemap;
uniform float aberration;
uniform float vignette;
uniform float grain;
uniform float saturation;
uniform float bloomFlipY; // 1 when the source is an image rather than an offscreen canvas
varying vec4 vertTexCoord;

// Narkowicz's fit of the ACES filmic curve
vec3 filmic(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

// Per-pixel noise without a visible lattice at 4K: two rounds of a large-multiplier hash,
// shifted every frame so the grain moves
float grainNoise(vec2 p) {
  p = fract(p * vec2(0.1031, 0.1137));
  p += dot(p, p.yx + 19.19);
  return fract((p.x + p.y) * p.x * 43.7585);
}

void main() {
  vec2 uv = vertTexCoord.st;
  vec2 fromCenter = uv - 0.5;

  vec2 shift = fromCenter * aberration;
  vec3 c = vec3(texture2D(texture, uv + shift).r, texture2D(texture, uv).g, texture2D(texture, uv - shift).b);

  vec2 bloomUv = vec2(uv.x, mix(uv.y, 1.0 - uv.y, bloomFlipY));
  c += texture2D(bloomTex, bloomUv).rgb * bloom;
  c *= exposure;
  c = mix(clamp(c, 0.0, 1.0), filmic(c), tonemap);

  float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(luma), c, saturation);

  float aspect = resolution.x / resolution.y;
  float r = length(fromCenter * vec2(aspect, 1.0)) / length(vec2(aspect, 1.0) * 0.5);
  c *= 1.0 - vignette * smoothstep(0.35, 1.0, r);

  c += (grainNoise(gl_FragCoord.xy + floor(time * 60.0) * vec2(71.0, 37.0)) - 0.5) * grain;
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}
