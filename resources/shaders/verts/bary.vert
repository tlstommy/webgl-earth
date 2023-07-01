#version 100 // These is an OpenGL ES 1.0 Shader!
// An Attribute is a value pulled from a bound buffer on the GPU
// You set these up in the client code (our JS application)
attribute vec3 aVertexPosition;
attribute vec3 aBarycentricCoord;

// A variable declared as varying can _only_ be wrote by the vertex shader
// and read, with values interpolated, by the fragment shader.
varying vec3 outColor;
varying vec3 outBary;

// Uniforms do not change from one shader invocation to the next,
// these are set "constant" values that can be read by vertex and fragment shader
// if you want to use a uniform in the fragment shader then you must declare it at the top as well.
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

void main() {
  // in this version of GLSL, gl_position is a reserved variable
  // it is a vec4 that represents the position of a vertex in clip space
  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
  outColor = vec3(1.0, 1.0, 1.0);
  outBary = aBarycentricCoord;
}