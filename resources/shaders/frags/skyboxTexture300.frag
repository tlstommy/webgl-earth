#version 300 es

//modified gouraud shader for textures


precision mediump float;

//input vects
in vec4 color;
in vec3 vertexNormals;
in vec3 vertexPositions;

//output textures
out vec4 textureOut;

//for cubemaps
uniform samplerCube uSkyboxTexture;
uniform vec3 uCameraPosition;//light dir is the cam 

//main func that just outputs the color
void main()
{
  
  //texture vec
  vec4 textureVec;

  vec3 reflection = reflect(normalize(vertexPositions), vec3(0.0, 1.0, 0.0));

  
  //set the texture vector
  textureVec = texture(uSkyboxTexture,reflection);
  
  
	//set the input to the output
	textureOut = textureVec * color;
}