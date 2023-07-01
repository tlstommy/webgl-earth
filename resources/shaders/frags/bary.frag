#version 100 // These is an OpenGL ES 1.0 Shader!

// We need to tell the shader executable at what precision we want floats to be
// medium precision is a good balance of speed and accuracy.
precision mediump float;

// In order to read a varying var from a vertex shader, we need to redeclare it in
// the fragment shader
varying vec3 outColor;
varying vec3 outBary;

// Clamp a float value between 0 and 1
float saturateF(float f) {
  return clamp(f, 0.0, 1.0);
}

// Given an edge size, is a fragment near a triangle edge?
float isOnTriangleEdge(vec3 b, float e){
  vec3 howClose = smoothstep(vec3(0.0), vec3(e), b);
  return saturateF(1.0 - min(min(howClose.x, howClose.y), howClose.z));
}

void main() {
  float ef = isOnTriangleEdge(outBary, 0.05);
  vec3 newColor = outColor;
  // If on edge, make the green component show - else make the green component zero
  newColor.g *= ef;
  gl_FragColor = vec4(newColor, 1.0);
}