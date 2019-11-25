var fs = require('fs');

let rawdata = fs.readFileSync('app/assets/positions.json');
let positions = JSON.parse(rawdata);

var data = {}

positions.children.forEach( node => { 
    if( node.attributes.id ){
        var id = node.attributes.id.split('_')[0]
        data[ id ] = []
        node.children.forEach( p => {
            if( p.attributes && p.attributes.transform ){
                // if( p.attributes.transform.includes('matrix') ){

                    var d = p.attributes.transform.match(/\(([^)]+)\)/)[1].split( ' ' )

                    var m = {
                        a : parseFloat( d[ 0 ] ),
                        b : parseFloat( d[ 1 ] ),
                        c : parseFloat( d[ 2 ] ),
                        d : parseFloat( d[ 3 ] ),
                        e : parseFloat( d[ 4 ] ),
                        f : parseFloat( d[ 5 ] )
                    }   
                    data[ id ].push( {
                        x: m.e,
                        y: m.f,
                        scale: ( Math.sqrt( m.a * m.a + m.b * m.b ) + Math.sqrt( m.c * m.c + m.d * m.d ) ) / 2,
                        rotation: Math.atan2( m.d, m.c ) + Math.PI / 2
                    } )
                // } else {
                    
                //     var d = p.attributes.transform.match(/\(.*?\)/g)
                    
                //     var s = 0
                //     if( d[2] ) s = d[2].match(/\(([^)]+)\)/)[1].split( ' ' )[0]

                //     var r = 0 
                //     if( d[1] ) r = d[1].match(/\(([^)]+)\)/)[1].split( ' ' )[0] * Math.PI / 180
                    
                //     var p = d[0].match(/\(([^)]+)\)/)[1].split( ' ' )
                    
                    

                //     data[ id ].push( {
                //         x: parseFloat( p[0] ),
                //         y: parseFloat( p[1] ),
                //         scale: parseFloat( s ),
                //         rotation: parseFloat( r )
                //     } )
                // }
                
            }
        })
    }
})


fs.writeFile("./positions.json", JSON.stringify(data, null, 2), function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("Data saved");
}); 