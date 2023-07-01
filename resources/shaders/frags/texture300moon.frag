#version 300 es // These is an OpenGL ES 3.0 Shader!

//modified version of the simple300.frag to support textures

// In's and Out's of a Fragment Shader
// an 'in' inside of a fragment shader is a varying var
// an 'out' inside of a fragment shader is _the_ output you wish to draw (typically a vec4 color)

// We need to tell the shader executable at what precision we want floats to be
// medium precision is a good balance of speed and accuracy.
precision mediump float;

// This is a varying var written to by our vertex shader
// since this is 3.0 we specify it in the fragment shader with "in"
in vec3 outPos;

// We also have to specify the "output" of the fragment shader
// Typically we only output RGBA color, and that is what I will do here!
out vec4 textureOut;

uniform samplerCube uMoonTexture;

void main() {
  textureOut = texture(uMoonTexture,outPos);
}