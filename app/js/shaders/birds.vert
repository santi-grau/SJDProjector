attribute vec2 reference;
attribute vec3 vColor;
uniform sampler2D txtAnimation;
uniform sampler2D texturePosition;
uniform sampler2D textureFormation;
uniform sampler2D textureVelocity;
uniform float frame;
attribute vec4 vertexID;
varying vec4 col;
uniform float formationTimeline;

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
	col = vec4( vColor, vertexID.z );
	vec3 velocity = normalize(texture2D( textureVelocity, reference ).xyz);
	vec4 formation = texture2D( textureFormation, reference );
	vec4 position = texture2D( texturePosition, reference );
	float f = frame + floor( vertexID.z * 60.0 );
	float ff = mod( f + vertexID.z * 60.0, 60.0 );
	vec3 fPos = texture2D( txtAnimation, vec2( vertexID.x / 2048.0, ( ff + 60.0 * vertexID.y ) / 2048.0 ) ).xyz;
	fPos *= vertexID.w;
	fPos *= 15.0;


	vec3 pFlight = rotate( fPos, vec3( 0.0, 1.0, 0.0 ), -PI / 2.0 ); // rotation of model to fly straight
	vec3 pFormation = rotate(  rotate( fPos, vec3( 1.0, 0.0, 0.0 ), PI / 2.0 ), vec3( 0.0, 0.0, 1.0 ), formation.z );

	if( position.w == 1.0 ){
		fPos = mix( pFlight, pFormation, formationTimeline );
	} else {
		fPos = pFormation;
	}

	vec3 pos = texture2D( texturePosition, reference ).xyz;

	fPos *= mat3( modelMatrix );
	velocity.z *= -1.;
	float xz = length( velocity.xz );
	float xyz = 1.0;
	float x = sqrt( 1. - velocity.y * velocity.y );

	float cosry = velocity.x / xz;
	float sinry = velocity.z / xz;
	float cosrz = x / xyz;
	float sinrz = velocity.y / xyz;

	mat3 maty =  mat3( cosry, 0, -sinry, 0, 1, 0, sinry, 0, cosry );
	mat3 matz =  mat3( cosrz , sinrz, 0, -sinrz, cosrz, 0, 0, 0, 1 );

	if( position.w == 1.0 ){
		fPos = maty * matz * fPos;
	}

	fPos += pos;

	gl_Position = projectionMatrix *  viewMatrix  * vec4( fPos, 1.0 );
}