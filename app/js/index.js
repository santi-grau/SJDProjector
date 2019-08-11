import * as THREE from 'three'
import ComputeScene from './ComputeScene'
// import MainScene from './MainScene'
import shaders from './shaders/*.*'
import { GPUComputationRenderer } from './GPUComputationRender'

import OrbitControls from 'orbit-controls-es6'

var last = performance.now()
const visibleHeightAtZDepth = ( depth, camera ) => {
	const cameraOffset = camera.position.z
	if ( depth < cameraOffset ) depth -= cameraOffset
	else depth += cameraOffset
	return 2 * Math.tan( camera.fov * Math.PI / 180 / 2 ) * Math.abs( depth )
}
var visibleWidthAtZDepth = function( depth, camera ){
	return visibleHeightAtZDepth( depth, camera ) * camera.aspect
}

class Index{
    constructor(){
        this.node = document.createElement( 'div' )
        this.node.id = "threeLayer"
        document.body.appendChild( this.node )

        this.tSize = 16
        if(window.location.hash) {
            this.tSize = Math.sqrt( parseInt( window.location.hash.substring( 1 ) ) )
        }
        

        this.renderer = new THREE.WebGLRenderer( { antialias : true, alpha : true } )
        this.renderer.setPixelRatio( window.devicePixelRatio * 2 )
        this.renderer.setSize( this.node.offsetWidth, this.node.offsetHeight )
        this.node.appendChild( this.renderer.domElement )

        this.precomputed = new ComputeScene( this.renderer )
        this.precomputed.emitter.on( 'computeReady', ( models, texture ) => this.init( models, texture ) )
    }

    init( models, texture ){

        this.initComputeRenderer()

        this.currentFrame = 0
        this.camera = new THREE.PerspectiveCamera( 75, this.node.offsetWidth / this.node.offsetHeight, 1, 3000 );
        this.camera.position.set( 0, 0, 200 );
		this.camera.lookAt( 0, 0, 0 );
        
        const controls = new OrbitControls(this.camera, this.renderer.domElement);
        controls.enabled = true;
        controls.maxDistance = 500;
        controls.minDistance = 50;

        this.scene = new THREE.Scene()

        var colors = [ [0.16, 0.63, 0.6 ], [0.33, 0.68, 0.86 ], [0.54, 0.23, 0.55 ], [0.0, 0.36, 0.64 ], [ 0.84, 0.05, 0.5 ] ]

        var geometry = new THREE.BufferGeometry();
        var pos = [], vid = [], ref = [], ind = [], col = []
        var vcount = 0
        var totalBirds = this.tSize * this.tSize
        for( var h = 0 ; h < totalBirds ; h++ ){
            var mid = Math.floor( Math.random() * 5 )
            var model = models[ mid ]
            var p = model.getAttribute( 'position' )
            var d = model.index
            
            var x = ( h % this.tSize ) / this.tSize
		    var y = ~ ~ ( h / this.tSize ) / this.tSize
            for( var i = 0 ; i < p.count ; i++ ){
                pos.push( p.getX( i ),p.getY( i ), p.getZ( i ) )
                vid.push( i, mid, Math.random() )
                ref.push( x, y  )
                col.push( colors[ mid ][ 0 ], colors[ mid ][ 1 ], colors[ mid ][ 2 ] )
            }
            for( var i = 0 ; i < d.count ; i++ ) ind.push( d.getX( i ) + vcount )
            vcount += p.count
        }

        geometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( pos ), 3 ) )
        geometry.addAttribute( 'vertexID', new THREE.BufferAttribute( new Float32Array( vid ), 3 ) )
        geometry.addAttribute( 'vColor', new THREE.BufferAttribute( new Float32Array( col ), 3 ) )
        geometry.addAttribute( 'reference', new THREE.BufferAttribute( new Float32Array( ref ), 2 ) )
        geometry.setIndex( ind )
        
        var material = new THREE.ShaderMaterial( {
			uniforms: {
                txtAnimation: { value : texture },
                texturePosition : { value: this.gpuCompute.getCurrentRenderTarget( this.positionVariable ).texture },
		        textureVelocity : { value: this.gpuCompute.getCurrentRenderTarget( this.velocityVariable ).texture },
		        time : { value: 1.0 },
		        delta : { value: 0.0 },
				frame: { value : 0 }
			},
			vertexShader: shaders.compute.vert,
			fragmentShader: shaders.compute.frag
        } );
        
		this.mesh = new THREE.Mesh( geometry , material );
        this.scene.add( this.mesh )
        
        this.step()
    }

    initComputeRenderer() {
        var WIDTH = this.tSize
        var BIRDS = WIDTH * WIDTH
        var BOUNDS = 1600
        this.gpuCompute = new GPUComputationRenderer( WIDTH, WIDTH, this.renderer )
        var dtPosition = this.gpuCompute.createTexture()
        var dtVelocity = this.gpuCompute.createTexture()
        this.fillPositionTexture( dtPosition, BOUNDS )
        this.fillVelocityTexture( dtVelocity, BOUNDS )
        this.velocityVariable = this.gpuCompute.addVariable( "textureVelocity", shaders.velocity.frag, dtVelocity )
        this.positionVariable = this.gpuCompute.addVariable( "texturePosition", shaders.position.frag, dtPosition )
        this.gpuCompute.setVariableDependencies( this.velocityVariable, [ this.positionVariable, this.velocityVariable ] )
        this.gpuCompute.setVariableDependencies( this.positionVariable, [ this.positionVariable, this.velocityVariable ] )
        this.positionUniforms = this.positionVariable.material.uniforms
        this.velocityUniforms = this.velocityVariable.material.uniforms
        this.positionUniforms[ "time" ] = { value: 0.0 }
        this.positionUniforms[ "delta" ] = { value: 0.0 }
        this.velocityUniforms[ "time" ] = { value: 1.0 }
        this.velocityUniforms[ "delta" ] = { value: 0.0 }
        this.velocityUniforms[ "separationDistance" ] = { value: 1.0 }
        this.velocityUniforms[ "alignmentDistance" ] = { value: 1.0 }
        this.velocityUniforms[ "cohesionDistance" ] = { value: 1.0 }
        this.velocityUniforms[ "freedomFactor" ] = { value: 0.0 }
        this.velocityUniforms[ "predator" ] = { value: new THREE.Vector3() }
        this.velocityVariable.material.defines.BOUNDS = BOUNDS.toFixed( 2 )
        this.velocityVariable.wrapS = THREE.RepeatWrapping
        this.velocityVariable.wrapT = THREE.RepeatWrapping
        this.positionVariable.wrapS = THREE.RepeatWrapping
        this.positionVariable.wrapT = THREE.RepeatWrapping
        var error = this.gpuCompute.init()
        if ( error !== null ) console.error( error )
    }

    fillPositionTexture( texture, BOUNDS  ) {
        var theArray = texture.image.data
        for ( var k = 0, kl = theArray.length; k < kl; k += 4 ) {
            theArray[ k + 0 ] = Math.random() * BOUNDS - BOUNDS / 2
            theArray[ k + 1 ] = Math.random() * BOUNDS - BOUNDS / 2
            theArray[ k + 2 ] = Math.random() * BOUNDS - BOUNDS / 2
            theArray[ k + 3 ] = 1
        }
    }

    fillVelocityTexture( texture, BOUNDS ) {
        var theArray = texture.image.data
        for ( var k = 0, kl = theArray.length; k < kl; k += 4 ) {
            theArray[ k + 0 ] = Math.random() - 0.5 * 10
            theArray[ k + 1 ] = Math.random() - 0.5 * 10
            theArray[ k + 2 ] = Math.random() - 0.5 * 10
            theArray[ k + 3 ] = 1
        }
    }

    step( time ){
        requestAnimationFrame( this.step.bind( this ) )
        this.currentFrame = ( this.currentFrame < 58 ) ? ( this.currentFrame + 1 ) : 0;

        var now = performance.now()
        var delta = ( now - last ) / 1000
        if ( delta > 1 ) delta = 1 // safety cap on large deltas
        last = now
        this.positionUniforms[ "time" ].value = now
        this.positionUniforms[ "delta" ].value = delta
        this.velocityUniforms[ "time" ].value = now
        this.velocityUniforms[ "delta" ].value = delta
        // this.birdUniforms[ "time" ].value = now
        // this.birdUniforms[ "delta" ].value = delta
        this.velocityUniforms[ "predator" ].value.set( 10000,10000, 0 )
        this.mouseX = 10000
        this.mouseY = 10000
        this.gpuCompute.compute()

        this.mesh.material.uniforms.frame.value = this.currentFrame
        this.mesh.material.uniforms[ "texturePosition" ].value = this.gpuCompute.getCurrentRenderTarget( this.positionVariable ).texture
        this.mesh.material.uniforms[ "textureVelocity" ].value = this.gpuCompute.getCurrentRenderTarget( this.velocityVariable ).texture
    

		this.renderer.render( this.scene, this.camera );
       
    }
}

new Index()