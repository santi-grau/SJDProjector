import p5 from 'p5'
import EventEmitter from 'event-emitter-es6'
import ciutadella from './../assets/ciutadella_semibold.otf'
import birdPositions from './../assets/positions.json'

class ShapeCompute extends p5{

    static redirectP5Callbacks( p ) {
        p.preload = p.preload.bind( p )
    }

    constructor( ){
        super( ShapeCompute.redirectP5Callbacks );
        this.emitter = new EventEmitter()
    }

    preload( ){
        this.ciutadella = this.loadFont(ciutadella);
    }

    setup( ){
        this.createCanvas( 1024, 300 ).id('p5canvas')
        this.pixelDensity( 1 )
    }

    makeImage( icon ){
        this.emitter.emit( 'positionUpdate', this.relocate( this.getCoords( { x : 0, y : 0 }, icon ) ) )
    }

    makeText( text ){
        this.background(0)
        this.fill( 255 )
        this.textSize(165)
        this.textFont(this.ciutadella)
        this.textAlign( this.LEFT, this.CENTER)

        var letterSpacing = 15
        var positions = []
        var letters = text.toUpperCase().split('')
        var px = 0;
        for( var i = 0 ; i < letters.length ; i++ ){
            this.text( letters[ i ], px, 0, this.width, this.height)
            positions = positions.concat( this.getCoords( { x : px, y : 0 }, letters[ i ] ) )
            px += this.textWidth( letters[ i ] ) + letterSpacing
        }
        positions = this.relocate( positions )
        this.emitter.emit( 'positionUpdate', positions )
    }

    relocate( ps ){
        var center = { x : 0, y : 0 }
        var scale = 0.32
        ps.forEach( p => center = { x : center.x + ( p.x * 1 / ps.length), y : center.y + ( p.y * 1 / ps.length ) } )
        ps.forEach( p => {
            p.x = ( p.x - center.x ) * scale
            p.y = ( p.y - center.y ) * scale
        } )
        return ps
    }

    getCoords( offset, id ){
        var ps = []
        for (var key in birdPositions.children) {
            var item = birdPositions.children[key];
            if( item.attributes.id && item.attributes.id.split('_')[0] == id ) {
                item.children.forEach( node => {
                    var d = node.attributes.transform.match(/\(([^)]+)\)/)[1].split( ' ' )
                    var m = {
                        a : parseFloat( d[ 0 ] ),
                        b : parseFloat( d[ 1 ] ),
                        c : parseFloat( d[ 2 ] ),
                        d : parseFloat( d[ 3 ] ),
                        e : parseFloat( d[ 4 ] ) + offset.x || 0,
                        f : parseFloat( d[ 5 ] ) + offset.y || 0
                    }   
                    ps.push( {
                        x: m.e,
                        y: m.f,
                        scale: ( Math.sqrt( m.a * m.a + m.b * m.b ) + Math.sqrt( m.c * m.c + m.d * m.d ) ) / 2,
                        rotation: Math.atan2( m.d, m.c ) + Math.PI / 2
                    } )
                })
            }
        }
        return ps
    }
}

export { ShapeCompute as default }