#version 300 es


//modified gouraud shader for textures

//gourad seems more "blocky?" compared to phong
//http://web.eecs.utk.edu/~huangj/cs452/notes/452_illumshade.pdf

//this is the precison or quality i guess
precision mediump float;

//input vars
in vec3 aVertexPosition;
in vec3 aVertexNormal;

//output vars
out vec4 color;
out vec3 vertexNormals;
out vec3 vertexPositions;

//input things from uniform vars
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix;
uniform vec3 uCameraPosition;
//material stuff
uniform vec4 uAmbient;
uniform vec4 uDiffuse;
uniform vec4 uSpecular;
uniform float uShininess;

void main()
{
	
	//vertexNorms = vertex normals
  //defs here: http://web.eecs.utk.edu/~huangj/cs452/notes/452_illumshade.pdf
  vec3 vertexNorms, lightSource, camera, halfwayVec, vertNorm;
  
  //colors and vertex pos
  vec4 vertPos, ambientColor, diffuseColor, specularColor;

  vertPos = uModelViewMatrix * vec4(aVertexPosition, 1.0);
  vertNorm = uNormalMatrix * aVertexNormal;

  //set the ambient color
  ambientColor = uAmbient;

  //normalize the vertexs
  vertexNorms = normalize(vertNorm.xyz);

  //light source is the cameras position, if i dont normalize it it looks awful and is way too bright
  lightSource = normalize(uCameraPosition);
  camera = lightSource;
  //set the diffusing color
  diffuseColor = uDiffuse * clamp(dot(vertexNorms, lightSource), 0.0, 1.0);


  //setup the halfway vector for specular later
  halfwayVec = normalize(camera + lightSource);

  specularColor = uSpecular * pow(clamp(dot(halfwayVec, vertexNorms), 0.0, 1.0), uShininess);

  //set the final color to be the combined of the three propeties
  color = vec4(ambientColor.rgb + diffuseColor.rgb + specularColor.rgb,1.0);

  //set the final position
  gl_Position = uProjectionMatrix * vertPos;

  //send the vertex and normals out to the frag shader
  vertexNormals = vertexNormals;
  vertexPositions = aVertexPosition;
}