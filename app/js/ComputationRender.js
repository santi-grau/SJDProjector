import { Vector3, RepeatWrapping } from 'three'
import { GPUComputationRenderer } from './GPUComputationRender'
import shaders from './shaders/*.*'

class ComputationRender{
    constructor( renderer, birds ){
        this.renderer = renderer
        var WIDTH = birds
        this.last = performance.now()
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
        this.velocityUniforms[ "predator" ] = { value: new Vector3() }
        this.velocityVariable.material.defines.BOUNDS = BOUNDS.toFixed( 2 )
        this.velocityVariable.wrapS = RepeatWrapping
        this.velocityVariable.wrapT = RepeatWrapping
        this.positionVariable.wrapS = RepeatWrapping
        this.positionVariable.wrapT = RepeatWrapping
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
        this.now = performance.now()
        var delta = ( this.now - this.last ) / 1000
        if ( delta > 1 ) delta = 1 // safety cap on large deltas
        this.last =this.now
        this.positionUniforms[ "time" ].value = this.now
        this.positionUniforms[ "delta" ].value = delta
        this.velocityUniforms[ "time" ].value = this.now
        this.velocityUniforms[ "delta" ].value = delta
        // this.birdUniforms[ "time" ].value = now
        // this.birdUniforms[ "delta" ].value = delta
        this.velocityUniforms[ "predator" ].value.set( 10000,10000, 0 )
        this.mouseX = 10000
        this.mouseY = 10000
        this.gpuCompute.compute()
    }
}

export { ComputationRender as default }