import p5 from 'p5'
import EventEmitter from 'event-emitter-es6'
import icons from './../assets/icons/*.png'
import ciutadella from './../assets/ciutadella_semibold.otf'
import birdPositions from './../assets/positions.json'


class ShapeCompute extends p5{

    static redirectP5Callbacks( p ) {
        p.preload = p.preload.bind( p ) // draw() has to be bind() like preload()
        p.draw = p.draw.bind( p ) // draw() has to be bind() like preload()
    }

    constructor( ){
        super( ShapeCompute.redirectP5Callbacks );
        this.spots = []
        this.settings = {
            totalSimultaneous : 1,
            radiusGrowth : 2,
            maxAttempts : 15,
            maxRadius : 5,
            maxCircles : 256,
            circleDistance : 1
        }
        this.currentWord = 0
        this.emitter = new EventEmitter()
        
    }

    preload( ){
        this.ciutadella = this.loadFont(ciutadella);
    }

    setup( ){
        this.width = 1024
        this.height = 300
        this.createCanvas( this.width, this.height ).id('p5canvas')
        this.pixelDensity( 1 )
        // this.makeText()
    }

    makeImage( icon ){
        this.loadImage( icons[ icon ], img => {
            this.background(0)
            this.fill(255, 255, 255)
            this.image( img, ( this.width - img.width ) / 2, ( this.height - img.height ) / 2 )
            this.computePixels()
        } )
    }

    deltaTransformPoint(matrix, point)  {
        return { x: point.x * matrix.a + point.y * matrix.c + 0, y: point.x * matrix.b + point.y * matrix.d + 0 };
    }


    decomposeMatrix(matrix) {
        var px = this.deltaTransformPoint(matrix, { x: 0, y: 1 });
        var py = this.deltaTransformPoint(matrix, { x: 1, y: 0 });
        var rotation = Math.atan2(px.y, px.x) + Math.PI / 2

        return {
            x: matrix.e,
            y: matrix.f,
            scale: ( Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b) + Math.sqrt(matrix.c * matrix.c + matrix.d * matrix.d) ) / 2,
            rotation: rotation // rotation is the same as skew x
        };        
    }

    makeText( text ){
        var words = [ 'MADI', 'IPSUM', 'DOLOR', 'SIT', 'AMET' ]
        var s = text || words[ this.currentWord ]
        this.background(0)
        this.fill(255, 255, 255)
        this.textSize(330)
        this.textFont(this.ciutadella)

        this.textAlign( this.LEFT, this.CENTER)
        // this.textAlign( this.CENTER, this.CENTER )
        // this.text( s , 0, 0, this.width, this.height)
        this.circles = []
        var positions = []
        var letters = s.split('')
        for( var i = 0 ; i < letters.length ; i++ ){
            this.background(0)  
            var text_array = []
            letters.forEach( ( letter, index ) => { 
                text_array.push( [ letter, ( ( index == i ) ? [ 255, 255, 255 ] : [ 0, 0, 0 ] ) ] )
            })
            var pos_x = 0;
            for ( var j = 0; j < text_array.length; ++ j ) {
                var part = text_array[j];
                var t = part[0],c = part[1],w = this.textWidth( t );
                this.fill( c )
                this.text( t, pos_x, 0, this.width, this.height)
                pos_x += w;
            }
            
            var ps = this.loadPixels()
           
            var minx = 100000
            for (var x = 0; x < this.width; x++){
                for (var y = 0; y < this.height; y++){
                    if ( this.brightness( [ this.pixels[ ( x + y * this.width ) * 4 ] ] ) >= 1 ) {
                        minx = Math.min( minx, x )
                    }
                }
            }
            
            var nodes = []
            for (var key in birdPositions.children) {
                var item = birdPositions.children[key];
                if( item.attributes.id ){
                    if( item.attributes.id.split('_')[0] == letters[ i ] ) {
                        item.children.forEach( node => {
                            nodes.push( node.attributes.transform ) 
                            var d = node.attributes.transform.match(/\(([^)]+)\)/)[1].split( ' ' )
                            var m = {
                                a : parseFloat( d[ 0 ] ),
                                b : parseFloat( d[ 1 ] ),
                                c : parseFloat( d[ 2 ] ),
                                d : parseFloat( d[ 3 ] ),
                                e : parseFloat( d[ 4 ] ) - 184 + minx / 2,
                                f : parseFloat( d[ 5 ] ) - 232
                            }
                            var t = this.decomposeMatrix( m )
                            this.circles.push( t )
                        })
                    }
                }
            }  
            positions.push( { letter : letters[ i ], offset : minx, nodes : nodes } )
        }

        this.emitter.emit( 'positionUpdate', this.circles, { w : this.width, h : this.height } )

        // if( this.currentWord < words.length - 1 ) this.currentWord ++ 
        // else this.currentWord = 0
    }

    computePixels(){
        // this.circles = []
        // this.spots = []
        // this.loadPixels()
        // for (var x = 0; x < this.width; x++) for (var y = 0; y < this.height; y++) if ( this.brightness( [ this.pixels[ ( x + y * this.width ) * 4 ] ] ) > 1 ) this.spots.push( this.createVector( x, y ) )
        // this.loop()
    }

    draw( ){
        // if( !this.spots.length ) return 
        // this.background( 0 )
        // var total = this.settings.totalSimultaneous
        // var count = 0
        // var attempts = 0
    
        // while ( count < total ) {
        //     var newC = this.newCircle()
        //     if (newC !== null) {
        //         this.circles.push( newC )
        //         count++
        //     }
        //     attempts++
        //     if ( attempts > this.settings.maxAttempts || this.circles.length == this.settings.maxCircles ) {
        //         this.noLoop()
        //         this.emitter.emit( 'positionUpdate', this.circles, { w : this.width, h : this.height } )
        //         break
        //     }
        // }
    
        // for (var i = 0; i < this.circles.length; i++) {
        //     var circle = this.circles[i];
        //     if (circle.growing) {
        //         if (circle.edges()) {
        //             circle.growing = false
        //         } else {
        //             for (var j = 0; j < this.circles.length; j++) {
        //                 var other = this.circles[j]
        //                 if (circle !== other) {
        //                     var d = this.dist(circle.x, circle.y, other.x, other.y)
        //                     var distance = circle.r + other.r
        
        //                     if (d - this.settings.circleDistance < distance || circle.r > this.settings.maxRadius ) {
        //                         circle.growing = false
        //                         break
        //                     }
        //                 }
        //             }
        //         }
        //     }
        //     this.stroke("white")
        //     this.strokeWeight(1)
        //     this.noFill()
        //     this.ellipse(circle.x, circle.y, circle.r * 2, circle.r * 2)
        //     circle.grow( this.settings.radiusGrowth )
        // }
    }

    // newCircle() {
    //     var r = this.int(this.random(0, this.spots.length))
    //     var spot = this.spots[r]
    //     var x = spot.x
    //     var y = spot.y
      
    //     var valid = true;
    //     for (var i = 0; i < this.circles.length; i++) {
    //         var circle = this.circles[i]
    //         var d = this.dist( x, y, circle.x, circle.y)
    //         if (d < circle.r) {
    //             valid = false
    //             break
    //         }
    //     }
    //     if (valid) return new Circle(x, y)
    //     else return null
    // }
}

// class Circle {
//     constructor( x, y ){
//         this.x = x
//         this.y = y
//         this.r = 1
//         this.growing = true
//     }
//     grow( r ) { if ( this.growing ) this.r += r }
//     edges() { return (this.x + this.r >= this.width || this.x - this.r <= 0 || this.y + this.r >= this.height || this.y - this.r <= 0) }
// }


export { ShapeCompute as default }