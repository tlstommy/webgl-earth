

// Ideally, we like to avoid global vars, a GL context lives as long as the window does
// So this is a case where it is understandable to have it in global space.
var gl = null;
// The rest is here simply because it made debugging easier...
var myShader = null;
var textureSrcs = [];
var moonPosCurrent = [0.0,0.0,0.0];
//array of drawables
var myDrawable = [];
var loadedTextures = [];
var drawableIDs = ["earth","moon","skybox","clouds","spacecraft"];
var myDrawableInitialized = null;
var modelViewMatrix = null;
var normalViewMatrix = null;
var projectionMatrix = null;
var globalTime = 0.0;
var parsedData = null;

//location of view camera and the light source
var cameraPosition = [0.0,0.0,0.0];
var modelMatrix = null;


//num of sphertes to draw

var sphereModelCountMAX = 6;

var fogAmountSliderVal = null;
var showCloudsBool = true;





//find . -type f -exec chmod 644 {} \; && find . -type d -exec chmod 711 {} \;   
function main() {
  const canvas = document.getElementById('glCanvas');
  // Initialize the GL context
  gl = canvas.getContext('webgl2');

  // Only continue if WebGL is available and working
  if (gl === null) {
    alert('Unable to initialize WebGL2. Contact the TA.');
    return;
  }

  // Set clear color to whatever color this is and fully opaque
  gl.clearColor(0.7, 0.7, 0.9, 1.0);
  // Clear the depth buffer
  gl.clearDepth(1.0);
  // Enable the depth function to draw nearer things over farther things
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.DEPTH_TEST);

  //create  the normal view
  normalViewMatrix = glMatrix.mat3.create();

  // Draw the scene repeatedly
  let then = 0.0;
  function render(now) {
    now *= 0.001;  // convert to seconds
    const deltaTime = now - then;
    then = now;

    drawScene(deltaTime);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

  // The Projection matrix rarely needs updated.
  // Uncommonly, it is only modified in wacky sequences ("drunk" camera effect in GTAV)
  // or an artificial "zoom" using FOV (ARMA3)
  // Typically it is only updated when the viewport changes aspect ratio.
  // So, set it up here once since we won't let the viewport/canvas resize.
  const FOV = degreesToRadians(60);
  const aspectRatio = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar  = 300.0;
  projectionMatrix = glMatrix.mat4.create();
  glMatrix.mat4.perspective(projectionMatrix,
                   FOV,
                   aspectRatio,
                   zNear,
                   zFar);


  // Setup Controls
  setupUI();

  // Right now, in draw, the scene will not render until the drawable is prepared
  // this allows us to acynchronously load content. If you are not familiar with async
  // that is a-okay! This link below should explain more on that topic:
  // https://blog.bitsrc.io/understanding-asynchronous-javascript-the-event-loop-74cd408419ff
  setupScene();
}

function setupUI() {
  // in index.html we need to setup some callback functions for the sliders
  // right now just have them report the values beside the slider.
  let sliders = ['cam', 'look','fog'];
  let dims = ['X', 'Y', 'Z',];
  // for cam and look UI..
  sliders.forEach(controlType => {
    // for x, y, z control slider...
    dims.forEach(dimension => {
      let slideID = `${controlType}${dimension}`;
      console.log(`Setting up control for ${slideID}`);
      let slider = document.getElementById(slideID);
      let sliderVal = document.getElementById(`${slideID}Val`);
      // These are called "callback functions", essentially when the input
      // value for the slider or the field beside the slider change,
      // run the code we supply here!
      slider.oninput = () => {
        let newVal = slider.value;
        sliderVal.value = newVal;
      };
      sliderVal.oninput = () => {
        let newVal = sliderVal.value;
        slider.value = newVal;
      };
    });
  });


  let showCloudsCheck = document.getElementById(`showCloudsCheck`);
  showCloudsCheck.checked = true;
  showCloudsCheck.oninput = () => {
    showCloudsBool = showCloudsCheck.checked;
    console.log(Number(showCloudsBool))
  };
}

// Async as it loads resources over the network.
async function setupScene() {
  //earth is objdata
  let objData = await loadNetworkResourceAsText('resources/models/sphere_with_vt.obj');

  let cubeObjData = await loadNetworkResourceAsText('resources/models/cube_with_vt.obj');
  let cloudObjData = await loadNetworkResourceAsText('resources/models/sphere_with_vt.obj');
  let skyboxObjData = await loadNetworkResourceAsText('resources/models/sphere_with_vt.obj');
  let spacecraftObjData = await loadNetworkResourceAsText('resources/models/ufo.obj');
  let moonObjData = await loadNetworkResourceAsText('resources/models/sphere_with_vt.obj');

  let vertSource = await loadNetworkResourceAsText('resources/shaders/verts/textureGouraud300.vert');
  let fragSource = await loadNetworkResourceAsText('resources/shaders/frags/textureGouraud300.frag');

  let earthVertSource = await loadNetworkResourceAsText('resources/shaders/verts/earthBump300.vert');
  let earthFragSource = await loadNetworkResourceAsText('resources/shaders/frags/earthBump300.frag');

  let moonVertSource = await loadNetworkResourceAsText('resources/shaders/verts/moonBump300.vert');
  let moonFragSource = await loadNetworkResourceAsText('resources/shaders/frags/moonBump300.frag');

  let cloudFragSource = await loadNetworkResourceAsText('resources/shaders/frags/cloudsTexture300.frag');
  
  let skyboxFragSource = await loadNetworkResourceAsText('resources/shaders/frags/skyboxTexture300.frag');

  let spacecraftVertSource = await loadNetworkResourceAsText('resources/shaders/verts/spacecraftPhong300.vert');
  let spacecraftFragSource = await loadNetworkResourceAsText('resources/shaders/frags/spacecraftPhong300.frag');

  let reflectorVertSource = await loadNetworkResourceAsText('resources/shaders/verts/textureEnviromap300.vert');
  let reflectorFragSource = await loadNetworkResourceAsText('resources/shaders/frags/textureEnviromap300.frag');

  //srcs for each face of the cube. Image must be the same size for each.
  //if you want to just use the same image for all faces just set it to face 1 and then set all others to ""
  //https://jaxry.github.io/panorama-to-cubemap/
  textureSrcs = {
    earth:{
      face1: "resources/textures/space/earth/px.png",// +x
      face2: "resources/textures/space/earth/nx.png",// -x
      face3: "resources/textures/space/earth/py.png",// +y
      face4: "resources/textures/space/earth/ny.png",// -y
      face5: "resources/textures/space/earth/pz.png",// +z
      face6: "resources/textures/space/earth/nz.png",// -z
    },

    earthBumpMap:{
      face1: "resources/bumpmaps/space/earth/px.png",// +x
      face2: "resources/bumpmaps/space/earth/nx.png",// -x
      face3: "resources/bumpmaps/space/earth/py.png",// +y
      face4: "resources/bumpmaps/space/earth/ny.png",// -y
      face5: "resources/bumpmaps/space/earth/pz.png",// +z
      face6: "resources/bumpmaps/space/earth/nz.png",// -z
    },
    earthSpecularMap:{
      face1: "resources/specularmaps/earthSpecular/px.png",// +x
      face2: "resources/specularmaps/earthSpecular/nx.png",// -x
      face3: "resources/specularmaps/earthSpecular/py.png",// +y
      face4: "resources/specularmaps/earthSpecular/ny.png",// -y
      face5: "resources/specularmaps/earthSpecular/pz.png",// +z
      face6: "resources/specularmaps/earthSpecular/nz.png",// -z
    },
    clouds:{
      face1: "resources/textures/space/clouds/px.png",// +x
      face2: "resources/textures/space/clouds/nx.png",// -x
      face3: "resources/textures/space/clouds/py.png",// +y
      face4: "resources/textures/space/clouds/ny.png",// -y
      face5: "resources/textures/space/clouds/pz.png",// +z
      face6: "resources/textures/space/clouds/nz.png",// -z
    },
    moon:{
      face1: "resources/textures/space/moon/px.png",// +x
      face2: "resources/textures/space/moon/nx.png",// -x
      face3: "resources/textures/space/moon/py.png",// +y
      face4: "resources/textures/space/moon/ny.png",// -y
      face5: "resources/textures/space/moon/pz.png",// +z
      face6: "resources/textures/space/moon/nz.png",// -z
    },
    moonBumpMap:{
      face1: "resources/bumpmaps/space/moon/px.png",// +x
      face2: "resources/bumpmaps/space/moon/nx.png",// -x
      face3: "resources/bumpmaps/space/moon/py.png",// +y
      face4: "resources/bumpmaps/space/moon/ny.png",// -y
      face5: "resources/bumpmaps/space/moon/pz.png",// +z
      face6: "resources/bumpmaps/space/moon/nz.png",// -z
    },
    skybox:{
      face1: "resources/enviromaps/skybox/px.png",// +x
      face2: "resources/enviromaps/skybox/nx.png",// -x
      face3: "resources/enviromaps/skybox/py.png",// +y
      face4: "resources/enviromaps/skybox/ny.png",// -y
      face5: "resources/enviromaps/skybox/pz.png",// +z
      face6: "resources/enviromaps/skybox/nz.png",// -z
    }
  }






  //earth  
  initializeMyObject(earthVertSource, earthFragSource, objData,0);



  //moon
  initializeMyObject(moonVertSource, moonFragSource, moonObjData,1);

  //skybox
  initializeMyObject(vertSource, skyboxFragSource, skyboxObjData,2);

  //earth clouds
  initializeMyObject(vertSource, cloudFragSource, cloudObjData,3);

  //spacecraft
  initializeMyObject(spacecraftVertSource, spacecraftFragSource, spacecraftObjData,4);

  //reflector
  initializeMyObject(reflectorVertSource, reflectorFragSource, cubeObjData,5);



}


function drawScene(deltaTime) {
  globalTime += deltaTime;

  // Clear the color buffer with specified clear color
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  

  let viewMatrix = glMatrix.mat4.create();
  var camX = parseFloat(document.getElementById("camXVal").value)/1;
  var camY = parseFloat(document.getElementById("camYVal").value)/1;
  var camZ = parseFloat(document.getElementById("camZVal").value)/1;
  //console.log("Cam X: ",camX)
  //console.log("Cam Y: ",camY)
  //console.log("Cam Z: ",camZ)
  var focusX = parseFloat(document.getElementById("lookXVal").value);
  var focusY = parseFloat(document.getElementById("lookYVal").value);
  var focusZ = parseFloat(document.getElementById("lookZVal").value);
  //console.log("Focus X: ",focusX)
  //console.log("Focus Y: ",focusY)
  //console.log("Focus Z: ",focusZ)

  fogAmountSliderVal = parseFloat(document.getElementById("fogXVal").value);


  //xyz
  let cameraPos = [camX,camY,camZ];
  cameraPosition = glMatrix.vec3.fromValues(camX,camY,camZ);
  let cameraFocus = [0.0 + focusX, 0.0 + focusY, 0.0 + focusZ];
  glMatrix.mat4.lookAt(viewMatrix,
                       cameraPos,
                       cameraFocus,
                       [0.0, 1.0, 0.0]
                      );



  

  /* Do the model matrix stuff */
  //-----------------------------------------------------------------------------
  
  for(let i = 0; i < sphereModelCountMAX; i++){
    
    if(myDrawable[i]){
      modelViewMatrix = glMatrix.mat4.create();
      modelMatrix = glMatrix.mat4.create();

      let objectWorldPos = [0.0, 0.0, 0.0];
      let rotationAxis = [0.0, 1.0, 0.0];
      let scalingVector = [2.0, 2.0, 2.0];
      

      //src body shouldnt orbit, orbital stuff
      if(i == 1){
        glMatrix.mat4.rotate(modelMatrix,modelMatrix,globalTime/8,rotationAxis);
      }

      if(i == 4){
        glMatrix.mat4.rotate(modelMatrix,modelMatrix,-(globalTime/3),[1.0, 1.0, -1.0]);
        //glMatrix.mat4.rotate(modelMatrix,modelMatrix,globalTime/10,rotationAxis);
      }
      
      //reflector
      if(i == 5){
        glMatrix.mat4.rotate(modelMatrix,modelMatrix,-(globalTime/3),rotationAxis);
      }


      
      //change props for each individual planet or body
      adjustPlanet(i,modelMatrix);


      
      






      glMatrix.mat4.identity(modelViewMatrix);
      glMatrix.mat3.identity(normalViewMatrix);
      glMatrix.mat4.translate(modelMatrix, modelMatrix, cameraFocus);
      //glMatrix.mat3.translate(normalViewMatrix, cameraPosition,viewMatrix);
      
     

      //move to 0 0 0 , left over from solar system thing
      glMatrix.mat4.translate(modelMatrix, modelMatrix, objectWorldPos);
      
      
      //myDrawable[i].scalingVector = scalingVector;

      //comment to turn off scaling
      glMatrix.mat4.scale(modelMatrix,modelMatrix,(myDrawable[i].scalingVector));
      
      //invert the model and trans pose it
      glMatrix.mat4.invert(modelViewMatrix, modelMatrix);
			glMatrix.mat4.transpose(modelViewMatrix, modelViewMatrix);

      //conver5
      glMatrix.mat3.fromMat4(normalViewMatrix, modelViewMatrix);

      
     
      //multiply the matrix
      glMatrix.mat4.mul(modelViewMatrix, viewMatrix, modelMatrix);


      myDrawable[i].draw();

    }
  }
}

//set each planets orbit based on id by retruing pos array
//scaling losely based off this: https://solarsystem.nasa.gov/resources/686/solar-system-sizes/
function adjustPlanet(planetID,modelMatrix){

  
  let earthScaleFactor = [1.90, 1.90, 1.90];
  let cloudScaleFactor = [1.92, 1.92, 1.92];
  let skyboxScaleFactor = [200, 200, 200];
  // skybox? let earthCloudScaleFactor = [21.0, 21.0, 21.0];
  let moonScaleFactor  = [0.5, 0.5, 0.5];
  let spacecraftScaleFactor = [0.5,0.5,0.5];
  let reflectScaleFactor = [0.5,0.5,0.5];
  
  let i = planetID;
  
  switch(planetID) {
    
    //do translate before scale!!!
    
    //earth
    case 0:
      glMatrix.mat4.translate(modelMatrix, modelMatrix, [0.0, 0.0, 0.0]);
      glMatrix.mat4.scale(modelMatrix, modelMatrix, earthScaleFactor);
      glMatrix.mat4.rotate(modelMatrix,modelMatrix,(globalTime/10),[0.0, 1.0, 0.0]);
      
      break;
    
    
    //moon
    case 1:
      glMatrix.mat4.translate(modelMatrix, modelMatrix, [2.1, 0.0, 2.1]);
      glMatrix.mat4.scale(modelMatrix, modelMatrix, moonScaleFactor);
      glMatrix.mat4.rotate(modelMatrix,modelMatrix,(0),[0.0, 1.0, 0.0]);
      moonPosCurrent[0] = modelMatrix[12];
      moonPosCurrent[1] = modelMatrix[13];
      moonPosCurrent[2] = modelMatrix[14];
      //console.log(moonPosCurrent);
      break;
    
    //skybox
    case 2:
      glMatrix.mat4.translate(modelMatrix, modelMatrix, [0.0, 0.0, 0.0]);
      glMatrix.mat4.scale(modelMatrix, modelMatrix, skyboxScaleFactor);
      glMatrix.mat4.rotate(modelMatrix,modelMatrix,(0),[0.0, 1.0, 0.0]);
      break;
    
    //earth clouds
    case 3:
      glMatrix.mat4.translate(modelMatrix, modelMatrix, [0.0, 0.0, 0.0]);
      glMatrix.mat4.scale(modelMatrix, modelMatrix, cloudScaleFactor);
      glMatrix.mat4.rotate(modelMatrix,modelMatrix,(globalTime/9),[0.0, 1.0, 0.0]);
      
      break;

    //spacecraft
    case 4:
      glMatrix.mat4.translate(modelMatrix, modelMatrix, [0.0, 2.2, 0.0]);
      glMatrix.mat4.scale(modelMatrix, modelMatrix, spacecraftScaleFactor);
      glMatrix.mat4.rotate(modelMatrix,modelMatrix,(globalTime),[0.0, 1.0, 0.0]);
      
      break;
    
    //reflector
    case 5:
      glMatrix.mat4.translate(modelMatrix, modelMatrix, [2.0, 1.0, 2.0]);
      glMatrix.mat4.scale(modelMatrix, modelMatrix, reflectScaleFactor);
      glMatrix.mat4.rotate(modelMatrix,modelMatrix,(globalTime/3),[1.0, 1.0, 1.0]);
      
      break;
    
  }
}

function initializeMyObject(vertSource, fragSource, objData, i) {

  myShader = new ShaderProgram(vertSource, fragSource); // this class is in shader.js
  parsedData = new OBJData(objData); // this class is in obj-loader.js
  let rawData = parsedData.getFlattenedDataFromModelAtIndex(0);// this class is in obj-loader.js



  // Generate Buffers on the GPU using the geometry data we pull from the obj
  let vertexPositionBuffer = new VertexArrayData( // this class is in vertex-data.js
    rawData.vertices, // What is the data?
    gl.FLOAT,         // What type should WebGL treat it as?
    3                 // How many per vertex?
  );
  
  let vertexNormalBuffer = new VertexArrayData(
    rawData.normals,
    gl.FLOAT,
    3
  );
  
  let vertexTexCoordBuffer = new VertexArrayData (
    rawData.uvs,
    gl.FLOAT,
    2
  );
  
  let vertexBarycentricBuffer = new VertexArrayData (
    rawData.barycentricCoords,
    gl.FLOAT,
    3
  );




  //normal mapping tangents and bitangents
  let vertexBiTangentBuffer = vertexPositionBuffer;
  let vertexTangentBuffer = vertexPositionBuffer;





  //console.log(rawData.normals);
  /*
  For any model that is smooth (non discrete) indices should be used, but we are learning! Maybe you can get this working later?
  One indicator if a model is discrete: a vertex position has two normals.
  A cube is discrete if only 8 vertices are used, but each vertex has 3 normals (each vertex is on the corner of three faces!)
  The sphere and bunny obj models are smooth though */
  // getFlattenedDataFromModelAtIndex does not return indices, but getIndexableDataFromModelAtIndex would
  //let vertexIndexBuffer = new ElementArrayData(rawData.indices);

  // In order to let our shader be aware of the vertex data, we need to bind
  // these buffers to the attribute location inside of the vertex shader.
  // The attributes in the shader must have the name specified in the following object
  // or the draw call will fail, possibly silently!
  // Checkout the vertex shaders in resources/shaders/verts/* to see how the shader uses attributes.
  // Checkout the Drawable constructor and draw function to see how it tells the GPU to bind these buffers for drawing.
  let bufferMap = {
    'aVertexPosition': vertexPositionBuffer,
    'aBarycentricCoord': vertexBarycentricBuffer,

    //for vertex normals
    'aVertexNormal': vertexNormalBuffer,
    'aVertexTexCoord': vertexTexCoordBuffer,

    //bitangent and tangent buffers
    'aVertexBiTangentBuffer':vertexBiTangentBuffer,
    'aVertexTangentBuffer':vertexTangentBuffer,
  };
  
  myDrawable[i] = new Drawable(myShader, bufferMap, null, rawData.vertices.length / 3);

  


  // texture stuff
  //console.log(rawData.faces)
  //console.log(i);

  myDrawable[i].id = drawableIDs[i];
  //console.log(myDrawable[i].id);

  //create textureVars
  var earthTextures = APIloadNormalMap(textureSrcs.earth,textureSrcs.earthBumpMap, rawData.faces,0);
  var moonTextures = APIloadNormalMap(textureSrcs.moon,textureSrcs.moonBumpMap, rawData.faces,1);
  var cloudTextures = APIloadNormalMap(textureSrcs.clouds,"", rawData.faces,2);
  var skyboxTextures = APIloadNormalMap(textureSrcs.skybox,"", rawData.faces,3);
  //add on specular texture for earth
  earthTextures.push(loadTexture(textureSrcs.earthSpecularMap, rawData.faces, null,4));

  //console.log(earthTextures)
  //console.log(textureSrcs.clouds)
  

  //console.log(moonTextures);
  //console.log("------------------");
  

  
  //activate and bind each texture and normal texture


  //earth normal bump maps are achived by overlaying the two together. the bumpmap texture may look like a regular image however it is not, it is merged to include normals
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, earthTextures[0]);

  //moon
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, moonTextures[0]);


  //space/skybox
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyboxTextures[0]);

  gl.clear(gl.COLOR_BUFFER_BIT);


  //clouds

  gl.activeTexture(gl.TEXTURE3);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cloudTextures[0]);

  gl.activeTexture(gl.TEXTURE4);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cloudTextures[0]);
  gl.activeTexture(gl.TEXTURE5);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

  //earth normal
  gl.activeTexture(gl.TEXTURE6);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, earthTextures[1]);
  //moon normal
  gl.activeTexture(gl.TEXTURE7);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, moonTextures[1]);
  gl.activeTexture(gl.TEXTURE8);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, moonTextures[1]);
  //earth spec
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.activeTexture(gl.TEXTURE9);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, earthTextures[2]);
  gl.activeTexture(gl.TEXTURE10);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, earthTextures[2]);
  
 

  // Checkout the drawable class' draw function. It calls a uniform setup function every time it is drawn. 
  // Put your uniforms that change per frame in this setup function.

  //light source must be at cam location so have that as a uniform along with normals and shader details from the tab;e
  myDrawable[i].uniformLocations = myShader.getUniformLocations(['uModelViewMatrix','uYVal','uShowCloudsBool', 'uProjectionMatrix','uNormalMatrix','uCameraPosition','uAmbient','uDiffuse','uSpecular','uShininess','uSpacecraftAmbient','uSpacecraftDiffuse','uSpacecraftSpecular','uSpacecraftShininess','uTexture','uSkyboxTexture','uEarthNormalsTexture','uEarthSpecTexture','uMoonNormalsTexture','uModelMatrix','uMoonPosition','uFogColor','uFogAmount','uEnviromapTexture']);
 

  //material data vals, these are from that table
  let materialAmbi = [0.5, 0.5, 0.5, 1.0];
  let materialDiff = [0.3, 0.3, 0.3, 1.0];
  let materialSpec = [0.5, 0.5, 0.5, 1.0];
  let materialShin = [75.0];


  let spacecraftMaterialAmbi = [0.25, 0.25, 0.25, 1.0];
  let spacecraftMaterialDiff = [0.4, 0.4, 0.4, 1.0];
  let spacecraftMaterialSpec = [0.774597, 0.774597, 0.774597, 1.0];
  let spacecraftMaterialShin = [76.8];

  
  //fog data
  let fogColor =  [1.0, 1.0, 1.0, 1.0];

  //for step 4
  myDrawable[i].uniformSetup = () => {
    gl.uniformMatrix4fv(
      myDrawable[i].uniformLocations.uProjectionMatrix,
      false,
      projectionMatrix
    );
    gl.uniformMatrix4fv(
      myDrawable[i].uniformLocations.uModelViewMatrix,
      false,
      modelViewMatrix
    );

    //model matrix
    gl.uniformMatrix4fv(
      myDrawable[i].uniformLocations.uModelMatrix,
      false,
      modelMatrix
    );

    //uniform vars for vertex norms
    gl.uniformMatrix3fv(
      myDrawable[i].uniformLocations.uNormalMatrix,
      false,
      normalViewMatrix
    );

    
    


    //uniform position var for the camera since the light source is from the camera
    //console.log("Cam Pos: "+cameraPosition);

    gl.uniform3fv(
      myDrawable[i].uniformLocations.uCameraPosition,
      cameraPosition
    );
    
    
    //moon coords
    gl.uniform3fv(
      myDrawable[i].uniformLocations.uMoonPosition,
      moonPosCurrent
    );
    

    //values  from lab2 table, set to the approprait uniforms
    gl.uniform4fv(
      myDrawable[i].uniformLocations.uAmbient,
      materialAmbi
    );
    gl.uniform4fv(
      myDrawable[i].uniformLocations.uDiffuse,
      materialDiff
    );
    gl.uniform4fv(
      myDrawable[i].uniformLocations.uSpecular,
      materialSpec
    );
    gl.uniform1f(
      myDrawable[i].uniformLocations.uShininess,
      materialShin
    );

    //spaceCraft
    gl.uniform4fv(
      myDrawable[i].uniformLocations.uSpacecraftAmbient,
      spacecraftMaterialAmbi
    );
    gl.uniform4fv(
      myDrawable[i].uniformLocations.uSpacecraftDiffuse,
      spacecraftMaterialDiff
    );
    gl.uniform4fv(
      myDrawable[i].uniformLocations.uSpacecraftSpecular,
      spacecraftMaterialSpec
    );
    gl.uniform1f(
      myDrawable[i].uniformLocations.uSpacecraftShininess,
      spacecraftMaterialShin
    );
    

    //camYVals for moon
    gl.uniform1f(
      myDrawable[1].uniformLocations.uYVal,
      cameraPosition[1]
    );


    //texture
    gl.uniform1i(
      myDrawable[i].uniformLocations.uTexture,
      i
    );

    //skybox and enviromap
    gl.uniform1i(
      myDrawable[i].uniformLocations.uSkyboxTexture,
      2
    );

 

    //earth normal and moon normal
    gl.uniform1i(
      myDrawable[i].uniformLocations.uEarthNormalsTexture,
      6
    );
    gl.uniform1i(
      myDrawable[i].uniformLocations.uMoonNormalsTexture,
      7
    );

    //earth specular texutre
    gl.uniform1i(
      myDrawable[i].uniformLocations.uEarthSpecTexture,
      9
    );

    //cloud fog stuff------

    //fog color
    gl.uniform4fv(
      myDrawable[i].uniformLocations.uFogColor,
      fogColor
    );


    //fog amount float
    gl.uniform1f(
      myDrawable[i].uniformLocations.uFogAmount,
      ((parseFloat(document.getElementById("fogXVal").value)/2)/100)/1.9
    );
      
    //show clouds
    gl.uniform1i(
      myDrawable[i].uniformLocations.uShowCloudsBool,
      Number(showCloudsBool)
    );
    
  };

  //------step3 stuff-------
  //basically followed the psuedocode

  //create max and mix xyz vector
  var maxXYZ = glMatrix.vec3.fromValues(rawData.bbox["maxX"],rawData.bbox["maxY"],rawData.bbox["maxZ"]);
  var minXYZ = glMatrix.vec3.fromValues(rawData.bbox["minX"],rawData.bbox["minY"],rawData.bbox["minZ"]);
  
  //create span and unitspan vectors
  var span = glMatrix.vec3.create();
  var unitSpan = glMatrix.vec3.create();
  
  //use vector ops for this cus they are vectors

  //subtract the max and min
  span = glMatrix.vec3.sub(span,maxXYZ,minXYZ);

  //normalize it and get scale
  unitSpan = glMatrix.vec3.normalize(unitSpan,span)
  var xScale = (unitSpan[0]/span[0]); 
  var yScale = (unitSpan[1]/span[1]); 
  var zScale = (unitSpan[2]/span[2]);


  //console.log(xScale);
  //console.log(yScale);
  //console.log(zScale);
  
  //create the scaling vector
  myDrawable[i].scalingVector = glMatrix.vec3.fromValues(xScale,yScale,zScale);
  
  //divide the span and unit span so they are relative for each mdoel
  glMatrix.vec3.div(myDrawable[i].scalingVector,unitSpan,span);
  myDrawableInitialized = true;
}

// After all the DOM has loaded, we can run the main function.
window.onload = main;