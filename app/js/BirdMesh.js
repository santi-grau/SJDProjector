import { Mesh, BufferGeometry, BufferAttribute, ShaderMaterial } from 'three'
import shaders from './shaders/birds.*'
import GeoBake from './GeoBake'
import ComputationRender from './ComputationRender'
import ShapeCompute from './ShapeCompute'
import EventEmitter from 'event-emitter-es6'

class BirdMesh extends Mesh {
    constructor( renderer, tSize ){
        super()
        this.renderer = renderer
        this.tSize = tSize
        this.emitter = new EventEmitter()
        this.precomputed = new GeoBake( this.renderer )
        
        this.computationRender = new ComputationRender( this.renderer, this.tSize )

        this.shapeCompute = new ShapeCompute( ) 
        this.shapeCompute.emitter.on( 'positionUpdate', ( c, d ) => this.shapeUpdate( c, d ) )

        this.precomputed.emitter.on( 'computeReady', ( models, texture ) => this.init( models, texture ) )
    }

    init( models, texture ){
        var colors = [ [0.16, 0.63, 0.6 ], [0.33, 0.68, 0.86 ], [0.54, 0.23, 0.55 ], [0.0, 0.36, 0.64 ], [ 0.84, 0.05, 0.5 ] ]
        var geometry = new BufferGeometry();
        var pos = [], vid = [], ref = [], ind = [], col = []
        var vcount = 0
        var totalBirds = this.tSize * this.tSize
        for( var h = 0 ; h < totalBirds ; h++ ){
            var seed = Math.random()
            var mid = Math.floor( Math.random() * 5 )
            var model = models[ mid ]
            var p = model.getAttribute( 'position' )
            var d = model.index
            
            var x = ( h % this.tSize ) / this.tSize
		    var y = ~ ~ ( h / this.tSize ) / this.tSize
            for( var i = 0 ; i < p.count ; i++ ){
                pos.push( p.getX( i ),p.getY( i ), p.getZ( i ) )
                vid.push( i, mid, seed )
                ref.push( x, y  )
                col.push( colors[ mid ][ 0 ], colors[ mid ][ 1 ], colors[ mid ][ 2 ] )
            }
            for( var i = 0 ; i < d.count ; i++ ) ind.push( d.getX( i ) + vcount )
            vcount += p.count
        }

        geometry.addAttribute( 'position', new BufferAttribute( new Float32Array( pos ), 3 ) )
        geometry.addAttribute( 'vertexID', new BufferAttribute( new Float32Array( vid ), 3 ) )
        geometry.addAttribute( 'vColor', new BufferAttribute( new Float32Array( col ), 3 ) )
        geometry.addAttribute( 'reference', new BufferAttribute( new Float32Array( ref ), 2 ) )
        geometry.setIndex( ind )

        this.geometry = geometry
        
        this.material = new ShaderMaterial( {
			uniforms: {
                txtAnimation: { value : texture },
                texturePosition : { value: null },
                textureVelocity : { value: null },
                textureFormation : { value : null },
		        time : { value: 1.0 },
		        delta : { value: 0.0 },
                frame: { value : 0 }
			},
			vertexShader: shaders.vert,
            fragmentShader: shaders.frag
        } );

        this.emitter.emit( 'geoReady' )
    }

    shapeUpdate( c, d ){
        this.computationRender.makeFormation( c, d )
    }

    updateFormation( e ){
        console.log( e )
        var type = e.target.dataset.type
        var id = e.target.dataset.id
        console.log( type )
        if( type == 'text' ) this.shapeCompute.makeText( )
        else if( type == 'icon' ) this.shapeCompute.makeImage( id )
        else if( type == 'reset' ) this.computationRender.undoFormation( )
    }

    step( time ) {
		this.computationRender.step( time )
        this.material.uniforms.frame.value = ( this.material.uniforms.frame.value < 58 ) ? ( this.material.uniforms.frame.value + 1 ) : 0;

        this.material.uniforms[ "texturePosition" ].value = this.computationRender.gpuCompute.getCurrentRenderTarget( this.computationRender.positionVariable ).texture
        this.material.uniforms[ "textureVelocity" ].value = this.computationRender.gpuCompute.getCurrentRenderTarget( this.computationRender.velocityVariable ).texture
        this.material.uniforms[ "textureFormation" ].value = this.computationRender.dtFormation

    }
}

export { BirdMesh as default }