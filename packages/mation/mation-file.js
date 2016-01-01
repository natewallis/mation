MationFile = function (options){
  options = options || {};
  this.inlineImageData = options.inlineImageData;
  this.previewInlineImageData = options.previewInlineImageData;
  this.serverSynced = options.serverSynced;
  this.frameNumber = options.frameNumber;
};

MationFile.NUMBER_OF_ZEROS_FOR_PADDING = 9;
MationFile.FILE_EXTENSION = '.jpg';
MationFile.FILE_PREFIX = 'image-';
MationFile.VIDEO_OUTPUT_EXTENSION = "mp4";

MationFile.fromJSONValue = function (value) { return new MationFile({
  inlineImageData: value.inlineImageData,
  frameNumber: value.frameNumber,
  serverSynced: value.serverSynced
});
}

MationFile.prototype = {

  constructor: MationFile,

  typeName: function () {
    return "MationFile";
  },

  toJSONValue: function() {
    return {
      inlineImageData: this.inlineImageData,
      frameNumber: this.frameNumber,
      serverSynced: this.serverSynced
    };
  },

  getFileName: function(){
    var filename = this.frameNumber.toString()+"";
    while (filename.length < MationFile.NUMBER_OF_ZEROS_FOR_PADDING) filename = "0" + filename;
    filename += MationFile.FILE_EXTENSION;
    filename = MationFile.FILE_PREFIX + filename;
    return filename;
  }

};

EJSON.addType("MationFile", MationFile.fromJSONValue);

if (Meteor.isClient){

  _.extend(MationFile.prototype,{
    read: function (file, callback){
      var reader = new FileReader;
      var meteorFile = this;

      callback = callback || function (){};

      reader.onload = function (){
        meteorFile.source = new Uint8Array(reader.result);
        callback(null, meteorFile);
      };

      reader.onerror = function (){
        callback(reader.error);
      };

      reader.readAsArrayBuffer(file);
    } 
  });

  _.extend(MationFile, {
    reader: function (file, callback){
      return new MationFile(file).read(file, callback);
    }
  });

}

if (Meteor.isServer) {
  var fs = Npm.require('fs');
  var path = Npm.require('path');
  var mkdirp = Npm.require("mkdirp");

  _.extend(MationFile.prototype, {
    save: function (dirPath, options, callback) {
      mkdirp(dirPath, function (err) {
        if (err) return callback(err);
        var filepath = path.join(dirPath,this.getFileName());
        fs.writeFile(filepath, this.convertToBuffer(), function(err){
          callback(err);
        });
      }.bind(this));
    },

    convertToBuffer: function(){
      var base64Data = this.inlineImageData.replace(/^data:image\/(png|jpeg);base64,/, "");
      return new Buffer(base64Data, 'base64');
    } 
  });
}
