#version 300 es



//modified version of my phong shader for textures



//phong is basically a modified gouraud shader but works on fragments instead of verticies



//med precision
precision mediump float;

//input vars
in vec3 fragmentPositions;
in vec3 fragmentNormals;

//output vars
out vec4 textureOutColor;

//input things from uniform vars. just the colors and material and then the postion of the camera for the light soucre
uniform vec3 uCameraPosition;
uniform vec4 uAmbient;
uniform vec4 uDiffuse;
uniform vec4 uSpecular;
uniform float uShininess;
uniform samplerCube uTexture;

void main() {

    //vertexNorms, colors and vertex pos
    //defs here: http://web.eecs.utk.edu/~huangj/cs452/notes/452_illumshade.pdf
    vec3 fragNorms, lightSource, camera, halfwayVec;

    vec4 vertPos, ambientColor, diffuseColor, specularColor,textColor;

    //set the ambient color
    ambientColor = uAmbient;


    //normalize the fragss
    fragNorms = normalize(fragmentNormals.xyz);

    //light source is the cameras position, if i dont normalize it it looks awful and is way too bright
    lightSource = normalize(uCameraPosition);
    camera = lightSource;

    
   
    //setup the halfway vector 
    halfwayVec = normalize(camera + lightSource);
    
    
    //specular should be white based off step4 writeup
    specularColor = vec4(1.0) * (uSpecular * pow(clamp(dot(halfwayVec, fragNorms), 0.0, 1.0), uShininess));


    


    //set the texture vector
    textColor = texture(uTexture, fragmentNormals);

    //remove fragments with an opacity less than 0.1. this removes the brown color

    //.a for alpha which is the opacity
    if(textColor.a < 0.1){ 
        discard;
    }

    //set the diffusing color. treat the textures as providing the color for the diffuse material component
    diffuseColor = textColor;

    //set the final color to be the combined of the three propeties and multp by the texture color
    textureOutColor = (ambientColor + diffuseColor + specularColor);

}