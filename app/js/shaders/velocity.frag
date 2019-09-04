uniform float delta; // about 0.016

uniform sampler2D formationTexture;
uniform float formationTimeline;
const float speedLimit = 4.0;

void main() {
    
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 position = texture2D( texturePosition, uv );
    vec4 velocity = texture2D( textureVelocity, uv );
    vec4 formation = texture2D( formationTexture, uv );
    
    // Attract flocks to the center
    vec3 dir = position.xyz - formation.xyz;

    velocity.xyz -= (normalize( dir ) * delta * 5.);
    

    if( formation.w == 1.0 && position.w == 1.0 ) {
        vec3 dif = vec3( formation.x, formation.y, 0.0 ) - position.xyz;
        vec3 minSpeed = vec3( 0.0000001 );
        velocity.xyz += dif * 0.1;
        if ( length( velocity.xyz ) > length( dif ) ) velocity.xyz = normalize( velocity.xyz ) * length( dif );
        if ( length( velocity.xyz ) < length( minSpeed ) ) velocity.xyz = normalize( velocity.xyz ) * length( minSpeed );
    }

    if ( length( velocity.xyz ) > speedLimit ) velocity.xyz = normalize( velocity.xyz ) * speedLimit;


    gl_FragColor = velocity;
}