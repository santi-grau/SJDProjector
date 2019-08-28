import { Vector3, RepeatWrapping } from 'three'
import { GPUComputationRenderer } from './GPUComputationRender'
import shaders from './shaders/*.*'

class ComputationRender{
    constructor( renderer, birds ){
        this.tSize = birds
        this.renderer = renderer
        var WIDTH = birds
        this.last = performance.now()
        var BIRDS = WIDTH * WIDTH
        var BOUNDS = 1600
        this.gpuCompute = new GPUComputationRenderer( WIDTH, WIDTH, this.renderer )
        this.dtPosition = this.gpuCompute.createTexture()
        this.dtFormation = this.gpuCompute.createTexture()
        this.dtVelocity = this.gpuCompute.createTexture()
        this.fillPositionTexture( this.dtPosition, BOUNDS )
        this.fillFormationTexture( this.dtFormation )
        this.fillVelocityTexture( this.dtVelocity )
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
        this.velocityUniforms[ "separationDistance" ] = { value: 1.0 }
        this.velocityUniforms[ "alignmentDistance" ] = { value: 1.0 }
        this.velocityUniforms[ "cohesionDistance" ] = { value: 1.0 }
        this.velocityUniforms[ "freedomFactor" ] = { value: 0.0 }
        this.velocityUniforms[ "predator" ] = { value: new Vector3() }
        this.velocityUniforms[ "flyToTarget" ] = { value: false }
        this.velocityUniforms[ "formationTexture" ] = { value: this.dtFormation }
        this.velocityVariable.material.defines.BOUNDS = BOUNDS.toFixed( 2 )
        this.velocityVariable.wrapS = RepeatWrapping
        this.velocityVariable.wrapT = RepeatWrapping
        this.positionVariable.wrapS = RepeatWrapping
        this.positionVariable.wrapT = RepeatWrapping
        var error = this.gpuCompute.init()
        if ( error !== null ) console.error( error )
    }

    makeFormation( c, d ){
        var points = c
        var dims = d
        var theArray = this.dtFormation.image.data
        
        points.forEach( ( p, i ) => {
            theArray[ i * 4 ] = ( p.x - d.w / 2 ) / d.w * 512 * 0.643
            theArray[ i * 4 + 1 ] = -( p.y - d.h / 2 ) / d.h * 150 * 0.643
            theArray[ i * 4 + 2 ] = p.rotation
            theArray[ i * 4 + 3 ] = 1
        } )

        this.dtFormation.needsUpdate = true
    }

    undoFormation( ){
        var theArray = this.dtFormation.image.data
        
        for ( var k = 0, kl = theArray.length; k < kl; k += 4 ) {
            theArray[ k + 0 ] = ( Math.random() - 0.5 ) * 600
            theArray[ k + 1 ] = ( Math.random() - 0.5 ) * 400
            theArray[ k + 2 ] = 1
            theArray[ k + 3 ] = 0
        }

        this.dtFormation.needsUpdate = true
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

    fillVelocityTexture( texture ) {
        var theArray = texture.image.data
        for ( var k = 0, kl = theArray.length; k < kl; k += 4 ) {
            theArray[ k + 0 ] = ( Math.random() - 0.5 ) * 10
            theArray[ k + 1 ] = ( Math.random() - 0.5 ) * 10
            theArray[ k + 2 ] = ( Math.random() - 0.5 ) * 10
            theArray[ k + 3 ] = 1
        }
    }

    fillFormationTexture( texture ) {
        var theArray = texture.image.data
        for ( var k = 0, kl = theArray.length; k < kl; k += 4 ) {
            theArray[ k + 0 ] = ( Math.random() - 0.5 ) * 600
            theArray[ k + 1 ] = ( Math.random() - 0.5 ) * 400
            theArray[ k + 2 ] = 1
            theArray[ k + 3 ] = 0
        }
    }

    step( time ){
        var now = performance.now()
        var delta = Math.min( 1, ( now - this.last ) / 1000 )
        this.last = now
        this.positionUniforms[ "delta" ].value = delta
        this.velocityUniforms[ "delta" ].value = delta
        this.velocityUniforms[ "predator" ].value.set( 10000,10000, 0 )
        this.mouseX = 10000
        this.mouseY = 10000
        this.gpuCompute.compute()
    }
}

export { ComputationRender as default }