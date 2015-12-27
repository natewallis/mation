Mation = function (){
  
  this.desiredResolutions = [
    {desiredWidth:1920, desiredHeight:1080},
    {desiredWidth:1280, desiredHeight:720},
    {desiredWidth:640, desiredHeight:480}
  ];

  this.frameTotal = 0;
  this.framesSynced = 0;
  this.images = [];
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

  document.addEventListener ("keydown", function(event){
    if (event.keyCode == 32) this.captureFrame();
  }.bind(this), false);

  document.getElementById('get-started').addEventListener('click', this.getStarted);

  $("#uploadButton").click(function handleAuthClick(event) {
    this.encodeVideo();
  }.bind(this));

  $("#captureButton").click(function(e){
    this.captureFrame();
  }.bind(this));

  $("#previewButton").click(function(e){
    this.showPreview();
  }.bind(this));

  $("#onionButton1").click(function(e){this.setOnions(1);});
  $("#onionButton2").click(function(e){this.setOnions(2);});
  $("#onionButton3").click(function(e){this.setOnions(3);});
  $("#onionOff").click(function(e){this.setOnions(0);});

  $("#sync-status").hide();

};

Mation.ENCODE_FRAMERATE = 24;
Mation.API_KEY = 'AIzaSyBMhflY8nb0z9SAU1Ff7AkDyVyoDVXEMxA';
Mation.CLIENT_ID = '809043913106-hda8s2ho0enhcnoeecus3q8gc6fcnf62.apps.googleusercontent.com';
Mation.AUTH_SCOPE = 'https://www.googleapis.com/auth/youtube';
Mation.ENCODE_STEPS = 3;
Mation.PREVIEW_WIDTH = 500;
Mation.PREVIEW_HEIGHT = 281;
Mation.NUMBER_OF_ONION_SKINS = 3;

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
        console.log(this.video.videoWidth);
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
  console.log(desiredWidth, desiredHeight);
  this.webcamOptions.width = desiredWidth;
  this.webcamOptions.height = desiredHeight;
  Webcam.set(this.webcamOptions);
  Webcam.setSWFLocation("fallback/webcam.swf");
  Webcam.attach('webcamContainer');

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
  if (this.previewInterval) clearInterval(this.previewInterval);
  this.previewFrame = -1; 
  this.previewPlayer.style.display = 'block';
  this.previewInterval = setInterval(function(){
    this.previewFrame++;
    if (this.previewFrame == this.images.length) {
      clearInterval(this.previewInterval);
      this.previewPlayer.style.display = 'none';
      return;
    }
    this.previewPlayer.src = this.images[this.previewFrame].previewInlineImageData;
  }.bind(this),1000 / Mation.ENCODE_FRAMERATE);
}

Mation.prototype.getStepPercentage = function(){
  return Math.floor(100 / ENCODE_STEPS) 
};

Mation.prototype.getBasePercentage = function(stepNumber){
  return getStepPercentage() * (stepNumber - 1);
};

Mation.prototype.setOnions = function(amount){
  if (amount > 0) this.refreshOnions();
  for (var onionCount=1; onionCount<=Mation.NUMBER_OF_ONION_SKINS; onionCount++){
    if (onionCount <= amount){
      document.getElementById('onion' + onionCount).style.display = 'block';
    }else{
      document.getElementById('onion' + onionCount).style.display = 'none';
    }
  }
};

Mation.prototype.captureFrame = function(){
  this.ctx.drawImage(this.video, 0, 0, this.video.videoWidth, this.video.videoHeight);
  this.previewContext.drawImage(this.video, 0, 0, this.video.videoWidth, this.video.videoHeight, 0,0,Mation.PREVIEW_WIDTH, Mation.PREVIEW_HEIGHT);
  this.images.push(new MationFile({
    inlineImageData:this.canvas.toDataURL("image/jpeg"),
    previewInlineImageData:this.previewCanvas.toDataURL("image/jpeg"),
    frameNumber: this.frameTotal,
    serverSynced: false 
  }));
  this.frameTotal++;
  this.flagAnimationAsDirty();
  this.refreshOnions();
};

Mation.prototype.handleAuthResult = function(authResult) {
  if(authResult.access_token) {
  }
};

Mation.prototype.encodeVideo = function(){
  Meteor.call ("encodeVideo", 24, function (error, result){
    if (result){
      Meteor.call ("publishVideo", function (error, result){
        console.log(error);
        console.log(result);
      }.bind(this));
    }
  }.bind(this));
};

Mation.prototype.flagAnimationAsClean = function(){
  $("#sync-status").hide();
}

Mation.prototype.flagAnimationAsDirty = function(){
  $("#sync-status").show();
  for (var imageCount=0; imageCount < this.images.length; imageCount++){
    this.imageToUpload = this.images[imageCount];
    if (!this.imageToUpload.serverSynced) break;
  }

  Meteor.call ("uploadFile", this.imageToUpload, function (error, result){
    if (error){
      console.log(error);
    }else{
      console.log(result);
      delete this.images[result].inlineImageData;
      this.images[result].serverSynced = true;
      this.framesSynced++;
      $("#sync-percentage").html((Math.floor(this.framesSynced / this.frameTotal)) * 100 + "%");
      if (this.framesSynced == this.frameTotal) this.flagAnimationAsClean();
    }
  }.bind(this));

};


Mation.closeDownload = function() {
  clearTimeout( progressTimer );
  dialog.dialog( "close" );
  progressbar.progressbar( "value", false );
  progressLabel
  .text( "Starting download..." );
};

