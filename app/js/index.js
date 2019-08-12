import * as THREE from 'three'
// import MainScene from './MainScene'
import shaders from './shaders/*.*'
import GeoBake from './GeoBake'
import ComputationRender from './ComputationRender'
import ShapeCompute from './ShapeCompute'
import OrbitControls from 'orbit-controls-es6'

class Index{
    constructor(){
        this.node = document.createElement( 'div' )
        this.node.id = "threeLayer"
        document.body.appendChild( this.node )

        this.tSize = 8
        if(window.location.hash) this.tSize = Math.sqrt( parseInt( window.location.hash.substring( 1 ) ) )
        
        this.renderer = new THREE.WebGLRenderer( { antialias : true, alpha : true } )
        this.renderer.setPixelRatio( window.devicePixelRatio * 2 )
        this.renderer.setSize( this.node.offsetWidth, this.node.offsetHeight )
        this.node.appendChild( this.renderer.domElement )

        this.precomputed = new GeoBake( this.renderer )
        this.precomputed.emitter.on( 'computeReady', ( models, texture ) => this.init( models, texture ) )
    }

    init( models, texture ){

        this.computationRender = new ComputationRender( this.renderer, 8 )
        this.shapeCompute = new ShapeCompute( 'SANTI' )
        
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
                texturePosition : { value: null },
		        textureVelocity : { value: null },
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

    step( time ){
        requestAnimationFrame( this.step.bind( this ) )

        this.computationRender.step( time )
        this.currentFrame = ( this.currentFrame < 58 ) ? ( this.currentFrame + 1 ) : 0;

        this.mesh.material.uniforms.frame.value = this.currentFrame
        this.mesh.material.uniforms[ "texturePosition" ].value = this.computationRender.gpuCompute.getCurrentRenderTarget( this.computationRender.positionVariable ).texture
        this.mesh.material.uniforms[ "textureVelocity" ].value = this.computationRender.gpuCompute.getCurrentRenderTarget( this.computationRender.velocityVariable ).texture

		this.renderer.render( this.scene, this.camera );
       
    }
}

new Index()