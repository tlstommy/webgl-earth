#version 300 es

//phong is basically a modified gouraud shader but works on fragments instead of verticies


precision mediump float;

//input vars
in vec4 fragmentPositions;
in vec3 fragmentNormals;

//output var
out vec4 fragColor;

//input things from uniform vars. just the colors and material and then the postion of the camera for the light soucre
uniform vec3 uCameraPosition;
uniform vec4 uSpacecraftAmbient;
uniform vec4 uSpacecraftDiffuse;
uniform vec4 uSpacecraftSpecular;
uniform float uSpacecraftShininess;

void main()
{   
    //vertexNorms, colors and vertex pos
    //defs here: http://web.eecs.utk.edu/~huangj/cs452/notes/452_illumshade.pdf
    vec3 vertexNorms,lightSource,camera,halfwayVec;
    vec4 ambientColor,diffuseColor,specularColor;
    

    //set the ambient color
    ambientColor = uSpacecraftAmbient;

    //normalize the vertexs
	vertexNorms = normalize(fragmentNormals);
	

    //light source is the cameras position, if i dont normalize it it looks awful and is way too bright
    lightSource = normalize(uCameraPosition);
    camera = lightSource;

    //set diffuse color
    diffuseColor = uSpacecraftDiffuse * clamp(dot(vertexNorms, lightSource), 0.0, 1.0); // Diffuse light
	
    //setup the halfway vector for specular later
    halfwayVec = normalize(camera + lightSource);
	specularColor = uSpacecraftSpecular * pow(clamp(dot(halfwayVec, vertexNorms), 0.0, 1.0), uSpacecraftShininess);
	
    //set the combined color before we add in the step 4 stuff
	vec4 color = vec4(ambientColor.rgb + diffuseColor.rgb + specularColor.rgb,1.0);


    //fragmentPositions.y is the height of the model

    float yCoord = fragmentPositions.y;
    




    //set color back to return
    fragColor = color;

    
}
