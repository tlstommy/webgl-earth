#version 300 es

//modified gouraud shader for textures


precision mediump float;

//input vects
in vec4 color;
in vec3 vertexNormals;
in vec3 vertexPositions;

//output textures
out vec4 textureOut;


uniform vec3 uCameraPosition;//light dir is the cam 


//for cubemaps
uniform samplerCube uTexture;

//for cloud fog
uniform vec4 uFogColor;
uniform float uFogAmount;
uniform int uShowCloudsBool;

//main func that just outputs the color
void main()
{
  
  //texture vec
  vec4 textureVec;


  if(uShowCloudsBool == 0){
    discard;
  }

  //set the texture vector
  textureVec = texture(uTexture, vertexPositions);



  float dist = distance(vertexPositions, uCameraPosition);
  textureVec = mix(textureVec,uFogColor,uFogAmount);


  //for all vec object delte them if the rbg vall is darker than 15% of 255
  if (all(lessThanEqual(textureVec.rgb, vec3(0.25)))) {
    discard;
  }
  


  //remove fragments with an opacity less than 0.1. 

  //.a for alpha which is the opacity
  if(textureVec.a < 1.0){ 
    discard;
  }



	//set the input to the output
	textureOut = uFogColor * textureVec;
}