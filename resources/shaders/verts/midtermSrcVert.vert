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