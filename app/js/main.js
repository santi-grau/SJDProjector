import * as THREE from 'three'
import { GPUComputationRenderer } from './GPUComputationRender'
import shaders from './shaders/*.*'
// import font from '../assets/helvetiker_bold.json'
import p5 from 'p5';
import GLTFLoader from 'three-gltf-loader'
import bird from '../assets/models/bird_low.gltf'

const visibleHeightAtZDepth = ( depth, camera ) => {
	const cameraOffset = camera.position.z
	if ( depth < cameraOffset ) depth -= cameraOffset
	else depth += cameraOffset
	return 2 * Math.tan( camera.fov * Math.PI / 180 / 2 ) * Math.abs( depth )
}
var visibleWidthAtZDepth = function( depth, camera ){
	return visibleHeightAtZDepth( depth, camera ) * camera.aspect
}

let s = ( sk ) => {    
	var circles = []
	var spots = []
	// var img

	var settings = {
		totalSimultaneous : 2,
		radiusGrowth : 1,
		maxAttempts : 15,
		maxRadius : 8,
		circleDistance : 1
	}

	// sk.preload = () =>{
	// 	img = sk.loadImage(im)
	// }

    sk.setup = () =>{
		var scale = 1
		var width = 1024 * scale
		var height = 200 * scale
		sk.createCanvas( width, height ).id('p5canvas')
		sk.background(0);
		sk.textSize(180)
		sk.fill(255, 255, 255)
		sk.textAlign( sk.CENTER, sk.CENTER )
		sk.text('DANI', 0, 0, width, height)
		sk.loadPixels()
		for (var x = 0; x < width; x++) for (var y = 0; y < height; y++) if ( sk.brightness( [ sk.pixels[ ( x + y * width ) * 4 ] ] ) > 1 ) spots.push( sk.createVector( x, y ) )
    }

    sk.draw = () =>{
		// return
		sk.background(0);
		var total = settings.totalSimultaneous;
		var count = 0;
		var attempts = 0;

		while (count < total) {
			var newC = newCircle()
			if (newC !== null) {
				circles.push(newC)
				count++
			}
			attempts++
			if ( attempts > settings.maxAttempts ) {
				sk.noLoop()
				console.log("finished")
				console.log( circles )
				break
			}
		}

		for (var i = 0; i < circles.length; i++) {
			var circle = circles[i];
		
			if (circle.growing) {
				if (circle.edges()) {
					circle.growing = false
				} else {
					for (var j = 0; j < circles.length; j++) {
						var other = circles[j]
						if (circle !== other) {
							var d = sk.dist(circle.x, circle.y, other.x, other.y)
							var distance = circle.r + other.r
		
							if (d - settings.circleDistance < distance || circle.r > settings.maxRadius ) {
								circle.growing = false
								break
							}
						}
					}
				}
			}
			circle.show();
			circle.grow();
		}
	}
	
	function Circle(x, y) {
		this.x = x
		this.y = y
		this.r = 1
		this.growing = true
	  
		this.grow = function() { if (this.growing) this.r += settings.radiusGrowth }
	  
		this.show = function() {
			sk.stroke("white");
			sk.strokeWeight(1);
			sk.noFill();
			sk.ellipse(this.x, this.y, this.r * 2, this.r * 2);
		}
	  
		this.edges = function() {
			return (this.x + this.r >= sk.width || this.x - this.r <= 0 || this.y + this.r >= sk.height || this.y - this.r <= 0)
		}
	}

	function newCircle() {
		var r = sk.int(sk.random(0, spots.length));
		var spot = spots[r];
		var x = spot.x;
		var y = spot.y;
	  
		var valid = true;
		for (var i = 0; i < circles.length; i++) {
			var circle = circles[i];
			var d = sk.dist(x, y, circle.x, circle.y);
			if (d < circle.r) {
				valid = false;
				break;
			}
		}
		if (valid) return new Circle(x, y);
		else return null;
	}
}

const P5 = new p5( s )

/* TEXTURE WIDTH FOR SIMULATION */
var WIDTH = 8
var BIRDS = WIDTH * WIDTH

// Custom Geometry - using 3 triangles each. No UVs, no normals currently.
var BirdGeometry = function () {
	var triangles = BIRDS * 3
	var points = triangles * 3
	THREE.BufferGeometry.call( this )
	var vertices = new THREE.BufferAttribute( new Float32Array( points * 3 ), 3 )
	var birdColors = new THREE.BufferAttribute( new Float32Array( points * 3 ), 3 )
	var references = new THREE.BufferAttribute( new Float32Array( points * 2 ), 2 )
	var birdVertex = new THREE.BufferAttribute( new Float32Array( points ), 1 )
	this.addAttribute( 'position', vertices )
	this.addAttribute( 'birdColor', birdColors )
	this.addAttribute( 'reference', references )
	this.addAttribute( 'birdVertex', birdVertex )
	// this.addAttribute( 'normal', new Float32Array( points * 3 ), 3 )
	var v = 0;
	function verts_push() {
		for ( var i = 0; i < arguments.length; i ++ ) vertices.array[ v ++ ] = arguments[ i ]
	}
	var wingsSpan = 20;
	for ( var f = 0; f < BIRDS; f ++ ) {
		verts_push( 0, - 0, - 20, 0, 4, - 20, 0, 0, 30 ) // Body
		verts_push( 0, 0, - 15, - wingsSpan, 0, 0, 0, 0, 15 ) // Left Wing
		verts_push( 0, 0, 15, wingsSpan, 0, 0, 0, 0, - 15 ) // Right Wing
	}
	for ( var v = 0; v < triangles * 3; v ++ ) {
		var i = ~ ~ ( v / 3 )
		var x = ( i % WIDTH ) / WIDTH
		var y = ~ ~ ( i / WIDTH ) / WIDTH
		var c = new THREE.Color( 0x4444ff + ~ ~ ( v / 9 ) / BIRDS * 0x006666 )
		birdColors.array[ v * 3 + 0 ] = c.r
		birdColors.array[ v * 3 + 1 ] = c.g
		birdColors.array[ v * 3 + 2 ] = c.b
		references.array[ v * 2 ] = x
		references.array[ v * 2 + 1 ] = y
		birdVertex.array[ v ] = v % 9
	}
	this.scale( 0.1, 0.1, 0.1 )
}

BirdGeometry.prototype = Object.create( THREE.BufferGeometry.prototype )
var container
var camera, scene, renderer
var mouseX = 0, mouseY = 0
var windowHalfX = window.innerWidth / 2
var windowHalfY = window.innerHeight / 2
var BOUNDS = 100, BOUNDS_HALF = BOUNDS / 2
var last = performance.now()
var gpuCompute
var velocityVariable
var positionVariable
var positionUniforms
var velocityUniforms
var birdUniforms

let mixer

init();
animate();


var geometry = new THREE.PlaneBufferGeometry( 32, 32 );
var material = new THREE.MeshBasicMaterial( { map : gpuCompute.getCurrentRenderTarget( positionVariable ).texture } );
var plane = new THREE.Mesh( geometry, material );
plane.position.x = -visibleWidthAtZDepth( 0, camera ) / 2 + 20
plane.position.y = -visibleHeightAtZDepth( 0, camera ) / 2 + 20
scene.add( plane );

var geometry = new THREE.PlaneBufferGeometry( 32, 32 );
var material = new THREE.MeshBasicMaterial( { map : gpuCompute.getCurrentRenderTarget( velocityVariable ).texture } );
var plane = new THREE.Mesh( geometry, material );
plane.position.x = -visibleWidthAtZDepth( 0, camera ) / 2 + 60
plane.position.y = -visibleHeightAtZDepth( 0, camera ) / 2 + 20
scene.add( plane );

function init() {
	container = document.createElement( 'div' )
	container.id = "threeLayer"
	document.body.appendChild( container )
	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 3000 )
	camera.position.z = 200
	scene = new THREE.Scene()
	scene.background = new THREE.Color( 0xffffff )
	scene.fog = new THREE.Fog( 0xffffff, 10, 1000 )
	renderer = new THREE.WebGLRenderer( { antialias : true } )
	renderer.setPixelRatio( window.devicePixelRatio * 2 )
	renderer.setSize( window.innerWidth, window.innerHeight )
	container.appendChild( renderer.domElement )
	initComputeRenderer()
	
	document.addEventListener( 'mousemove', onDocumentMouseMove, false )
	document.addEventListener( 'touchstart', onDocumentTouchStart, false )
	document.addEventListener( 'touchmove', onDocumentTouchMove, false )
	
	window.addEventListener( 'resize', onWindowResize, false )
	
	initBirds()
}

function initComputeRenderer() {
	gpuCompute = new GPUComputationRenderer( WIDTH, WIDTH, renderer )
	var dtPosition = gpuCompute.createTexture()
	var dtVelocity = gpuCompute.createTexture()
	fillPositionTexture( dtPosition )
	fillVelocityTexture( dtVelocity )
	velocityVariable = gpuCompute.addVariable( "textureVelocity", shaders.velocity.frag, dtVelocity )
	positionVariable = gpuCompute.addVariable( "texturePosition", shaders.position.frag, dtPosition )
	gpuCompute.setVariableDependencies( velocityVariable, [ positionVariable, velocityVariable ] )
	gpuCompute.setVariableDependencies( positionVariable, [ positionVariable, velocityVariable ] )
	positionUniforms = positionVariable.material.uniforms
	velocityUniforms = velocityVariable.material.uniforms
	positionUniforms[ "time" ] = { value: 0.0 }
	positionUniforms[ "delta" ] = { value: 0.0 }
	velocityUniforms[ "time" ] = { value: 1.0 }
	velocityUniforms[ "delta" ] = { value: 0.0 }
	velocityUniforms[ "separationDistance" ] = { value: 1.0 }
	velocityUniforms[ "alignmentDistance" ] = { value: 1.0 }
	velocityUniforms[ "cohesionDistance" ] = { value: 1.0 }
	velocityUniforms[ "freedomFactor" ] = { value: 1.0 }
	velocityUniforms[ "predator" ] = { value: new THREE.Vector3() }
	velocityVariable.material.defines.BOUNDS = BOUNDS.toFixed( 2 )
	velocityVariable.wrapS = THREE.RepeatWrapping
	velocityVariable.wrapT = THREE.RepeatWrapping
	positionVariable.wrapS = THREE.RepeatWrapping
	positionVariable.wrapT = THREE.RepeatWrapping
	var error = gpuCompute.init()
	if ( error !== null ) console.error( error )
}

function initBirds() {
	var geometry = new BirdGeometry()
	// For Vertex and Fragment
	birdUniforms = {
		"color": { value: new THREE.Color( 0xff2200 ) },
		"texturePosition": { value: null },
		"textureVelocity": { value: null },
		"time": { value: 1.0 },
		"delta": { value: 0.0 }
	}
	// THREE.ShaderMaterial
	var material = new THREE.ShaderMaterial( {
		uniforms: birdUniforms,
		vertexShader: shaders.bird.vert,
		fragmentShader: shaders.bird.frag,
		side: THREE.DoubleSide
	} )
	var birdMesh = new THREE.Mesh( geometry, material )
	birdMesh.rotation.y = Math.PI / 2
	birdMesh.matrixAutoUpdate = false
	birdMesh.updateMatrix()
	scene.add( birdMesh )
}

function fillPositionTexture( texture ) {
	var theArray = texture.image.data
	for ( var k = 0, kl = theArray.length; k < kl; k += 4 ) {
		var x = Math.random() * BOUNDS - BOUNDS_HALF
		var y = Math.random() * BOUNDS - BOUNDS_HALF
		var z = Math.random() * BOUNDS - BOUNDS_HALF
		theArray[ k + 0 ] = x
		theArray[ k + 1 ] = y
		theArray[ k + 2 ] = z
		theArray[ k + 3 ] = 1
	}
}

function fillVelocityTexture( texture ) {
	var theArray = texture.image.data
	for ( var k = 0, kl = theArray.length; k < kl; k += 4 ) {
		var x = Math.random() - 0.5
		var y = Math.random() - 0.5
		var z = Math.random() - 0.5
		theArray[ k + 0 ] = x * 10
		theArray[ k + 1 ] = y * 10
		theArray[ k + 2 ] = z * 10
		theArray[ k + 3 ] = 1
	}
}

function onWindowResize() {
	windowHalfX = window.innerWidth / 2
	windowHalfY = window.innerHeight / 2
	camera.aspect = window.innerWidth / window.innerHeight
	camera.updateProjectionMatrix()
	renderer.setSize( window.innerWidth, window.innerHeight )
}

function onDocumentMouseMove( event ) {
	mouseX = event.clientX - windowHalfX
	mouseY = event.clientY - windowHalfY
}

function onDocumentTouchStart( event ) {
	if ( event.touches.length === 1 ) {
		event.preventDefault()
		mouseX = event.touches[ 0 ].pageX - windowHalfX
		mouseY = event.touches[ 0 ].pageY - windowHalfY
	}
}

function onDocumentTouchMove( event ) {
	if ( event.touches.length === 1 ) {
		event.preventDefault()
		mouseX = event.touches[ 0 ].pageX - windowHalfX
		mouseY = event.touches[ 0 ].pageY - windowHalfY
	}
}

function animate( time ) {
	requestAnimationFrame( animate )
	render( time )
}

function render( time ) {
	var now = performance.now()
	var delta = ( now - last ) / 1000
	// if( mixer ) mixer.update( 0.05 )
	if ( delta > 1 ) delta = 1 // safety cap on large deltas
	last = now
	positionUniforms[ "time" ].value = now
	positionUniforms[ "delta" ].value = delta
	velocityUniforms[ "time" ].value = now
	velocityUniforms[ "delta" ].value = delta
	birdUniforms[ "time" ].value = now
	birdUniforms[ "delta" ].value = delta
	velocityUniforms[ "predator" ].value.set( 0.5 * mouseX / windowHalfX, - 0.5 * mouseY / windowHalfY, 0 )
	mouseX = 10000
	mouseY = 10000
	gpuCompute.compute()
	birdUniforms[ "texturePosition" ].value = gpuCompute.getCurrentRenderTarget( positionVariable ).texture
	birdUniforms[ "textureVelocity" ].value = gpuCompute.getCurrentRenderTarget( velocityVariable ).texture
	renderer.render( scene, camera )
}