#version 300 es // i modified the shader code to convert it to an OpenGL ES 3.0 Shader and cut out the unneeded stuff

//set medium precision
precision mediump float;

// input attributes
in vec3 aVertexPosition;
in vec3 aVertexNormal;

//tangent buffers
in vec3 aVertexTangentBuffer;
in vec3 aVertexBiTangentBuffer;

//output vars
out vec3 vTexCoord;
out vec3 vNormal;
out vec3 vTangent;
out vec3 vBitangent;
out vec3 fragmentNormals;


//uniforms
uniform mat4 uModelMatrix;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix;

void main() {

  //set the texcoord output to the positons of the vertex
  vTexCoord = aVertexPosition;

  //tbn matrix from the bumpmap source vert file
  vNormal = normalize(uModelViewMatrix * vec4(aVertexNormal, 0.0)).xyz;
  vTangent = normalize(uModelViewMatrix * vec4(aVertexTangentBuffer, 0.0)).xyz;
  vBitangent = normalize(uModelViewMatrix * vec4(aVertexBiTangentBuffer, 0.0)).xyz;
  fragmentNormals = uNormalMatrix * aVertexNormal;

  // multiply the projection, view and vertex postions together 
  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
}
