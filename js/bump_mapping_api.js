//api stuff relativly simple bc of how i built my load function

//loads and enables textures to be used for bump mapping,m using my external cubemaploader
function APIloadNormalMap(diffuseTextureSrc,normalMapTextureSrc,faceData,textureID){
    let normal = null;
    let diffuse = null;
    normal = normalMapTextureSrc;
    diffuse= diffuseTextureSrc;
    //load the textures with load texture
    var diffuseTexture = loadTexture(diffuse, faceData, null,textureID);
    var normalTexture = loadTexture(normal, faceData, null,textureID);
    
    return [diffuseTexture,normalTexture];
}

//turns on mapping and returns the approiate texture id.
function APIenableMapping(gl,turnOnBool,textures){
    
    //activate and bind the default texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, textures[0]);

    if(turnOnBool){
        //activate and bind the mapping
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, textures[1]);
        return 1;
    }else{
        return 0;
    }
}