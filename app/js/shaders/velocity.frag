uniform float delta; // about 0.016
uniform float time; // about 0.016

uniform sampler2D formationTexture;

const float width = resolution.x;
const float height = resolution.y;
const float PI = 3.141592653589793;
const float PI_2 = PI * 2.0;

const float speedLimit = 4.0;
float rand( vec2 co ){
    return fract( sin( dot( co.xy, vec2(12.9898,78.233) ) ) * 43758.5453 );
}

void main() {
    
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 selfPosition = texture2D( texturePosition, uv );
    vec4 velocity = texture2D( textureVelocity, uv );
    vec4 formation = texture2D( formationTexture, uv );
    
    
    vec3 dir = vec3( 0.0 );
    float dist = length( dir );
    
    // Attract flocks to the center
    vec3 central = vec3( 0.0 );
    central = vec3( formation.x, formation.y, formation.z );
    dir = selfPosition.xyz - central;
    dist = length( dir );
    dir.y *= 2.5;
    velocity.xyz -= normalize( dir ) * delta * 5.;
    
    // Speed Limits
    
    if ( length( velocity.xyz ) > speedLimit ) velocity.xyz = normalize( velocity.xyz ) * speedLimit;

    // if( formation.w > 0.0 ) velocity.w += 0.1;
    // if( formation.w == 1.0 ) velocity.xyz = vec3( 0.0000001, 0.0000001, 0.0000001 );
    
    // if( formation.w == 1.0 ) velocity.xyz += ( vec3( formation.x, formation.y, 0.0 ) - selfPosition.xyz ) * 0.1;
    // if( formation.w > 0.0 ) velocity.w = 1.0;

    // if( selfPosition.w < 1.0 ) velocity = vec3( 0.0000001, 0.0000001, 0.0000001 );

    gl_FragColor = velocity;
}