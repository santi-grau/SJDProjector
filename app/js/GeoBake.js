import { Scene, PerspectiveCamera, DataTexture, RGBFormat, FloatType, AnimationMixer, BufferAttribute, Vector3, Vector4, Matrix4 } from 'three'
import GLTFLoader from 'three-gltf-loader'
import birds from '../assets/models/*.gltf'
import EventEmitter from 'event-emitter-es6'

class GeoBake{
	constructor( renderer ){
		this.emitter = new EventEmitter()
		this.scene = new Scene();
		this.renderer = renderer
		this.tSize = 2048

		this.tWidth = 2048
		this.tHeight = 300

		this.tData = new Float32Array( 3 * this.tWidth * this.tHeight )
		this.models = []

		this.camera = new PerspectiveCamera( 25, window.innerWidth / window.innerHeight, 1, 1000 );
		this.loadScene( )
	}

	loadScene( ){
		new GLTFLoader( ).load( birds[ Object.keys( birds )[ this.models.length ] ], ( gltf ) => this.capture( gltf ) )
	}

	writeTexture( ){
		var texture = new DataTexture( this.tData, this.tWidth, this.tHeight, RGBFormat, FloatType );
		texture.needsUpdate = true
		return this.emitter.emit( 'computeReady',  this.models, texture )
	}

	capture( gltf ){
		var animations = gltf.animations
		var root = gltf.scene
		this.scene = root
		var clip = animations[ 0 ]
		this.mixer = new AnimationMixer( root )
		this.mixer.clipAction( clip ).play()
		this.skinnedMesh = this.scene.children[ 0 ].children[ 1 ]

		var offset = this.models.length
		
		for( var i = 0 ; i < 60 ; i++ ){
			this.renderer.render( this.scene, this.camera )
			var ps = this.computeFrame( )
			for( var j = 0 ; j < ps.length ; j++ ){
				var stride = ( i + offset * 60 ) * this.tWidth * 3 + j * 3
				this.tData[ stride ] = ps[j].x
				this.tData[ stride + 1 ] = ps[j].y
				this.tData[ stride + 2 ] = ps[j].z
			}
			this.mixer.update( 1/61 )
		}
		
		var ids = []
		for( var i = 0 ; i < this.skinnedMesh.geometry.attributes.position.count ; i++ ) ids.push( i, offset, Math.random() )
		this.skinnedMesh.geometry.addAttribute( 'vertexID', new BufferAttribute( new Float32Array( ids ), 3 ) )
		this.skinnedMesh.geometry.name = Object.keys( birds )[ this.models.length ]
		this.models.push( this.skinnedMesh.geometry )

		if( this.models.length < Object.keys( birds ).length ) this.loadScene( )
		else this.writeTexture( )
	}

	computeFrame( ) {
		var vertex = new Vector3(), temp = new Vector3(), skinned = new Vector3(), skinIndices = new Vector4(), skinWeights = new Vector4(), boneMatrix = new Matrix4()
		var skeleton = this.skinnedMesh.skeleton
		var boneMatrices = skeleton.boneMatrices
		var geometry = this.skinnedMesh.geometry
		var index = geometry.index
		var position = geometry.attributes.position
		var skinIndex = geometry.attributes.skinIndex
		var skinWeigth = geometry.attributes.skinWeight
		var bindMatrix = this.skinnedMesh.bindMatrix
		var bindMatrixInverse = this.skinnedMesh.bindMatrixInverse
		var ps = []
		for ( var i = 0; i < index.count; i ++ ) {		
			vertex.fromBufferAttribute( position, index.array[ i ] )
			skinIndices.fromBufferAttribute( skinIndex, index.array[ i ] )
			skinWeights.fromBufferAttribute( skinWeigth, index.array[ i ] )
			vertex.applyMatrix4( bindMatrix ) // transform to bind space
			skinned.set( 0, 0, 0 )
	
			for ( var j = 0; j < 4; j ++ ) {
				boneMatrix.fromArray( boneMatrices, skinIndices.getComponent( j ) * 16 )
				temp.copy( vertex ).applyMatrix4( boneMatrix ).multiplyScalar( skinWeights.getComponent( j ) ) // weighted vertex transformation
				skinned.add( temp )
			}
	
			skinned.applyMatrix4( bindMatrixInverse ) // back to local space
			ps[ index.array[ i ] ] = skinned.clone()
		}
		return ps
	}
}

export { GeoBake as default }