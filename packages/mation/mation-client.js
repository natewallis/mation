
Mation = function (){

  this.desiredResolutions = [
    {desiredWidth:1920, desiredHeight:1080},
    {desiredWidth:1280, desiredHeight:720},
    {desiredWidth:640, desiredHeight:480}
  ];

  this.currentlySyncing = false;
  this.frameTotal = 0;
  this.framesSynced = 0;
  this.images = [];
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

  document.addEventListener ("keypress", function(event){
    if (event.target.tagName.toLowerCase() !== 'input' && event.target.tagName.toLowerCase() != 'textarea'){
      if (event.keyCode == 32) this.captureFrame();
      if (event.keyCode == 100 || event.keyCode == 68) this.deleteFrame();
    }
  }.bind(this), false);

  document.getElementById('get-started').addEventListener('click', this.getStarted);

  $("#uploadButton").click(function handleAuthClick(event) {
    this.encodeVideo();
  }.bind(this));

  /*$("#previewButton").click(function(e){
    this.showPreview();
    }.bind(this));

    $("#onionButton1").click(function(e){this.setOnions(1);});
    $("#onionButton2").click(function(e){this.setOnions(2);});
    $("#onionButton3").click(function(e){this.setOnions(3);});
    $("#onionOff").click(function(e){this.setOnions(0);});*/

  $("#sync-status").hide();
  $("#publishContainer").hide();
  $("#previewContainer").hide();
  $("#publishScreen").hide();

  this.updateFramesToGo();

};

Mation.ENCODE_FRAMERATE = 24;
Mation.API_KEY = 'AIzaSyBMhflY8nb0z9SAU1Ff7AkDyVyoDVXEMxA';
Mation.CLIENT_ID = '809043913106-hda8s2ho0enhcnoeecus3q8gc6fcnf62.apps.googleusercontent.com';
Mation.AUTH_SCOPE = 'https://www.googleapis.com/auth/youtube';
Mation.ENCODE_STEPS = 3;
Mation.PREVIEW_WIDTH = 200;
Mation.PUBLISH_REVEAL_TIME = 200;
Mation.PREVIEW_HEIGHT = 113;
Mation.NUMBER_OF_ONION_SKINS = 3;
Mation.FRAMES_REQUIRED_FOR_PUBLISH = 50;

Mation.prototype.getStarted = function(){
  mation.setupCanvasAndWebcam('webcamCanvas', 'webcam');
};

Mation.prototype.setupCanvasAndWebcam = function (canvasElementId, webcamElementId){
  this.videoWidth = Mation.ENCODE_WIDTH;
  this.videoHeight = Mation.ENCODE_HEIGHT;
  this.canvas = document.getElementById(canvasElementId);
  this.previewCanvas = document.getElementById('previewCanvas');
  this.previewPlayer = document.getElementById('preview');
  this.tryNextLowestResolution(); 
};

Mation.prototype.tryNextLowestResolution = function(){
  var desiredResolution = this.desiredResolutions.shift();  
  this.webcamOptions = {
    onSuccess:function(localMediaStream, videoElement) { 
      this.video = videoElement; 
      this.video.onloadedmetadata = function (e){
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        this.previewCanvas.width = Mation.PREVIEW_WIDTH;
        this.previewCanvas.height = Mation.PREVIEW_HEIGHT;
        this.previewContext = this.previewCanvas.getContext("2d");
        this.ctx = this.canvas.getContext("2d");
        $("#bootScreen").slideUp();
      }.bind(this);
      this.video.src = window.URL.createObjectURL(localMediaStream); 
    }.bind(this),
    onFail:function(e){
      console.log(e);
      this.tryNextLowestResolution();
    }.bind(this)
  };

  document.getElementById('init').style.display = 'block';
  this.startWebcam (desiredResolution.desiredWidth, desiredResolution.desiredHeight);
}

Mation.prototype.startWebcam = function(desiredWidth, desiredHeight){
  this.webcamOptions.desiredWidth = desiredWidth;
  this.webcamOptions.desiredHeight = desiredHeight;
  Webcam.set(this.webcamOptions);
  Webcam.setSWFLocation("fallback/webcam.swf");
  Webcam.attach('webcam');

};

Mation.prototype.refreshOnions = function (){
  var onionCount = 1;
  for (var copyCount=this.frameTotal-1; copyCount>=Math.max(this.frameTotal - Mation.NUMBER_OF_ONION_SKINS, 0); copyCount--){
    var onionSkinElement = document.getElementById('onion' + onionCount);
    onionSkinElement.innerHTML = "";
    var img = document.createElement('img');
    img.src = this.images[copyCount].inlineImageData;
    onionSkinElement.appendChild(img);
    onionCount++;
  }
};

Mation.prototype.showPreview = function(){
  if (this.previewInterval == undefined){ 
    this.previewFrame = -1; 
    this.previewInterval = setInterval(function(){
      this.previewFrame++;
      if (this.images.length > 0){
        $("#previewContainer").show();
        if (this.previewFrame >= this.images.length) {
          this.previewFrame = 0;
        }
        this.previewPlayer.src = this.images[this.previewFrame].previewInlineImageData;
      }else{
        clearInterval(this.previewInterval);
        this.previewInterval = undefined;
        $("#previewContainer").hide();
      }
    }.bind(this),1000 / Mation.ENCODE_FRAMERATE);
  }
}

Mation.prototype.getStepPercentage = function(){
  return Math.floor(100 / ENCODE_STEPS) 
};

Mation.prototype.getBasePercentage = function(stepNumber){
  return getStepPercentage() * (stepNumber - 1);
};

Mation.prototype.setOnions = function(amount){
  //if (amount > 0) this.refreshOnions();
  for (var onionCount=1; onionCount<=Mation.NUMBER_OF_ONION_SKINS; onionCount++){
    if (onionCount <= amount){
      document.getElementById('onion' + onionCount).style.display = 'block';
    }else{
      document.getElementById('onion' + onionCount).style.display = 'none';
    }
  }
};

Mation.prototype.deleteFrame = function(e){
  if (this.images.length > 0){
    this.frameTotal--;
    this.framesSynced--;
    this.updateFramesToGo();
    if (this.frameTotal < 0) this.frameTotal = 0;
    if (this.framesSynced < 0) this.framesSynced = 0;
    var deletedImage = this.images.pop();
    if (this.framesSynced < Mation.FRAMES_REQUIRED_FOR_PUBLISH) $("#publishContainer").hide(Mation.PUBLISH_REVEAL_TIME);
  }
}

Mation.prototype.captureFrame = function(){
  this.showPreview();
  var scaleFactor = Mation.PREVIEW_HEIGHT / this.video.videoHeight;
  var newWidth = this.video.videoWidth * scaleFactor;
  var newHeight = this.video.videoHeight * scaleFactor;
  this.ctx.drawImage(this.video, 0, 0, this.video.videoWidth, this.video.videoHeight);
  this.previewContext.drawImage(this.video, 0, 0, this.video.videoWidth, this.video.videoHeight, (Mation.PREVIEW_WIDTH - newWidth) / 2 ,0,newWidth, newHeight);
  this.images.push(new MationFile({
    inlineImageData:this.canvas.toDataURL("image/jpeg"),
    previewInlineImageData:this.previewCanvas.toDataURL("image/jpeg"),
    frameNumber: this.frameTotal,
    serverSynced: false 
  }));
  this.frameTotal++;
  this.flagAnimationAsDirty();
  //this.refreshOnions();
};

Mation.prototype.handleAuthResult = function(authResult) {
  if(authResult.access_token) {
  }
};

Mation.prototype.encodeVideo = function(){
  $("#publishScreen").slideDown();
  Meteor.call ("encodeVideo", 24, Meteor.connection._lastSessionId,function (error, result){
    if (result){
      Meteor.call ("publishVideo", $("#mationName").val(), $("#mationDescription").val(),Meteor.connection._lastSessionId, function (error, result){
        if (error){
          console.log(error);
        }else if(result){
          $("#publish-spinner").hide();
          $("#publish-output").html("<p class='bootScreenMantra'>Congratulations - Your video is now public. You have also created your own GIF which you can see below. Animated GIFs are reduced to 10fps to reduce file size</p><img src='http://media.mation.me/?id="+Meteor.connection._lastSessionId+"'><p class='bootScreenMantra'><a target='_blank' href='https://www.youtube.com/watch?v=" + result.id + "'>Watch your Youtube video here</a></p>");
        }
      }.bind(this));
    }
  }.bind(this));
};

Mation.prototype.flagAnimationAsClean = function(){
  $("#sync-status").hide();
}

Mation.prototype.flagAnimationAsDirty = function(){

  if (this.currentlySyncing) return;

  $("#sync-status").show();
  for (var imageCount=0; imageCount < this.images.length; imageCount++){
    this.imageToUpload = this.images[imageCount];
    if (!this.imageToUpload.serverSynced) {
      this.currentlySyncing = true;
      break;
    }
  }

  Meteor.call ("uploadFile", this.imageToUpload, Meteor.connection._lastSessionId,function (error, result){
    if (error){
      console.log(error);
    }else{
      delete this.images[result].inlineImageData;
      this.images[result].serverSynced = true;
      this.framesSynced++;
      this.updateFramesToGo();
      this.currentlySyncing = false;
      if (this.framesSynced == this.frameTotal) {
        this.flagAnimationAsClean();
      }else{
        this.flagAnimationAsDirty();
      }
      if (this.framesSynced >= Mation.FRAMES_REQUIRED_FOR_PUBLISH) $("#publishContainer").show(Mation.PUBLISH_REVEAL_TIME);
    }
  }.bind(this));

};

Mation.prototype.updateFramesToGo = function(){
  var framesToGo = (Mation.FRAMES_REQUIRED_FOR_PUBLISH - this.framesSynced);
  if (framesToGo < 1){
    $("#frames-to-go").hide();
  }else{
    $("#frames-to-go").show();
    $("#frames-to-go").text( framesToGo + " frames till you can publish");
  }
}


Mation.closeDownload = function() {
  clearTimeout( progressTimer );
  dialog.dialog( "close" );
  progressbar.progressbar( "value", false );
  progressLabel.text( "Starting download..." );
};

