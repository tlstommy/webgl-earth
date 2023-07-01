class Drawable {
  shader = null;
  vertexBuffers = {};
  attributeLocations = null;
  uniformLocations = null;
  elementArrayBuffer = null;
  verticesCount = null;
  id = null;

  //add this in for step 3
  scalingVector = null;
  
  /**
   * uniform setup - this is a function that should be defined per drawable
   * If you are familiar with C++ and not JavaScript, treat this as a member variable
   * that is a function. 
   */
  uniformSetup = () => {
    if(!this.uniformSetupWarned) {
      console.warn('A drawable being drawn does not have a uniformSetup function.');
      this.uniformSetupWarned = true;
    }
  };

  /**
   * Class Constructor
   * @param {ShaderProgram} shader The shader program to draw this drawable with
   * @param {Object.<string, VertexArrayData>} bufferMap Map of buffer location _strings_ to respective buffer
   * @param {ElementArrayData} [elementBuffer=null] OPTIONAL: The buffer containing the indexing information, only specify if USING an IndexBuffer
   * @param {Number} [verticesCount=null] OPTIONAL: The count of the vertices in the position buffer, only specify if NOT USING an IndexBuffer
   */
  constructor(shader, bufferMap, elementBuffer = null, verticesCount = null) {
    this.shader = shader;

    if (!elementBuffer && !verticesCount) {
      throw 'You must specify an element Index Buffer or vertices count!';
    }

    const attributeNames = Object.keys(bufferMap);
    const attributeLocations = shader.getAttributeLocations(attributeNames);

    for (const attributeName in bufferMap) {
      const location = attributeLocations[attributeName];
      this.vertexBuffers[location] = bufferMap[attributeName];
    }

    if (elementBuffer) {
      this.elementArrayBuffer = elementBuffer;
    } else {
      this.verticesCount = verticesCount;
    }
    this.scalingVector = glMatrix.vec3.create();
  }

  /**
   * draw - attempts to draw the defined drawable, using the index buffer or specified amount of vertices
   */
  draw(){
    // If the drawable is using an index buffer, use that.
    if (this.elementArrayBuffer && !this.verticesCount) {
      this.elementArrayBuffer.bindAndEnable();
    }

    // Make sure the attribute buffers are bound,
    // If the same drawable is drawn consecutively then these do not need rebound
    // but that is an optimization. Do not optimize while learning as it leads to mixed results :)
    for (const bufferLocation in this.vertexBuffers) {
      this.vertexBuffers[bufferLocation].bindAndEnable(bufferLocation);
    }
    
    gl.useProgram(this.shader.program);
    this.uniformSetup();

    // If not using an index array, draw as many vertices as loaded in the buffer
    if (this.verticesCount){
      gl.drawArrays(gl.TRIANGLES, 0, this.verticesCount);
      return;
    }

    // Otherwise, we need to draw with elements!
    const offset = 0;
    gl.drawElements(gl.TRIANGLES,
                    this.elementArrayBuffer.count,
                    this.elementArrayBuffer.type,
                    offset
                  );
  }
}