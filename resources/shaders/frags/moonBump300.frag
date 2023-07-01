#version 300 es // i modified the shader code to convert it to an OpenGL ES 3.0 Shader

//set medium precision
precision mediump float;


// input vectors from the vert file
in vec3 vTexCoord;
in vec3 vNormal;
in vec3 vTangent;
in vec3 vBitangent;
in vec3 fragmentNormals;

//uniforms
uniform samplerCube uTexture;
uniform samplerCube uMoonNormalsTexture;
uniform vec3 uCameraPosition;//light dir is the cam 
uniform vec3 uMoonPosition;
uniform vec4 uSpecular;
uniform float uShininess;
//cam y val
uniform float uYVal;
//output textures with normals
out vec4 textureOut;


void main() {

  //init vec's
  vec3 diffuseColor, albedo, lightDir,camera, camRoot, normalMap, normal, diffuse, halfwayVec, lightSource;
  float brightnessVal;
  vec4 specularColor;


  //set cam root pos
  camRoot = vec3(2.0,2.0,-4.0);

  lightDir = normalize(vec3(uCameraPosition.x,uCameraPosition.y,uCameraPosition.z));

  //set the diffuse color from the texture of the diffuse image
  diffuseColor = texture(uTexture, normalize(vTexCoord)).rgb;
  
  //reflectivity of light
  albedo = texture(uTexture, vTexCoord).rgb;
  
  //map of normals from the source code
  normalMap = texture(uMoonNormalsTexture, normalize(vTexCoord)).rgb * 2.0 - 1.0;
  
  //make the TBN matrix here instead of in the vert shader
  mat3 TBN = mat3(vTangent, vTexCoord, normalize(vNormal));
 
  //create the normal vec by mult the tbn and the bumpmap
  normal = normalize(TBN * normalMap);
  
  //set cam to negative so its at the right spot
  diffuse = max(dot(-lightDir,normal), 0.0) * vec3(1.0);
  //diffuse = max(dot(normalize(lightDir - uCameraPosition),normal), 0.0) * vec3(0.75);

  //setup the halfway vector
  lightSource = normalize(camRoot);
  camera = lightSource;

  halfwayVec = normalize(camera + lightSource);



  vec3 ambient = vec3(0.5, 0.5, 0.5);

  specularColor = vec4(1.0) * (uSpecular * pow(clamp(dot(halfwayVec, normalize(fragmentNormals.xyz)), 0.0, 1.0), uShininess));


  //set the texture out by multiplying all together
  textureOut = vec4((ambient + albedo) * (diffuse * diffuseColor), 1.0) + specularColor;
}