import * as THREE from 'three'
import shaders from './shaders/*.*'

class MainScene{
    constructor( renderer, data ){
        this.renderer = renderer
        this.currentFrame = 0
        console.log( this.renderer )
        this.camera = new THREE.PerspectiveCamera( 75, this.renderer.domElement.width / this.renderer.domElement.height, 1, 3000 )
        this.camera.position.z = 200
        
        this.scene = new THREE.Scene()

         var material = new THREE.ShaderMaterial( {
			uniforms: {
				txtAnimation: { value : data.texture },
				frame: { value : 0 }
			},
			vertexShader: shaders.compute.vert,
			fragmentShader: shaders.compute.frag
		} );
        console.log( data.geos[ 0 ])
		this.mesh = new THREE.Mesh( data.geos[0] , material );
		this.scene.add( this.mesh )
    }

    step( time ) {
        this.currentFrame = ( this.currentFrame < this.frames - 1 ) ? ( this.currentFrame + 1 ) : 0;
		this.mesh.material.uniforms.frame.value = this.currentFrame
		this.renderer.render( this.scene, this.camera );
    }
}

export { MainScene as default }