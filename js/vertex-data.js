class VertexArrayData {
  bufferID = null;
  data = null;
  type = null;
  components = null;

  /**
   * Buffer Constructor
   * @param {Array.<Number>} data Data to load into a buffer on GPU 
   * @param {Number} type Type of buffer (must be one of: gl.INT, gl.FLOAT, gl.UNSIGNED_INT)
   * @param {Number} perVertexComponents Number of items each vertex needs
   */
  constructor(data, type, perVertexComponents) {
    this.bufferID = gl.createBuffer();
    this.data = data;
    this.components = perVertexComponents;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferID);
    switch (type) {
      case gl.INT:
        gl.bufferData(gl.ARRAY_BUFFER, new Int32Array(this.data), gl.STATIC_DRAW);
        this.type = gl.INT;
        break;
      case gl.FLOAT:
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.data), gl.STATIC_DRAW);
        this.type = gl.FLOAT;
        break;
      case gl.UNSIGNED_INT:
        gl.bufferData(gl.ARRAY_BUFFER, new Uint32Array(this.data), gl.STATIC_DRAW);
        this.type = gl.UNSIGNED_INT;
        break;
      default:
        throw `Unknown Buffer Type: ${type}`;
    }
    // Always a good idea to unbind, avoid later headaches!
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  /**
   * bindAndEnable binds the buffer data to the specified attribute location for access by a shader program'
   * @param {Number} vertexAttributeLocation The Attribute Location the Buffer is being bound to.
   */
  bindAndEnable(vertexAttributeLocation) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferID);
    const numComponents = this.components;
    const type = this.type;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.vertexAttribPointer(
      vertexAttributeLocation,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    gl.enableVertexAttribArray(vertexAttributeLocation);
  }
}

class ElementArrayData {
  bufferID = null;
  data = null;
  count = null;
  type = null;

  constructor(data) {
    this.bufferID = gl.createBuffer();
    this.data = data;
    this.count = data.length;
    this.type = gl.UNSIGNED_SHORT;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufferID);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }

  bindAndEnable() {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufferID);
  }
}
