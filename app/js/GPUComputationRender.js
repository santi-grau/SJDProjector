import { Camera, ClampToEdgeWrapping, DataTexture, FloatType, HalfFloatType, Mesh, NearestFilter, PlaneBufferGeometry, RGBAFormat, Scene, ShaderMaterial, WebGLRenderTarget } from "three";

var GPUComputationRenderer = function ( sizeX, sizeY, renderer ) {

	this.variables = [];
	this.currentTextureIndex = 0;
	var scene = new Scene(), camera = new Camera();
	camera.position.z = 1;
	var passThruUniforms = { passThruTexture: { value: null } };
	var passThruShader = createShaderMaterial( getPassThroughFragmentShader(), passThruUniforms );
	var mesh = new Mesh( new PlaneBufferGeometry( 2, 2 ), passThruShader );
	scene.add( mesh );
	this.addVariable = function ( variableName, computeFragmentShader, initialValueTexture ) {
		var material = this.createShaderMaterial( computeFragmentShader );
		var variable = { name: variableName, initialValueTexture: initialValueTexture, material: material, dependencies: null, renderTargets: [], wrapS: null, wrapT: null, minFilter: NearestFilter, magFilter: NearestFilter };
		this.variables.push( variable );
		return variable;
	};

	this.setVariableDependencies = function ( variable, dependencies ) { variable.dependencies = dependencies; };

	this.init = function () {
		for ( var i = 0; i < this.variables.length; i ++ ) {

			var variable = this.variables[ i ];

			variable.renderTargets[ 0 ] = this.createRenderTarget( sizeX, sizeY, variable.wrapS, variable.wrapT, variable.minFilter, variable.magFilter );
			variable.renderTargets[ 1 ] = this.createRenderTarget( sizeX, sizeY, variable.wrapS, variable.wrapT, variable.minFilter, variable.magFilter );
			this.renderTexture( variable.initialValueTexture, variable.renderTargets[ 0 ] );
			this.renderTexture( variable.initialValueTexture, variable.renderTargets[ 1 ] );

			var material = variable.material;
			var uniforms = material.uniforms;
			if ( variable.dependencies !== null ) {
				for ( var d = 0; d < variable.dependencies.length; d ++ ) {
					var depVar = variable.dependencies[ d ];
					if ( depVar.name !== variable.name ) {
						var found = false;
						for ( var j = 0; j < this.variables.length; j ++ ) {
							if ( depVar.name === this.variables[ j ].name ) {
								found = true;
								break;
							}
						}
						if ( ! found ) return "Variable dependency not found. Variable=" + variable.name + ", dependency=" + depVar.name;
					}
					uniforms[ depVar.name ] = { value: null };
					material.fragmentShader = "\nuniform sampler2D " + depVar.name + ";\n" + material.fragmentShader;
				}
			}
		}
		this.currentTextureIndex = 0;
		return null;
	};

	this.compute = function () {
		var currentTextureIndex = this.currentTextureIndex;
		var nextTextureIndex = this.currentTextureIndex === 0 ? 1 : 0;

		for ( var i = 0, il = this.variables.length; i < il; i ++ ) {
			var variable = this.variables[ i ];
			if ( variable.dependencies !== null ) {
				var uniforms = variable.material.uniforms;
				for ( var d = 0, dl = variable.dependencies.length; d < dl; d ++ ) {
					var depVar = variable.dependencies[ d ];
					uniforms[ depVar.name ].value = depVar.renderTargets[ currentTextureIndex ].texture;
				}
			}
			this.doRenderTarget( variable.material, variable.renderTargets[ nextTextureIndex ] );
		}
		this.currentTextureIndex = nextTextureIndex;
	};

	this.getCurrentRenderTarget = function ( variable ) { return variable.renderTargets[ this.currentTextureIndex ]; };
	this.getAlternateRenderTarget = function ( variable ) { return variable.renderTargets[ this.currentTextureIndex === 0 ? 1 : 0 ]; };
	function addResolutionDefine( materialShader ) { materialShader.defines.resolution = 'vec2( ' + sizeX.toFixed( 1 ) + ', ' + sizeY.toFixed( 1 ) + " )"; }
	this.addResolutionDefine = addResolutionDefine;

	function createShaderMaterial( computeFragmentShader, uniforms ) {
		uniforms = uniforms || {};
		var material = new ShaderMaterial( { uniforms: uniforms, vertexShader: getPassThroughVertexShader(), fragmentShader: computeFragmentShader } );
		addResolutionDefine( material );
		return material;
	}

	this.createShaderMaterial = createShaderMaterial;

	this.createRenderTarget = function ( sizeXTexture, sizeYTexture, wrapS, wrapT, minFilter, magFilter ) {
		var renderTarget = new WebGLRenderTarget( sizeXTexture || sizeX, sizeYTexture || sizeY, {
			wrapS: wrapS || ClampToEdgeWrapping,
			wrapT: wrapT || ClampToEdgeWrapping,
			minFilter: minFilter || NearestFilter,
			magFilter: magFilter || NearestFilter,
			format: RGBAFormat,
			type: ( /(iPad|iPhone|iPod)/g.test( navigator.userAgent ) ) ? HalfFloatType : FloatType,
			stencilBuffer: false,
			depthBuffer: false
		} );
		return renderTarget;
	};

	this.createTexture = function () {
		var a = new Float32Array( sizeX * sizeY * 4 );
		var texture = new DataTexture( a, sizeX, sizeY, RGBAFormat, FloatType );
		texture.needsUpdate = true;
		return texture;
	};

	this.renderTexture = function ( input, output ) {
		passThruUniforms.passThruTexture.value = input;
		this.doRenderTarget( passThruShader, output );
		passThruUniforms.passThruTexture.value = null;
	};

	this.doRenderTarget = function ( material, output ) {
		var currentRenderTarget = renderer.getRenderTarget();
		mesh.material = material;
		renderer.setRenderTarget( output );
		renderer.render( scene, camera );
		mesh.material = passThruShader;
		renderer.setRenderTarget( currentRenderTarget );
	};
	function getPassThroughVertexShader() { return "void main() { gl_Position = vec4( position, 1.0 ); }";}
	function getPassThroughFragmentShader() { return "uniform sampler2D passThruTexture;void main() { vec2 uv = gl_FragCoord.xy / resolution.xy;	gl_FragColor = texture2D( passThruTexture, uv );}"; }
};

export { GPUComputationRenderer };