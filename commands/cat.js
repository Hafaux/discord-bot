const querystring = require("querystring");
const r2 = require("r2");
const { catAPIkey } = require("../config.json");

module.exports = {
    name: 'cat',
    description: 'mew!',
    usage: '',
    async execute(message) {
        var headers = {
            'X-API-KEY': catAPIkey,
        }
        var query_params = {
          'has_breeds':false, // we only want images with at least one breed data object - name, temperament etc
          'mime_types':'jpg,png', // we only want static images as Discord doesn't like gifs
          'sub_id': "pana", // pass the message senders username so you can see how many images each user has asked for in the stats
          'limit' : 1       // only need one
        }  

        let queryString = querystring.stringify(query_params);

        try {
            // construct the API Get request url
            let _url = "https://api.thecatapi.com/" + `v1/images/search?${queryString}`;
            // make the request passing the url, and headers object which contains the API_KEY
            var images = await r2.get(_url , {headers} ).json 
            var image = images[0];
            //var breed = image.breeds[0];
        
            // use the *** to make text bold, and * to make italic
            message.channel.send({ files: [ image.url ] } );
        } catch (e) {
            console.log(e)
        }
    }

}