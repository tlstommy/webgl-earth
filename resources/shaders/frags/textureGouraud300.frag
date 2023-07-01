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
uniform samplerCube uTexture;

//main func that just outputs the color
void main()
{
  
  //texture vec
  vec4 textureVec;

  //set the texture vector
  textureVec = texture(uTexture, vertexPositions);


  //remove fragments with an opacity less than 0.1. 

  //.a for alpha which is the opacity
  if(textureVec.a < 0.1){ 
    discard;
  }

	//set the input to the output
	textureOut = color * textureVec;
}