#version 300 es

// med precision
precision mediump float;

// input attributes
in vec3 aVertexPosition;
in vec3 aVertexNormal;

// output attributes
out vec4 fragmentPositions;
out vec3 fragmentNormals;

// uniforms
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix;

void main() {

    // set the position of each fragment and multiply by the vertex
    fragmentPositions = (uModelViewMatrix * vec4(aVertexPosition, 1.0));
    
    // set the true normals from the normal matrix for the frags
    fragmentNormals = uNormalMatrix * aVertexNormal;

    //add the proj matrix to get the final
    gl_Position = uProjectionMatrix * fragmentPositions;
}