uniform float delta;
uniform sampler2D formationTexture;

void main()	{

    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 position = texture2D( texturePosition, uv );
    vec4 formation = texture2D( formationTexture, uv );
    vec4 velocity = texture2D( textureVelocity, uv );

    

    vec4 p = vec4( position.xyz + velocity.xyz * velocity.w * delta * 15. , 0.0 );
    if( formation.w == 1.0 ) {
        p = vec4( formation.xyz, 0.0 );
    }

    // float phase = tmpPos.w;
    // phase = ( phase + delta + length( velocity.xz ) * delta * 3. + max( velocity.y, 0.0 ) * delta * 6. ), 62.83 );

    gl_FragColor = p;

}
