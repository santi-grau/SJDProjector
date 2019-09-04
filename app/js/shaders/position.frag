uniform float delta;
uniform sampler2D formationTexture;
const float PI = 3.141592653589793;
uniform float formationTimeline;
uniform vec2 screenSize;

vec2 lineIntersect( vec4 l1, vec4 l2 ){
    float x1 = l1.x, y1 = l1.y, x2 = l1.z, y2 = l1.w, x3 = l2.x, y3 = l2.y, x4 = l2.z, y4 = l2.w;
    float denom = (y4 - y3)*(x2 - x1) - (x4 - x3)*(y2 - y1);
    float ua = ((x4 - x3)*(y1 - y3) - (y4 - y3)*(x1 - x3))/denom;
    return vec2 (x1 + ua * (x2 - x1), y1 + ua * (y2 - y1) );
}

bool doIntersect(vec4 l1, vec4 l2) {
    float a = l1.x, b = l1.y, c = l1.z, d = l1.w, p = l2.x, q = l2.y, r = l2.z, s = l2.w;
    float det = (c - a) * (s - q) - (r - p) * (d - b);
    if (det != 0.0) {
        float lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
        float gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
        return (0.0 < lambda && lambda < 1.0) && (0.0 < gamma && gamma < 1.0);
    }
    return false;
}


vec2 lineEdgeIntersection( vec2 o, float rotation ){
    vec4 l = vec4( o.x, o.y, o.x - cos( -rotation + PI / 2.0 ) * 5000.0, o.y - sin( -rotation + PI / 2.0 ) * 5000.0 );
    vec2 ss = screenSize * 0.5;
    vec4 eTop = vec4( -ss.x, ss.y, ss.x, ss.y );
    vec4 eRight = vec4( ss.x, ss.y, ss.x, -ss.y );
    vec4 eBot = vec4( -ss.x, -ss.y, ss.x, -ss.y );
    vec4 eLeft = vec4( -ss.x, -ss.y, -ss.x, ss.y );
    
    if( doIntersect( l, eTop ) ) return( lineIntersect( l, eTop ) );
    if( doIntersect( l, eRight ) ) return( lineIntersect( l, eRight ) );
    if( doIntersect( l, eBot ) ) return( lineIntersect( l, eBot ) );
    if( doIntersect( l, eLeft ) ) return( lineIntersect( l, eLeft ) );
    return vec2( -2000.0, -2000.0 );
}

float easeOutQuad( float t, float b, float c, float d ) {
	t /= d;
	return -c * t*(t-2.0) + b;
}

void main()	{

    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 position = texture2D( texturePosition, uv );
    vec4 formation = texture2D( formationTexture, uv );
    vec4 velocity = texture2D( textureVelocity, uv );

    vec4 p = vec4( position.xyz + velocity.xyz * delta * 15. , velocity.w );
    
    
    // if( formation.w == 0.0 && position.w == 0.0 ) {
    //     p = vec4( -2000.0, -2000, 0.0, 0.0 );
    // }


    // if( formation.w == 1.0 && position.w == 0.0 ) {
    //     vec2 intersect = lineEdgeIntersection( formation.xy, formation.z );
    //     vec2 path = ( intersect - formation.xy ) * ( 1.0 + ( 1.0 - velocity.w ) );

    //     float t = 0.9 + (velocity.w * 0.1);
    //     float remap = clamp( ( formationTimeline - ( 1.0 - t ) / 2.0 ) /  t , 0.0, 1.0);
        
    //     float eased = easeOutQuad( remap, 0.0, 1.0, 1.0  );
    //     p = vec4( formation.xy + vec2( path * ( 1.0 - eased ) ), 0.0, 0.0 );
    // }

    gl_FragColor = p;

}
