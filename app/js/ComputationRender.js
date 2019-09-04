import { Vector2, Vector3, Vector4, RepeatWrapping } from 'three'
import { GPUComputationRenderer } from './GPUComputationRender'
import shaders from './shaders/*.*'


class ComputationRender{
    constructor( renderer, camera, tSize ){
        this.tSize = tSize
        this.camera = camera
        this.renderer = renderer

        this.last = performance.now()
        this.totalBirds = this.tSize * this.tSize
        this.inFormation = false
        this.active = []
        for( var i = 0 ; i < this.totalBirds ; i++ ) this.active.push( i )
        for(var j, x, i = this.active.length; i; j = parseInt(Math.random() * i), x = this.active[--i], this.active[i] = this.active[j], this.active[j] = x);
        this.active = this.active.splice( 0, this.totalBirds * 0.1 ).sort( (a, b) => a - b )
        
        this.gpuCompute = new GPUComputationRenderer( tSize, tSize, this.renderer )
        this.dtPosition = this.gpuCompute.createTexture()
        this.dtFormation = this.gpuCompute.createTexture()
        this.dtVelocity = this.gpuCompute.createTexture()
        this.fillPositionTexture()
        this.fillFormationTexture()
        this.fillVelocityTexture()
        this.velocityVariable = this.gpuCompute.addVariable( "textureVelocity", shaders.velocity.frag, this.dtVelocity )
        this.positionVariable = this.gpuCompute.addVariable( "texturePosition", shaders.position.frag, this.dtPosition )
        
        this.gpuCompute.setVariableDependencies( this.velocityVariable, [ this.positionVariable, this.velocityVariable ] )
        this.gpuCompute.setVariableDependencies( this.positionVariable, [ this.positionVariable, this.velocityVariable ] )
        this.positionUniforms = this.positionVariable.material.uniforms
        this.velocityUniforms = this.velocityVariable.material.uniforms
        this.positionUniforms[ "time" ] = { value: 0.0 }
        this.positionUniforms[ "delta" ] = { value: 0.0 }
        this.velocityUniforms[ "time" ] = { value: 1.0 }
        this.velocityUniforms[ "delta" ] = { value: 0.0 }
        this.velocityUniforms[ "predator" ] = { value: new Vector3() }
        this.velocityUniforms[ "flyToTarget" ] = { value: false }
        this.velocityUniforms[ "formationTexture" ] = { value: this.dtFormation }
        this.velocityUniforms[ "impulse" ] = { value: false }
        this.positionUniforms[ "formationTexture" ] = { value: this.dtFormation }
        this.positionUniforms[ "formationTimeline" ] = { value: 0 }
        this.velocityUniforms[ "formationTimeline" ] = { value: 0 }


        this.positionUniforms[ "screenSize" ] = { value : 
            new Vector2( 
                this.sizeAtDepth( 0, this.camera ).x, 
                this.sizeAtDepth( 0, this.camera ).y
            ) 
        }
        
        this.velocityVariable.wrapS = RepeatWrapping
        this.velocityVariable.wrapT = RepeatWrapping
        this.positionVariable.wrapS = RepeatWrapping
        this.positionVariable.wrapT = RepeatWrapping
        this.gpuCompute.init()

        this.formation = false
        this.formationTimeline = 0
    }

    sizeAtDepth( depth, camera ) {
        depth += camera.position.z * (( depth < camera.position.z ) ? -1 : 1)
        var h = 2 * Math.tan( camera.fov * Math.PI / 180 / 2 ) * Math.abs( depth )
        return { x : h * camera.aspect, y : h }
    };
      

    makeFormation( c ){
        if( this.inFormation ){
            this.undoFormation()
            if( this.formationTimeout ) clearTimeout( this.formationTimeout )
            this.formationTimeout = setTimeout( function(){ this.makeFormation( c ) }.bind( this ), 3000 )
            return
        }
        this.inFormation = true

        this.velocityUniforms.impulse.value = true

        this.formation = true
        var ps = []
        for ( var k = 0, kl = this.totalBirds * 4, i; k < kl; k += 4, i = k / 4 ) {
            if( c[ i ] ) {
                ps.push( c[ i ].x, -c[ i ].y, c[ i ].rotation, 1 )
            } else {
                var frustrumSize = this.sizeAtDepth( 0, this.camera )
                var a = Math.PI * 2 * ( ( i ) / ( this.totalBirds ) ) * 10
                var p = new Vector4( Math.cos( a ) * frustrumSize.x, Math.sin( a ) * frustrumSize.x, 0, 0 )
                ps.push( p.x, p.y, p.z, 1 )
            }
        }
        this.dtFormation.image.data = new Float32Array( ps )
        this.dtFormation.needsUpdate = true
    }

    undoFormation( ){
        this.velocityUniforms.impulse.value = false
        this.inFormation = false
        this.fillFormationTexture()
    }

    fillPositionTexture( ) {
        var ps = []
        for ( var k = 0, kl = this.totalBirds * 4, i = 0; k < kl; k += 4, i = k / 4 ) {
            var d = Math.random() * 250, frustrumSize = this.sizeAtDepth( d, this.camera )
            var a = Math.PI * 2 * ( ( i ) / ( this.totalBirds ) ) * 10
            var p = new Vector4( Math.cos( a ) * frustrumSize.x, Math.sin( a ) * frustrumSize.x, d, 0 )
            if( this.active.indexOf( i ) > -1 ) p = new Vector4( ( Math.random() - 0.5 ) * frustrumSize.x , ( Math.random() - 0.5 ) * frustrumSize.y, d, 0 )
            ps.push( p.x, p.y, p.z, p.w )
        }
        this.dtPosition.image.data = new Float32Array( ps )
    }

    fillFormationTexture( ) {
        var ps = []
        for ( var k = 0, kl = this.totalBirds * 4, i = 0; k < kl; k += 4, i = k / 4 ) {
            var d = Math.random() * 250, frustrumSize = this.sizeAtDepth( d, this.camera )
            var a = Math.PI * 2 * ( ( i ) / ( this.totalBirds ) ) * 10
            var p = new Vector4( Math.cos( a ) * frustrumSize.x, Math.sin( a ) * frustrumSize.x, d, 0 )
            if( this.active.indexOf( i ) > -1 ) p = new Vector4( ( Math.random() - 0.5 ) * frustrumSize.x , ( Math.random() - 0.5 ) * frustrumSize.y, d, 0 )
            ps.push( p.x, p.y, p.z, p.w )
        }
        this.dtFormation.image.data = new Float32Array( ps )
        this.dtFormation.needsUpdate = true
    }

    randomizeFormationTexture( ){
        if( this.inFormation ) return
        this.fillFormationTexture()
    }

    fillVelocityTexture( ) {
        var ps = []
        for ( var k = 0, kl = this.totalBirds * 4, i = 0; k < kl; k += 4, i = k / 4 ) {
            if( this.active.indexOf( i ) > -1 ) ps.push( ( Math.random() - 0.5 ) * 10, ( Math.random() - 0.5 ) * 10, ( Math.random() - 0.5 ) * 10, 0 )
            else ps.push(0.0, 0.0, 0.0, 0 )
        }
        this.dtVelocity.image.data = new Float32Array( ps )
    }

    

    step( time ){
        if( this.formation && this.formationTimeline < 1 ) this.formationTimeline += Math.min( 0.005, 1 - this.formationTimeline )
        this.positionUniforms[ "formationTimeline" ] = { value: this.formationTimeline }
        this.velocityUniforms[ "formationTimeline" ] = { value: this.formationTimeline }
        var now = performance.now()
        var delta = Math.min( 1, ( now - this.last ) / 1000 )
        this.last = now
        this.positionUniforms[ "delta" ].value = delta
        this.velocityUniforms[ "delta" ].value = delta
        this.gpuCompute.compute()
    }
}

export { ComputationRender as default }