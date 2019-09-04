uniform float delta; // about 0.016

uniform sampler2D formationTexture;
uniform float formationTimeline;
uniform bool impulse;
const float PI = 3.1415926535897932384626433832795;

mat4 rotationMatrix(vec3 axis, float angle) {
	axis = normalize(axis);
	float s = sin(angle);
	float c = cos(angle);
	float oc = 1.0 - c;
	return mat4( oc * axis.x * axis.x + c, oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s, 0.0, oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c, oc * axis.y * axis.z - axis.x * s, 0.0, oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c, 0.0, 0.0, 0.0, 0.0, 1.0);
}

vec3 rotate( vec3 v, vec3 axis, float angle ) {
	mat4 m = rotationMatrix(axis, angle);
	return (m * vec4(v, 1.0)).xyz;
}

void main() {
    float speedLimit = 4.0;
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 position = texture2D( texturePosition, uv );
    vec4 velocity = texture2D( textureVelocity, uv );
    vec4 formation = texture2D( formationTexture, uv );
    
    // Attract flocks to the center
    vec3 dir = position.xyz - formation.xyz;
    velocity.xyz -= (normalize( dir ) * delta * 5. );
    
    float stationary = position.w;
    if( formation.w == 1.0 ) {
        vec3 ppp = vec3( 1.0, 0.0, 0.0);
        
        ppp =  rotate( ppp, vec3( 0.0, 0.0, 1.0 ), formation.z - PI * 0.5 );
        vec3 pFormation = normalize( ppp ) * 0.01;

        vec3 dif = vec3( formation.x, formation.y, 0.0 ) - position.xyz;
        vec3 minSpeed = vec3( 0.001 );
        velocity.xyz += dif;
        if ( length( velocity.xyz ) > length( dif ) ) velocity.xyz = normalize( velocity.xyz ) * length( dif );
        if ( length( velocity.xyz ) < length( minSpeed ) ) velocity.xyz = normalize( velocity.xyz ) * length( minSpeed );

        if( abs( length( dir ) ) < 10.0 ) stationary += ( 1.0 - stationary ) * 0.1;

        velocity.xyz = mix( velocity.xyz, pFormation, stationary );
        
    } else {
        if( abs( length( dir ) ) > 10.0 ) stationary -= stationary * 0.1;
    }
    velocity.w = stationary;

    if ( impulse ) speedLimit = 10.0;

    if ( length( velocity.xyz ) > speedLimit ) velocity.xyz = normalize( velocity.xyz ) * speedLimit;
    
    

    gl_FragColor = velocity;
}