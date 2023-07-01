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
uniform samplerCube uEarthNormalsTexture;
uniform samplerCube uEarthSpecTexture;
uniform vec3 uCameraPosition;//light dir is the cam 
uniform vec4 uSpecular;
uniform vec4 uDiffuse;
uniform float uShininess;

//output textures with normals
out vec4 textureOut;


void main() {

  //init vec's
  vec3 diffuseColor, albedo, camera, normalMap, normal, diffuse,nightLights,halfwayVec,lightSource;
  float brightnessVal;
  vec3 camRoot;
  vec4 specularColor;


  //set cam root pos
  camRoot = vec3(2.0,2.0,-4.0);


  vec3 lightDir = normalize(uCameraPosition - vec3(0.0,0.0,0.0));

  //set the diffuse color from the texture of the diffuse image
  diffuseColor = texture(uTexture, normalize(vTexCoord)).rgb;
  
  //reflectivity of light
  albedo = texture(uTexture, vTexCoord).rgb * vec3(2.0);
  
  //map of normals from the source code
  normalMap = texture(uEarthNormalsTexture, normalize(vTexCoord)).rgb * 2.0 - 1.0;
  
  //make the TBN matrix here instead of in the vert shader
  mat3 TBN = mat3(vTangent, vTexCoord, normalize(vNormal));
 
  //create the normal vec by mult the tbn and the bumpmap
  normal = normalize(TBN * normalMap);
  
  //set cam to negative so its at the right spot

  diffuse = max(dot(-lightDir,normal), 0.0) * vec3(0.5);

  //setup the halfway vector
  lightSource = normalize(camRoot);
  camera = lightSource;

  halfwayVec = normalize(camera + lightSource);



  vec3 ambient = vec3(0.0, 0.0, 0.0);
  specularColor = vec4(1.0) * (uSpecular * pow(clamp(dot(halfwayVec, normalize(fragmentNormals.xyz)), 0.0, 1.0), uShininess));

  //set the texture out by multiplying all together
  textureOut = vec4((ambient + albedo) * (diffuse * diffuseColor),1.0) + specularColor;


  //get brightness val by geting the dot product of the light and normals
  brightnessVal = dot(normalize(-lightDir), normalize(normal));
  if(brightnessVal < 0.2){
    nightLights = texture(uEarthSpecTexture, vTexCoord).rgb;
    textureOut.rgb += nightLights;
  }

}