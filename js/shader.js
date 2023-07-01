class ShaderProgram {
  vertexSource = null;
  fragmentSource = null;
  vertexShader = null;
  fragmentShader = null;
  program = null;
  
  /**
   * Class Constructor
   * @param {String} vertSource The Source code for the vertex shader
   * @param {String} fragSource The Source code for the fragment shader
   */
  constructor(vertSource, fragSource) {
    // We have passed in two functions: vertex and fragment.
    // First we compile these functions.
    this.vertexSource = vertSource;
    this.fragmentSource = fragSource;
    this.vertexShader = this.generateShaderFunction(gl.VERTEX_SHADER, vertSource);
    this.fragmentShader = this.generateShaderFunction(gl.FRAGMENT_SHADER, fragSource);
    
    // Get the GL context to reserve a spot for a shader program
    // The shaderID is the ID of the created program
    this.program = gl.createProgram();

    // Attach the compiled functions to the program
    gl.attachShader(this.program, this.vertexShader);
    gl.attachShader(this.program, this.fragmentShader);
    // This step is required to form an Executable Program,
    // this ensures the inputs/outputs line up between the two functions,
    // think of it as linking libraries for a UNIX executable
    gl.linkProgram(this.program);
    
    // If there was an error linking, print it.
    // More than likely the functions did not have correct ins/outs
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(this.program);
      throw `Could not link shader program: ${info}`;
    }
  }

  /**
   * 
   * @param {GLenum} type The Type of Shader (one of: gl.VERTEX_SHADER, gl.FRAGMENT_SHADER)
   * @param {String} source The source code
   * @returns {WebGLShader} The compiled shader 
   */
  generateShaderFunction(type, source) {
    const shader = gl.createShader(type);

    // Send the source to the shader object
    gl.shaderSource(shader, source);

    // Compile the shader program
    gl.compileShader(shader);

    // See if it compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      let whichShader = (type == gl.VERTEX_SHADER ? 'vertext' : 'frag');
      alert(`An error occurred compiling the ${whichShader} shader: ${gl.getShaderInfoLog(shader)}`);
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  /**
   * getAttributeLocations gets a dictionary of the specified attribute locations in a program
   * @param {Array.<String>} attributeNames A list of attribute names to get from a shader program
   */
  getAttributeLocations(attributeNames) {
    let attributeLocations = {}
    attributeNames.forEach(attributeName => {
      // getAttribLocation takes a program and string that corresponds with an attribute
      // In the simple.vert file, an example attribute is 'attribute vec3 aVertexPosition;'
      // It is identified by the string 'aVertexPosition'
      attributeLocations[attributeName] = gl.getAttribLocation(this.program, attributeName);
    });
    return attributeLocations;
  }

  /**
   * getUniformLocations returns the uniform locations for a specified list of uniforms
   * @param {Array.<String>} uniformNames A list of uniform names to find locations of inside of a shader 
   */
  getUniformLocations(uniformNames) {
    let uniformLocations = {}
    // getUniformLocation works pretty much the same as the get attrib location.
    uniformNames.forEach(uniformName => {
      uniformLocations[uniformName] = gl.getUniformLocation(this.program, uniformName);
    });
    return uniformLocations;
  }
}
