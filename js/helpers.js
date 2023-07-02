/**
 * degreesToRadians as the name implies
 * @param {Number} degrees The degrees to convert to radians
 */
function degreesToRadians(degrees) {
	return degrees * Math.PI / 180;
}

/**
 * loadNetworkResourceAsText loads server local resource as text data (one large string with newlines)
 * @param {String} resource A path to local resource
 */
async function loadNetworkResourceAsText(resource) {
	const response = await fetch(resource);
	const asText = await response.text();
	return asText;
}

//checks if image is valid, if not fix it
async function checkAndModify(image, resizeVal) {

	//console.log(typeof image.width,image.height);

	if (image.height != image.width) {
		//console.warn("Image is not a square!, please be paitent, the larger the image the longer this will take.");

		//resize image to resizeVal, often the largest possible. ref:https://webglfundamentals.org/webgl/lessons/webgl-cube-maps.html

		//create a new canvas
		var canvas = document.createElement('canvas');
		canvas.width = resizeVal;
		canvas.height = resizeVal;

		//get context draw resized image with a border of 100px
		var ctx = canvas.getContext('2d');

		ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

		//save the resized image to the new modified one
		var modifiedImage = new Image();
		modifiedImage.src = canvas.toDataURL();
		await new Promise((resolve) => {
			modifiedImage.onload = resolve;
		});
	}
	else {
		modifiedImage = image;
	}




	return modifiedImage;
}

function loadTexture(srcs, f, textureID) {


	//console.log(srcs);


	var faces = f.length;

	//console.log("FACES: "+faces);

	var textures = [];

	//create a texture
	var texture = gl.createTexture();
	var imageFaces = [];

	//list of each face of the cubemap, learned from here: https://webglfundamentals.org/webgl/lessons/webgl-cube-maps.html

	const cubeMapFaces = [
		gl.TEXTURE_CUBE_MAP_POSITIVE_X,
		gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
		gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
		gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
		gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
		gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
	];

	//front back left right top bottom
	const textureFaces = [
		srcs.face1,
		srcs.face2,
		srcs.face3,
		srcs.face4,
		srcs.face5,
		srcs.face6
	];


	gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);


	//used these for ref: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL, https://webgl2fundamentals.org/webgl/lessons/webgl-3d-textures.html

	//color to use b4 its loaded
	var preLoadPixel = new Uint8Array([0, 0, 255, 255]);

	for (let i = 0; i < faces; i++) {
		if (cubeMapFaces[i] == undefined) {
			continue
		}
		gl.texImage2D(cubeMapFaces[i], 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, preLoadPixel);
	}



	//load texture image for each face of cube
	for (let i = 0; i < 6; i++) {
		imageFaces[i] = new Image();

		//try to fix async bug
		imageFaces[i].onload = (function (index) {
			return function () {
				gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
				gl.texImage2D(cubeMapFaces[index], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageFaces[index]);
			};
		})(i);




		imageFaces[i].src = textureFaces[i];
	}




	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);




	return (texture);
}
