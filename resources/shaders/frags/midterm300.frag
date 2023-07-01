#version 300 es // i modified the shader code to convert it to an OpenGL ES 3.0 Shader

//set medium precision
precision mediump float;


// input vectors from the vert file
in vec3 vTexCoord;
in vec3 vNormal;
in vec3 vTangent;
in vec3 vBitangent;

//uniforms
uniform samplerCube uTexture;
uniform samplerCube uNormalsTexture;
uniform vec3 uCameraPosition;//light dir is the cam 
uniform vec4 uSpecular;
uniform float uShininess;

//output textures with normals
out vec4 textureOut;


void main() {

  //init vec's
  vec3 diffuseColor, albedo, camera, normalMap, normal, diffuse;

  //set the diffuse color from the texture of the diffuse image
  diffuseColor = texture(uTexture, normalize(vTexCoord)).rgb;
  
  //reflectivity of light
  albedo = texture(uTexture, vTexCoord).rgb;
  
  //camera is the jus tthe camera
  camera = (uCameraPosition);


  //map of normals from the source code
  normalMap = texture(uNormalsTexture, normalize(vTexCoord)).rgb * 2.0 - 1.0;
  
  //make the TBN matrix here instead of in the vert shader
  mat3 TBN = mat3(vTangent, vBitangent, vNormal);
 
  //create the normal vec by mult the tbn and the bumpmap
  normal = normalize(TBN * normalMap);
  
  //set cam to negative so its at the right spot
  diffuse = max(dot(-camera,normal), 0.5) * vec3(0.5);

  //set the texture out by multiplying all together
  textureOut = vec4(diffuse * albedo * diffuseColor, 1.0);
}
