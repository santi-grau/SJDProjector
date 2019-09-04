import { WebGLRenderer, PerspectiveCamera, Scene, GridHelper } from 'three'
import Stats from 'stats-js'
import BirdMesh from './BirdMesh'
import OrbitControls from 'orbit-controls-es6'

class Index{
    constructor(){
        this.node = document.createElement( 'div' )
        this.node.id = "threeLayer"
        document.body.appendChild( this.node )
        
        this.renderer = new WebGLRenderer( { antialias : true, alpha : true } )
        this.renderer.setPixelRatio( window.devicePixelRatio * 2 )
        this.renderer.setSize( this.node.offsetWidth, this.node.offsetHeight )
        this.node.appendChild( this.renderer.domElement )

        this.camera = new PerspectiveCamera( 50, this.node.offsetWidth / this.node.offsetHeight, 0.1, 1000 );
        this.camera.position.set( 0, 0, 350 );
        const controls = new OrbitControls( this.camera, this.renderer.domElement);
        controls.enabled = true;

        this.scene = new Scene()

        this.birdMesh = new BirdMesh( this.renderer, this.camera, 16 )
        this.birdMesh.emitter.on( 'geoReady', () => this.init() )

        var buts = document.getElementsByTagName( 'button' )
        for ( var i = 0 ; i < buts.length ; i++ ) buts[ i ].addEventListener( 'click', ( e ) => {
            var data = e.target.dataset
            this.birdMesh.makeFormation( data )
            if( data.current ){
                ( data.current < data.string.split(' ').length - 1 ) ? data.current++ : data.current = 0
                e.target.innerHTML = data.string.split(' ')[ data.current ].toLowerCase()
                data.content = data.string.split(' ')[ data.current ]
            }
        })

        this.stats = new Stats();
        document.getElementById( 'performance' ).appendChild( this.stats.dom )
    }

    init(  ){
        this.scene.add( this.birdMesh )
        this.step()
    }

    step( time ){
        this.stats.begin()
        requestAnimationFrame( this.step.bind( this ) )
        
        this.birdMesh.step( time )
        this.renderer.render( this.scene, this.camera );
        this.stats.end()
    }
}

new Index()