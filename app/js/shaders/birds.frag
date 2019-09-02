varying vec4 col;

void main() {
    float a = 1.0;
    // if( col.a < 0.9 ) a = 0.0;
    gl_FragColor = vec4( col.rgb, a );
}