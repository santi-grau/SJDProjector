import p5 from 'p5'
import EventEmitter from 'event-emitter-es6'
import icons from './../assets/icons/*.png'

class Circle {
    constructor( x, y ){
        this.x = x
        this.y = y
        this.r = 1
        this.growing = true
    }
    grow( r ) { if ( this.growing ) this.r += r }
    edges() { return (this.x + this.r >= this.width || this.x - this.r <= 0 || this.y + this.r >= this.height || this.y - this.r <= 0) }
}

class ShapeCompute extends p5{

    static redirectP5Callbacks( p ) {
        p.draw = p.draw.bind( p ) // draw() has to be bind() like preload()
    }

    constructor( ){
        super()
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
        super( ShapeCompute.redirectP5Callbacks );
    }

    setup( ){
        this.width = 1024
        this.height = 200
        this.createCanvas( this.width, this.height ).id('p5canvas')
        
    }

    makeImage( icon ){
        this.loadImage( icons[ icon ], img => {
            this.background(0)
            this.fill(255, 255, 255)
            this.image( img, ( this.width - img.width ) / 2, ( this.height - img.height ) / 2 )
            this.computePixels()
        } )
    }

    makeText( text ){
        var words = [ 'LOREM', 'IPSUM', 'DOLOR', 'SIT', 'AMET' ]
        var s = text || words[ this.currentWord ]
        this.background(0)
        this.fill(255, 255, 255)
        this.textSize(180)
        
        this.textAlign( this.CENTER, this.CENTER )
        this.text( s , 0, 0, this.width, this.height)
        this.computePixels()
        if( this.currentWord < words.length - 1 ) this.currentWord ++ 
        else this.currentWord = 0
    }

    computePixels(){
        this.circles = []
        this.spots = []
        this.loadPixels()
        for (var x = 0; x < this.width; x++) for (var y = 0; y < this.height; y++) if ( this.brightness( [ this.pixels[ ( x + y * this.width ) * 4 ] ] ) > 1 ) this.spots.push( this.createVector( x, y ) )
        this.loop()
    }

    draw( ){
        if( !this.spots.length ) return 
        this.background( 0 )
        var total = this.settings.totalSimultaneous
        var count = 0
        var attempts = 0
    
        while ( count < total ) {
            var newC = this.newCircle()
            if (newC !== null) {
                this.circles.push( newC )
                count++
            }
            attempts++
            if ( attempts > this.settings.maxAttempts || this.circles.length == this.settings.maxCircles ) {
                this.noLoop()
                this.emitter.emit( 'positionUpdate', this.circles, { w : this.width, h : this.height } )
                break
            }
        }
    
        for (var i = 0; i < this.circles.length; i++) {
            var circle = this.circles[i];
            if (circle.growing) {
                if (circle.edges()) {
                    circle.growing = false
                } else {
                    for (var j = 0; j < this.circles.length; j++) {
                        var other = this.circles[j]
                        if (circle !== other) {
                            var d = this.dist(circle.x, circle.y, other.x, other.y)
                            var distance = circle.r + other.r
        
                            if (d - this.settings.circleDistance < distance || circle.r > this.settings.maxRadius ) {
                                circle.growing = false
                                break
                            }
                        }
                    }
                }
            }
            this.stroke("white")
            this.strokeWeight(1)
            this.noFill()
            this.ellipse(circle.x, circle.y, circle.r * 2, circle.r * 2)
            circle.grow( this.settings.radiusGrowth )
        }
    }

    newCircle() {
        var r = this.int(this.random(0, this.spots.length))
        var spot = this.spots[r]
        var x = spot.x
        var y = spot.y
      
        var valid = true;
        for (var i = 0; i < this.circles.length; i++) {
            var circle = this.circles[i]
            var d = this.dist( x, y, circle.x, circle.y)
            if (d < circle.r) {
                valid = false
                break
            }
        }
        if (valid) return new Circle(x, y)
        else return null
    }
}

export { ShapeCompute as default }