#version 300 es

//this is just a very simple fragment shader

precision mediump float;

//input color
in vec4 color;

//outpot color for fragments
out vec4 fragColor;

//main func that just outputs the color
void main()
{
	//set the input to the output
	fragColor = color;
}