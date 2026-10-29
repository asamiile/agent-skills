// One direction of a separable Gaussian blur, using linear filtering to read two texels per tap
// `direction` is (spread, 0) or (0, spread); texOffset is set by py5 to one texel
#ifdef GL_ES
precision highp float;
#endif
#define PROCESSING_TEXTURE_SHADER

uniform sampler2D texture;
uniform vec2 texOffset;
uniform vec2 direction;
varying vec4 vertTexCoord;

void main() {
  vec2 uv = vertTexCoord.st;
  vec2 dir = direction * texOffset;
  // weights and offsets of a 9-tap Gaussian folded into 5 linear samples
  vec3 c = texture2D(texture, uv).rgb * 0.227027;
  c += (texture2D(texture, uv + dir * 1.384615).rgb + texture2D(texture, uv - dir * 1.384615).rgb) * 0.316216;
  c += (texture2D(texture, uv + dir * 3.230769).rgb + texture2D(texture, uv - dir * 3.230769).rgb) * 0.070270;
  gl_FragColor = vec4(c, 1.0);
}
