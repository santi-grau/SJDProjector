import { Mesh, BufferGeometry, BufferAttribute, ShaderMaterial } from 'three'
import shaders from './shaders/birds.*'
import GeoBake from './GeoBake'
import ComputationRender from './ComputationRender'
import ShapeCompute from './ShapeCompute'
import EventEmitter from 'event-emitter-es6'
// import fs from 'fs'
// import TGA from 'tga'

class BirdMesh extends Mesh {
    constructor( renderer, camera, tSize ){
        super()
        this.renderer = renderer
        this.camera = camera
        this.tSize = tSize
        this.emitter = new EventEmitter()
        this.precomputed = new GeoBake( this.renderer )

        this.wingSpeed = 2
        
        this.computationRender = new ComputationRender( this.renderer, this.camera, this.tSize )

        this.shapeCompute = new ShapeCompute( ) 
        this.shapeCompute.emitter.on( 'positionUpdate', ( c, d ) => this.shapeUpdate( c, d ) )

        this.precomputed.emitter.on( 'computeReady', ( models, texture ) => this.init( models, texture ) )

        setInterval( () => this.computationRender.randomizeFormationTexture( ), 2500 )
    }

    init( models, texture ){
        console.log( models, texture )
        // console.log( texture.image.width, texture.image.height, texture.image.data )
        // var data = []
        // texture.image.data.forEach( (d, i ) => { data.push(  parseFloat( d.toFixed( 5 ) ) ) })
        // var blob = new Blob([JSON.stringify(data)], {type: "text/plain"});
        // var url = window.URL.createObjectURL(blob);
        // var a = document.createElement("a");
        // a.href = url;
        // a.download = 'data.json';
        // a.click();

        var colors = [ [0.16, 0.63, 0.6 ], [0.33, 0.68, 0.86 ], [0.54, 0.23, 0.55 ], [0.0, 0.36, 0.64 ], [ 0.84, 0.05, 0.5 ] ]
        var sizes = { tortola : 0.743015, puput : 1.0483234923, golondrina : 1.5, estornino : 1.3110737618, codorniz : 1.2  }
        var geometry = new BufferGeometry();
        var pos = [], vid = [], ref = [], ind = [], col = []
        var vcount = 0
        var totalBirds = this.tSize * this.tSize
        
        for( var h = 0 ; h < totalBirds ; h++ ){
            var seed = Math.random()
            var mid = Math.floor( Math.random() * models.length )
            var scale = sizes[ models[ mid ].name ]
            var model = models[ mid ]
            var p = model.getAttribute( 'position' )
            var d = model.index
            
            var x = ( h % this.tSize ) / this.tSize
		    var y = ~ ~ ( h / this.tSize ) / this.tSize
            for( var i = 0 ; i < p.count ; i++ ){
                pos.push( 0, 0, 0 )
                vid.push( i, mid, seed, scale )
                ref.push( x, y  )
                col.push( colors[ mid ][ 0 ], colors[ mid ][ 1 ], colors[ mid ][ 2 ] )
            }
            for( var i = 0 ; i < d.count ; i++ ) ind.push( d.getX( i ) + vcount )
            vcount += p.count
        }

        geometry.addAttribute( 'position', new BufferAttribute( new Float32Array( pos ), 3 ) )
        geometry.addAttribute( 'vertexID', new BufferAttribute( new Float32Array( vid ), 4 ) )
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
                formationTimeline : { value : null },
		        time : { value: 1.0 },
		        delta : { value: 0.0 },
                frame: { value : 0 }
			},
			vertexShader: shaders.vert,
            fragmentShader: shaders.frag,
            transparent : true
        } );

        this.emitter.emit( 'geoReady' )
    }

    shapeUpdate( c ){
        this.computationRender.makeFormation( c )
    }

    leaveScreen(){
        this.computationRender.leaveScreen( c )
    }

    makeFormation( data ){
        if( data.type == 'text' ) this.shapeCompute.makeText( data.content )
        else if( data.type == 'icon' ) this.shapeCompute.makeImage( data.content )
        else if ( data.type == 'reset' ) this.computationRender.undoFormation( )
    }

    step( time ) {
		this.computationRender.step( time )
        this.material.uniforms.frame.value += this.wingSpeed

        this.material.uniforms[ "texturePosition" ].value = this.computationRender.gpuCompute.getCurrentRenderTarget( this.computationRender.positionVariable ).texture
        this.material.uniforms[ "textureVelocity" ].value = this.computationRender.gpuCompute.getCurrentRenderTarget( this.computationRender.velocityVariable ).texture
        this.material.uniforms[ "textureFormation" ].value = this.computationRender.dtFormation
        this.material.uniforms[ "formationTimeline" ].value = this.computationRender.formationTimeline
    }
}

export { BirdMesh as default }