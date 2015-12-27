Future = Npm.require('fibers/future');

Meteor.methods({

  uploadFile: function (file) {
    var fut = new Future();
    file.save('/Users/nathanwallis/Desktop/temp/mation', {}, function(err){
      if (err){
        fut.throw(err);
      }else{
        fut.return(file.frameNumber);
      }
    });
    return fut.wait();
  },

  encodeVideo: function(frameRate){
    var exec = Npm.require('child_process').exec;
    var fut = new Future();
    var command = "ffmpeg -r " + frameRate + "  -i /Users/nathanwallis/Desktop/temp/mation/session/image-%0" + MationFile.NUMBER_OF_ZEROS_FOR_PADDING + "d.jpg -y /Users/nathanwallis/Desktop/temp/mation/video." + MationFile.VIDEO_OUTPUT_EXTENSION;
    exec (command, function(error, stdout, stderr){
      if (error) {
        fut.throw(error);
      }else{
        fut.return(true);
      }
    });

    return fut.wait();
  },

  publishVideo: function(){
    //log job with kue here
    //return to user   
    var fut = new Future();
    var key = Npm.require('/Users/nathanwallis/Downloads/client_secret_1015934107435-nqbrhbe5eqlvqtdjqj5l3524r37jbrqk.apps.googleusercontent.com.json');
    var tokens = Npm.require('/Users/nathanwallis/Desktop/temp/mation/tokens.json');
    var Google = Npm.require('googleapis');
    var Youtube = Google.youtube("v3");
    var Fs = Npm.require('fs');
    var oauth = new Google.auth.OAuth2(key.installed.client_id, key.installed.client_secret, 'http://localhost:5000/oauth2callback');
    oauth.setCredentials(tokens);

    Google.options({auth:oauth});
    console.log(oauth);

    Youtube.videos.insert({
      resource: {
        snippet: {
          title: "Testing YoutTube API NodeJS module"
      , description: "Test video upload via YouTube API"
        }
      , status: {
    privacyStatus: "private"
      }
      }
      , part: "snippet,status"

      , media: {
    body: Fs.createReadStream("/Users/nathanwallis/Desktop/temp/mation/video.mp4")
      }
    }, function (err, data) {
      if(err) {
        fut.throw(err);
      }else{
        fut.return(data); 
      }
    });

    return fut.wait();
  }

});
