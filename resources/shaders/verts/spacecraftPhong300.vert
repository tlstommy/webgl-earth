#version 300 es
//phong is basically a modified gouraud shader but works on fragments instead of verticies

//med
precision mediump float;

//input vars
in vec3 aVertexPosition;
in vec3 aVertexNormal;

//output vars
out vec4 fragmentPositions;
out vec3 fragmentNormals;

//input things from uniform vars
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix;

void main()
{
    //set the position of each fragment and mult by the vertex
    fragmentPositions = (uModelViewMatrix * vec4(aVertexPosition, 1.0));
    
    //set the true norms form the normal matrix for the frags
    fragmentNormals = uNormalMatrix * aVertexNormal;

    //add the proj matrix to get the final
    gl_Position = uProjectionMatrix * fragmentPositions;
}
