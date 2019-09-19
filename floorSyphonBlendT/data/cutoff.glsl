#ifdef GL_ES
precision mediump float;
precision mediump int;
#endif

#define PROCESSING_TEXTURE_SHADER

varying vec4 vertTexCoord;
uniform sampler2D texture;

float saturate(float x) {
  return min(1, max(0, x));
}
void main() {  
  vec2 p = vertTexCoord.st;
  vec4 col = texture2D(texture, p);
  col.rgb *= sqrt(saturate(1.0 - (p.x - 0.5) * 2.0));
  gl_FragColor = col;
}
