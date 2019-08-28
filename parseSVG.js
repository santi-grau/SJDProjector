var fs = require('fs');
const { parse, stringify } = require('svgson');

fs.readFile('app/assets/positions.svg', 'utf8', function(err, contents) {
    parse(contents).then( json => {

        fs.writeFile("app/assets/positions.json", JSON.stringify(json, null, 2), function(err) {
            if(err) {
                return console.log(err);
            }
        
            console.log("The file was saved!");
        }); 


        
        console.log('parsed SVG');
    })
});
 
