import { WebGLRenderer, PerspectiveCamera, Scene } from 'three'
import BirdMesh from './BirdMesh'

class Index{
    constructor(){
        this.node = document.createElement( 'div' )
        this.node.id = "threeLayer"
        document.body.appendChild( this.node )

        this.renderer = new WebGLRenderer( { antialias : true, alpha : true } )
        this.renderer.setPixelRatio( window.devicePixelRatio * 2 )
        this.renderer.setSize( this.node.offsetWidth, this.node.offsetHeight )
        this.node.appendChild( this.renderer.domElement )

        this.birdMesh = new BirdMesh( this.renderer, 8 )
        this.birdMesh.emitter.on( 'geoReady', () => this.init() )

        var buts = document.getElementsByTagName( 'button' )
        for ( var i = 0 ; i < buts.length ; i++ ) buts[ i ].addEventListener( 'click', ( e ) => this.birdMesh.updateFormation( e ) )
    }

    init(  ){
        this.camera = new PerspectiveCamera( 75, this.node.offsetWidth / this.node.offsetHeight, 1, 3000 );
        this.camera.position.set( 0, 0, 200 );

        this.scene = new Scene()

        this.scene.add( this.birdMesh )
        this.step()
    }

    step( time ){
        requestAnimationFrame( this.step.bind( this ) )

        this.birdMesh.step()
		this.renderer.render( this.scene, this.camera );
    }
}

new Index()