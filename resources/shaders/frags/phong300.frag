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
uniform vec4 uAmbient;
uniform vec4 uDiffuse;
uniform vec4 uSpecular;
uniform float uShininess;

void main()
{   
    //vertexNorms, colors and vertex pos
    //defs here: http://web.eecs.utk.edu/~huangj/cs452/notes/452_illumshade.pdf
    vec3 vertexNorms,lightSource,camera,halfwayVec;
    vec4 ambientColor,diffuseColor,specularColor;
    

    //set the ambient color
    ambientColor = uAmbient;

    //normalize the vertexs
	vertexNorms = normalize(fragmentNormals);
	

    //light source is the cameras position, if i dont normalize it it looks awful and is way too bright
    lightSource = normalize(uCameraPosition);
    camera = lightSource;

    //set diffuse color
    diffuseColor = uDiffuse * clamp(dot(vertexNorms, lightSource), 0.0, 1.0); // Diffuse light
	
    //setup the halfway vector for specular later
    halfwayVec = normalize(camera + lightSource);
	specularColor = uSpecular * pow(clamp(dot(halfwayVec, vertexNorms), 0.0, 1.0), uShininess);
	
    //set the combined color before we add in the step 4 stuff
	vec4 color = vec4(ambientColor.rgb + diffuseColor.rgb + specularColor.rgb,1.0);


    //fragmentPositions.y is the height of the model

    float yCoord = fragmentPositions.y;
    
    //should go from 0 to 100% based off the y height, and fudge it a bit with +0.3 so it looks better. it works without this but i like it
    float fudgeFactor = 0.5;
    color.r = (color.r * yCoord) + fudgeFactor;

    //set green and blue vals to 0 so the red effect looks better
    color.g = 0.0;
    color.b = 0.0;



    //set color back to return
    fragColor = color;

    
}
