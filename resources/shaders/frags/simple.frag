#version 100 // These is an OpenGL ES 1.0 Shader!

// We need to tell the shader executable at what precision we want floats to be
// medium precision is a good balance of speed and accuracy.
precision mediump float;

// In order to read a varying var from a vertex shader, we need to redeclare it in
// the fragment shader
varying vec3 outColor;

void main() {
  // In this GLSL version, gl_FragColor is a reserved var
  // it is a vec4 that is the output of your program
  gl_FragColor = vec4(outColor, 1.0);
}