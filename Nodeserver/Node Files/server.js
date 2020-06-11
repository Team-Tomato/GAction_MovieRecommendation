const express = require("express");
const bodyParser = require("body-parser");
const {
    dialogflow,
    Permission,
    Suggestions,
  } = require('actions-on-google');
const server = express();
const app = dialogflow({debug: true});

server.set('port', process.env.PORT || 5000);
server.use(bodyParser.json({type: 'application/json'}));

//Handle the Dialogflow intent named 'Default Welcome Intent'   
app.intent('Default Welcome Intent', (conv) => {
    //conv.user.storage={};
    const name = conv.user.storage.userName;
    conv.ask(`Welcome to Movie Recommendation System\nThe List of Possible Options :\n (A)Recommendation for New user \n (B)Recommendation for Existing User \n (C)Recommendation based on Random Movies\n Say which category you are?`);
    conv.ask(new Suggestions('A','B','C'));
    });

//Handle the Dialogflow intent named 'Default Welcome Intent - option_a'   
app.intent('Default Welcome Intent - option_a', (conv) => {
      conv.user.storage={};
    const name = conv.user.storage.userName;
    if(!name){
      conv.ask(new Permission({
        context: 'To get to know you better',
        permissions: 'NAME'
      }));
    }
    });

//Handle the Dialogflow intent named 'Default Welcome Intent - option_b'
app.intent('Default Welcome Intent - option_b', (conv) => {
    const name = conv.user.storage.userName;
    if(!name){
        conv.ask(`You have choosed Recommendation for existing user but you are not an existing user, Please choose a correct option`);
        conv.ask(new Suggestions('Option A'));
  
    }
    else{
      conv.ask(`Hi again, ${name}. How can I help you?`);
      conv.ask(new Suggestions('Suggest a movie','Suggest a film','Suggest a cinema'));
    }
    });
  
//Handle the Dialogflow intent named 'Default Welcome Intent - option_c'
    app.intent('Default Welcome Intent - option_c', (conv) => {
      conv.ask(`You have choosed Recommendation based on random given movies\nSay some movies based on which we suggest`);
    });  
    
// Handle the Dialogflow intent named 'actions_intent_PERMISSION'. If user
// agreed to PERMISSION prompt, then boolean value 'permissionGranted' is true.
app.intent('actions_intent_PERMISSION', (conv, params, permissionGranted) => {
      if (!permissionGranted) {
        conv.ask(`Ok, no worries. What is your favorite language??`);
        conv.ask(new Suggestions('Tamil','English','Hindi','Malayalam'));
      } else {
        conv.user.storage.userName = conv.user.name.display;
        conv.ask(`Thanks, ${conv.user.storage.userName}. What is your favorite language?`);
        conv.ask(new Suggestions('Tamil','English','Hindi','Malayalam'));
      }
    });

// Handle the Dialogflow intent named 'user_favorite_language'.
// The intent collects a parameter named 'language'.
app.intent('user_favorite_language', (conv, {language}) => {
   conv.user.storage.language = language;
      // request for user genre
      if (conv.user.storage.userName) {
          conv.ask(`Cool! ${conv.user.storage.userName}, What is your favorite genre?`);
          conv.ask(new Suggestions('Thriller','Drama','Comedy','Action','Romance'));
        } else {
          conv.ask(`Cool! What is your favorite genre?`);      
          conv.ask(new Suggestions('Thriller','Drama','Comedy','Action','Romance'));       }
  });
  
// Handle the Dialogflow intent named 'user_favorite_genre'.
// The intent collects a parameter named 'movie_genre'.
app.intent('user_favorite_genre', (conv, {movie_genre}) => {
   const lang = conv.user.storage.language;
   conv.user.storage.movie_genre = movie_genre;
   var rp = require('request-promise-native');
   var options = {
    uri:`https://movie-recommender-teamtomato.herokuapp.com/api/v1/movie/genre?language=${lang}&genre=${movie_genre}`,
    json: true // Automatically parses the JSON string in the response
  };   
      if (conv.user.storage.userName) { 
        return rp(options)
         .then( response => {
          // The response will be a JSON object already. Do whatever with it.
          console.log( 'response:', JSON.stringify(response,null,1) );
          var value = response[0];  
          return conv.close(`${conv.user.storage.userName}, The suggested movie is ${value}`);
        });
        } 
      else {
        return rp(options)
        .then( response => {
         // The response will be a JSON object already. Do whatever with it.
         console.log( 'response:', JSON.stringify(response,null,1) );
         var value = response[0];  
         return conv.close(`The suggested movie is ${value}`);
       });      
       }
  });
  
// Handle the Dialogflow intent named 'Recommendation for Existing User'.
// The intent collects a parameter named 'request'.
app.intent('recommendation_for_existing_user', (conv, {request}) => {
  var rp = require('request-promise-native');
   var options = {
    uri:`https://movie-recommender-teamtomato.herokuapp.com/api/v1/movie/rating`,
    json: true // Automatically parses the JSON string in the response
  };
  return rp(options)
         .then( response => {
          // The response will be a JSON object already. Do whatever with it.
          console.log( 'response:', JSON.stringify(response,null,1) );
          var value = response[0];  
          return conv.close(`${conv.user.storage.userName}, The suggested movie is ${value}`);
        });
 });

// Handle the Dialogflow intent named 'suggestion_based_on_movie'.
// The intent collects a parameter named 'movie'. 
app.intent('suggestion_based_on_movie', (conv, {movie}) => {
  var rp = require('request-promise-native');
  let api_url=`https://movie-recommender-teamtomato.herokuapp.com/api/v1/movie/cosine?`;
  for(let mov of movie)
  {
    api_url +=`search_str=${mov}&`;
  }
  var options = {
   uri: api_url,
   json: true // Automatically parses the JSON string in the response
 };
    if (conv.user.storage.userName) {
      return rp(options)
         .then( response => {
          // The response will be a JSON object already. Do whatever with it.
          console.log( 'response:', JSON.stringify(response,null,1) );
          var value = response[0];  
          return conv.close(`${conv.user.storage.userName}, The suggested movie is ${value}`);
        });
       }
   else {
    return rp(options)
    .then( response => {
     // The response will be a JSON object already. Do whatever with it.
     console.log( 'response:', JSON.stringify(response,null,1) );
     var value = response[0];  
     return conv.close(`The suggested movie is ${value}`);
   }); 
   } 
});

server.post('/', app);
server.get("/", (req, res) => { 
  res.send("CONFIRMED RECEIPT OF GET.");
});

server.listen(server.get('port'), function () {
	console.log('Express server started on port', server.get('port'));
});
