var canvas;
var gl;
var time_paused = false;
var time;

var vbo_pos, attr_pos;
var vbo_tang, attr_tang;
var vbo_bitang, attr_bitang;
var vbo_uv, attr_uv;
var index_buffer;
var num_indices;
var tex_norm, tex_diffuse, tex_depth;
var pgm;

var vert_src = `
precision highp float;

attribute vec3 vert_pos;
attribute vec3 vert_tang;
attribute vec3 vert_bitang;
attribute vec2 vert_uv;

uniform mat4 model_mtx;
uniform mat4 norm_mtx;
uniform mat4 proj_mtx;

varying vec2 frag_uv;
varying vec3 ts_light_pos; // Tangent space values
varying vec3 ts_view_pos;  //
varying vec3 ts_frag_pos;  //

mat3 transpose(in mat3 inMatrix)
{
    vec3 i0 = inMatrix[0];
    vec3 i1 = inMatrix[1];
    vec3 i2 = inMatrix[2];

    mat3 outMatrix = mat3(
        vec3(i0.x, i1.x, i2.x),
        vec3(i0.y, i1.y, i2.y),
        vec3(i0.z, i1.z, i2.z)
    );

    return outMatrix;
}

void main(void)
{
    gl_Position = proj_mtx * vec4(vert_pos, 1.0);
    ts_frag_pos = vec3(model_mtx * vec4(vert_pos, 1.0));
    vec3 vert_norm = cross(vert_bitang, vert_tang);

    vec3 t = normalize(mat3(norm_mtx) * vert_tang);
    vec3 b = normalize(mat3(norm_mtx) * vert_bitang);
    vec3 n = normalize(mat3(norm_mtx) * vert_norm);
    mat3 tbn = transpose(mat3(t, b, n));

    vec3 light_pos = vec3(1, 2, 0);
    ts_light_pos = tbn * light_pos;
    // Our camera is always at the origin
    ts_view_pos = tbn * vec3(0, 0, 0);
    ts_frag_pos = tbn * ts_frag_pos;
 
    frag_uv = vert_uv;
}
`;

var frag_src = `
precision highp float;

uniform sampler2D tex_norm;
uniform sampler2D tex_diffuse;
uniform sampler2D tex_depth;
/*
    The type is controlled by the radio buttons below the canvas.
    0 = No bump mapping
    1 = Normal mapping
    2 = Parallax mapping
    3 = Steep parallax mapping
    4 = Parallax occlusion mapping
*/
uniform int type;
uniform int show_tex;
uniform float depth_scale;
uniform float num_layers;

varying vec2 frag_uv;
varying vec3 ts_light_pos;
varying vec3 ts_view_pos;
varying vec3 ts_frag_pos;

vec2 parallax_uv(vec2 uv, vec3 view_dir)
{
    if (type == 2) {
        // Parallax mapping
        float depth = texture2D(tex_depth, uv).r;    
        vec2 p = view_dir.xy * (depth * depth_scale) / view_dir.z;
        return uv - p;  
    } else {
        float layer_depth = 1.0 / num_layers;
        float cur_layer_depth = 0.0;
        vec2 delta_uv = view_dir.xy * depth_scale / (view_dir.z * num_layers);
        vec2 cur_uv = uv;

        float depth_from_tex = texture2D(tex_depth, cur_uv).r;

        for (int i = 0; i < 32; i++) {
            cur_layer_depth += layer_depth;
            cur_uv -= delta_uv;
            depth_from_tex = texture2D(tex_depth, cur_uv).r;
            if (depth_from_tex < cur_layer_depth) {
                break;
            }
        }

        if (type == 3) {
            // Steep parallax mapping
            return cur_uv;
        } else {
            // Parallax occlusion mapping
            vec2 prev_uv = cur_uv + delta_uv;
            float next = depth_from_tex - cur_layer_depth;
            float prev = texture2D(tex_depth, prev_uv).r - cur_layer_depth
                         + layer_depth;
            float weight = next / (next - prev);
            return mix(cur_uv, prev_uv, weight);
        }
    }
}

void main(void)
{
    vec3 light_dir = normalize(ts_light_pos - ts_frag_pos);
    vec3 view_dir = normalize(ts_view_pos - ts_frag_pos);

    // Only perturb the texture coordinates if a parallax technique is selected
    vec2 uv = (type < 2) ? frag_uv : parallax_uv(frag_uv, view_dir);

    vec3 albedo = texture2D(tex_diffuse, uv).rgb;
    if (show_tex == 0) { albedo = vec3(1,1,1); }
    vec3 ambient = 0.3 * albedo;

    if (type == 0) {
        // No bump mapping
        vec3 norm = vec3(0,0,1);
        float diffuse = max(dot(light_dir, norm), 0.0);
        gl_FragColor = vec4(diffuse * albedo + ambient, 1.0);

    } else {
        // Normal mapping
        vec3 norm = normalize(texture2D(tex_norm, uv).rgb * 2.0 - 1.0);
        float diffuse = max(dot(light_dir, norm), 0.0);
        gl_FragColor = vec4(diffuse * albedo + ambient, 1.0);
    }
}
`;

window.onload = function (e) {
    canvas = document.getElementById("gl_canvas");
    canvas.onclick = function (e) {
        time_paused = !time_paused;
    }

    // Init WebGL context
    {
        gl = null;
        try { gl = canvas.getContext("webgl"); }
        catch (e) { }
    }

    if (!gl) {
        alert("Unable to initialize WebGL. Your browser may not support it.");
        return;
    }

    // Init GL flags
    {
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.CULL_FACE);
    }

    // Init shaders
    {
        var frag = get_shader(gl, frag_src, true);
        var vert = get_shader(gl, vert_src, false);
        pgm = gl.createProgram();
        gl.attachShader(pgm, vert);
        gl.attachShader(pgm, frag);
        gl.linkProgram(pgm);

        if (!gl.getProgramParameter(pgm, gl.LINK_STATUS)) {
            alert("Unable to initialize the shader program: " +
                gl.getProgramInfoLog(shader));
        }

        gl.useProgram(pgm);
        attr_pos = gl.getAttribLocation(pgm, "vert_pos");
        gl.enableVertexAttribArray(attr_pos);
        attr_tang = gl.getAttribLocation(pgm, "vert_tang");
        gl.enableVertexAttribArray(attr_tang);
        attr_bitang = gl.getAttribLocation(pgm, "vert_bitang");
        gl.enableVertexAttribArray(attr_bitang);
        attr_uv = gl.getAttribLocation(pgm, "vert_uv");
        gl.enableVertexAttribArray(attr_uv);
    }

    // Init meshes
    {
        // Positions
        vbo_pos = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo_pos);
        var verts = [
            -1, -1, 1, 1, 1, 1, -1, 1, 1, 1, -1, 1, // Front
            -1, -1, -1, 1, 1, -1, -1, 1, -1, 1, -1, -1, // Back
            1, -1, -1, 1, 1, 1, 1, -1, 1, 1, 1, -1, // Right
            -1, -1, -1, -1, 1, 1, -1, -1, 1, -1, 1, -1, // Left
            -1, 1, -1, 1, 1, 1, -1, 1, 1, 1, 1, -1, // Top
            -1, -1, -1, 1, -1, 1, -1, -1, 1, 1, -1, -1, // Bottom
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

        // Tangents
        vbo_tang = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo_tang);
        var tangs = [
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, // Front
            -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, // Back
            0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, // Right
            0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, // Left
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, // Top
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, // Bottom
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tangs), gl.STATIC_DRAW);

        // Bitangents
        vbo_bitang = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo_bitang);
        var bitangs = [
            0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, // Front
            0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, // Back
            0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, // Right
            0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, // Left
            0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, // Top
            0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, // Bot
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bitangs), gl.STATIC_DRAW);

        // UVs
        vbo_uv = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo_uv);
        var uvs = [
            0, 1, 1, 0, 0, 0, 1, 1, // Front
            1, 1, 0, 0, 1, 0, 0, 1, // Back
            1, 1, 0, 0, 0, 1, 1, 0, // Right
            0, 1, 1, 0, 1, 1, 0, 0, // Left
            0, 0, 1, 1, 0, 1, 1, 0, // Top
            0, 1, 1, 0, 0, 0, 1, 1, // Bottom
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);

        index_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
        var indices = [
            0, 1, 2, 0, 3, 1, // Front
            4, 6, 5, 4, 5, 7, // Back
            8, 9, 10, 8, 11, 9, // Right
            12, 14, 13, 12, 13, 15, // Left
            16, 18, 17, 16, 17, 19, // Top
            20, 21, 22, 20, 23, 21, // Bottom
        ];
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices),
            gl.STATIC_DRAW);
        num_indices = indices.length;
    }

    // Init textures
    {
        tex_norm = load_texture("/images/bump_normal.png");
        tex_diffuse = load_texture("/images/bump_diffuse.png");
        tex_depth = load_texture("/images/bump_depth.png");
    }

    time = 0;
    setInterval(update_and_render, 15);
}

function update_and_render() {
    if (!time_paused) {
        time++;
    }

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var a = mtx_perspective(45, 680.0 / 382.0, 0.1, 100.0);
    var b = mtx_translation(0, 0, -4.5);
    var c = mtx_rotation_x(0.4);
    var d = mtx_rotation_y(time * 0.0075);

    var model = mtx_mul(mtx_mul(b, c), d);

    {
        var uni = gl.getUniformLocation(pgm, "model_mtx");
        gl.uniformMatrix4fv(uni, false, model);
    }

    {
        var uni = gl.getUniformLocation(pgm, "norm_mtx");
        gl.uniformMatrix4fv(uni, false, mtx_transpose(mtx_inverse(model)));
    }

    {
        var uni = gl.getUniformLocation(pgm, "proj_mtx");
        gl.uniformMatrix4fv(uni, false, mtx_mul(a, model));
    }

    {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex_norm);
        var uni = gl.getUniformLocation(pgm, "tex_norm");
        gl.uniform1i(uni, 0);
    }

    {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, tex_diffuse);
        var uni = gl.getUniformLocation(pgm, "tex_diffuse");
        gl.uniform1i(uni, 1);
    }

    {
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, tex_depth);
        var uni = gl.getUniformLocation(pgm, "tex_depth");
        gl.uniform1i(uni, 2);
    }

    {
        var type = 0;
        switch (document.querySelector('input[name="shading_type"]:checked').value) {
            case "normal": type = 1; break;
            case "parallax": type = 2; break;
            case "steep": type = 3; break;
            case "pom": type = 4; break;
        }

        var step = document.getElementById("scale_control");
        if (type < 2) {
            step.style.visibility = "hidden";
        } else {
            step.style.visibility = "visible";
        }

        var step = document.getElementById("step_control");
        if (type < 3) {
            step.style.visibility = "hidden";
        } else {
            step.style.visibility = "visible";
        }

        var uni = gl.getUniformLocation(pgm, "type");
        gl.uniform1i(uni, type);
    }

    {
        var scale = 0.01 * parseFloat(document.getElementById("scale").value);
        var uni = gl.getUniformLocation(pgm, "depth_scale");
        gl.uniform1f(uni, scale);
    }

    {
        var steps = parseFloat(document.getElementById("steps").value);
        var uni = gl.getUniformLocation(pgm, "num_layers");
        gl.uniform1f(uni, steps);
    }

    {
        var show_tex = document.getElementById('show_tex').checked;
        var uni = gl.getUniformLocation(pgm, "show_tex");
        gl.uniform1i(uni, show_tex);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo_pos);
    gl.vertexAttribPointer(attr_pos, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo_tang);
    gl.vertexAttribPointer(attr_tang, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo_bitang);
    gl.vertexAttribPointer(attr_bitang, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo_uv);
    gl.vertexAttribPointer(attr_uv, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
    gl.drawElements(gl.TRIANGLES, num_indices, gl.UNSIGNED_SHORT, 0);
}

function get_shader(gl, src, is_frag) {
    var shader = gl.createShader(is_frag ? gl.FRAGMENT_SHADER :
        gl.VERTEX_SHADER);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("An error occurred compiling the shaders: " +
            gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function load_texture(img_path) {
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array([255, 0, 0, 255])); // red

    var img = new Image();
    img.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    img.src = img_path;
    return tex;
}

/*
    Matrix utility functions

    Note that OpenGL expects column-major arrays, but JavaScript, is row-major.
    So each matrix in code is written as the transpose of its mathematical form.
*/
function mtx_zero() {
    return [
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ];
}

function mtx_identity() {
    return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ];
}

function mtx_mul(a, b) {
    var c = mtx_zero();

    for (var i = 0; i < 4; i++) {
        for (var j = 0; j < 4; j++) {
            for (var k = 0; k < 4; k++) {
                c[i + j * 4] += a[i + k * 4] * b[k + j * 4];
            }
        }
    }

    return c;
}

function mtx_transpose(a) {
    var b = mtx_zero();

    for (var i = 0; i < 4; i++) {
        for (var j = 0; j < 4; j++) {
            b[i + j * 4] = a[j + i * 4];
        }
    }

    return b;
}

function mtx_inverse(m) {
    var inv = mtx_zero();
    inv[0] = m[5] * m[10] * m[15] - m[5] * m[11] * m[14] - m[9] * m[6] * m[15] + m[9] * m[7] * m[14] + m[13] * m[6] * m[11] - m[13] * m[7] * m[10];
    inv[4] = -m[4] * m[10] * m[15] + m[4] * m[11] * m[14] + m[8] * m[6] * m[15] - m[8] * m[7] * m[14] - m[12] * m[6] * m[11] + m[12] * m[7] * m[10];
    inv[8] = m[4] * m[9] * m[15] - m[4] * m[11] * m[13] - m[8] * m[5] * m[15] + m[8] * m[7] * m[13] + m[12] * m[5] * m[11] - m[12] * m[7] * m[9];
    inv[12] = -m[4] * m[9] * m[14] + m[4] * m[10] * m[13] + m[8] * m[5] * m[14] - m[8] * m[6] * m[13] - m[12] * m[5] * m[10] + m[12] * m[6] * m[9];
    inv[1] = -m[1] * m[10] * m[15] + m[1] * m[11] * m[14] + m[9] * m[2] * m[15] - m[9] * m[3] * m[14] - m[13] * m[2] * m[11] + m[13] * m[3] * m[10];
    inv[5] = m[0] * m[10] * m[15] - m[0] * m[11] * m[14] - m[8] * m[2] * m[15] + m[8] * m[3] * m[14] + m[12] * m[2] * m[11] - m[12] * m[3] * m[10];
    inv[9] = -m[0] * m[9] * m[15] + m[0] * m[11] * m[13] + m[8] * m[1] * m[15] - m[8] * m[3] * m[13] - m[12] * m[1] * m[11] + m[12] * m[3] * m[9];
    inv[13] = m[0] * m[9] * m[14] - m[0] * m[10] * m[13] - m[8] * m[1] * m[14] + m[8] * m[2] * m[13] + m[12] * m[1] * m[10] - m[12] * m[2] * m[9];
    inv[2] = m[1] * m[6] * m[15] - m[1] * m[7] * m[14] - m[5] * m[2] * m[15] + m[5] * m[3] * m[14] + m[13] * m[2] * m[7] - m[13] * m[3] * m[6];
    inv[6] = -m[0] * m[6] * m[15] + m[0] * m[7] * m[14] + m[4] * m[2] * m[15] - m[4] * m[3] * m[14] - m[12] * m[2] * m[7] + m[12] * m[3] * m[6];
    inv[10] = m[0] * m[5] * m[15] - m[0] * m[7] * m[13] - m[4] * m[1] * m[15] + m[4] * m[3] * m[13] + m[12] * m[1] * m[7] - m[12] * m[3] * m[5];
    inv[14] = -m[0] * m[5] * m[14] + m[0] * m[6] * m[13] + m[4] * m[1] * m[14] - m[4] * m[2] * m[13] - m[12] * m[1] * m[6] + m[12] * m[2] * m[5];
    inv[3] = -m[1] * m[6] * m[11] + m[1] * m[7] * m[10] + m[5] * m[2] * m[11] - m[5] * m[3] * m[10] - m[9] * m[2] * m[7] + m[9] * m[3] * m[6];
    inv[7] = m[0] * m[6] * m[11] - m[0] * m[7] * m[10] - m[4] * m[2] * m[11] + m[4] * m[3] * m[10] + m[8] * m[2] * m[7] - m[8] * m[3] * m[6];
    inv[11] = -m[0] * m[5] * m[11] + m[0] * m[7] * m[9] + m[4] * m[1] * m[11] - m[4] * m[3] * m[9] - m[8] * m[1] * m[7] + m[8] * m[3] * m[5];
    inv[15] = m[0] * m[5] * m[10] - m[0] * m[6] * m[9] - m[4] * m[1] * m[10] + m[4] * m[2] * m[9] + m[8] * m[1] * m[6] - m[8] * m[2] * m[5];
    det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];

    if (det == 0) {
        console.log("Error: Non-invertible matrix");
        return mtx_zero();
    }

    det = 1.0 / det;
    for (var i = 0; i < 16; i++) {
        inv[i] *= det;
    }
    return inv;
}

function mtx_translation(x, y, z) {
    return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        x, y, z, 1
    ];
}

function mtx_rotation_x(r) {
    return [
        1, 0, 0, 0,
        0, Math.cos(r), Math.sin(r), 0,
        0, -Math.sin(r), Math.cos(r), 0,
        0, 0, 0, 1
    ];
}

function mtx_rotation_y(r) {
    return [
        Math.cos(r), 0, -Math.sin(r), 0,
        0, 1, 0, 0,
        Math.sin(r), 0, Math.cos(r), 0,
        0, 0, 0, 1
    ];
}

function mtx_perspective(fov_y, aspect, z_near, z_far) {
    var top = z_near * Math.tan(fov_y * Math.PI / 360.0);
    var bot = -top;
    var left = bot * aspect;
    var right = top * aspect;

    var X = 2 * z_near / (right - left);
    var Y = 2 * z_near / (top - bot);
    var A = (right + left) / (right - left);
    var B = (top + bot) / (top - bot);
    var C = -(z_far + z_near) / (z_far - z_near);
    var D = -2 * z_far * z_near / (z_far - z_near);

    return [
        X, 0.0, 0.0, 0.0,
        0.0, Y, 0.0, 0.0,
        A, B, C, -1.0,
        0.0, 0.0, D, 0.0
    ];
}
