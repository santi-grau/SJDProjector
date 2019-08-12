import p5 from 'p5';

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

    constructor( data ){
        super()
        this.circles = []
        this.spots = []
        this.data = data
        this.settings = {
            totalSimultaneous : 2,
            radiusGrowth : 1,
            maxAttempts : 15,
            maxRadius : 8,
            circleDistance : 1
        }
        super( ShapeCompute.redirectP5Callbacks );
    }

    // preload(){
    //     img = sk.loadImage( im )
	// }

    setup( ){
        var width = 1024, height = 200
        this.createCanvas( width, height ).id('p5canvas')
        this.background(0)
        this.textSize(180)
        this.fill(255, 255, 255)
        this.textAlign( this.CENTER, this.CENTER )
        this.text( this.data , 0, 0, width, height)
        this.loadPixels()
        for (var x = 0; x < width; x++) for (var y = 0; y < height; y++) if ( this.brightness( [ this.pixels[ ( x + y * width ) * 4 ] ] ) > 1 ) this.spots.push( this.createVector( x, y ) )
    }

    draw( ){
        this.background( 0 )
        var total = this.settings.totalSimultaneous
        var count = 0
        var attempts = 0
    
        while (count < total) {
            var newC = this.newCircle()
            if (newC !== null) {
                this.circles.push( newC )
                count++
            }
            attempts++
            if ( attempts > this.settings.maxAttempts ) {
                this.noLoop()
                console.log("finished")
                console.log( this.circles )
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