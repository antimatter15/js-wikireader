var indexurl = 'http://localhost/js-wikireader/app/tools/dump.index';
var indexsize = 750645;
var dumpsize = 55245529;
var dumpurl = 'http://localhost/js-wikireader/app/tools/dump.lzma';
var index, dump;

var fs;
window.requestFileSystem(window.PERSISTENT, 10*1024*1024*1024 /*10 GB*/, function(filesystem){
	fs = filesystem;
	//loadDump();
	
}, errorHandler);

function loadIndex(){
	fs.root.getFile('dump.lzma', {create:false}, function(e){
		e.file(function(file){
			index = file;
		})
	}, function(){
		console.log('beginning download INDEX');
	});
}

function loadDump(){
	fs.root.getFile('dump.index', {create:false}, function(e){
		e.file(function(file){
			dump = file;
		})
	}, function(){
		console.log('beginning download DUMP');
	});
}


function downloadStatus(){
	if(!index || !dump) return;
	
}

function downloadChunk(){
	fs.root.getFile('dump.lzma', {create:true, exclusive: false}, function(fileEntry){
		fileEntry.createWriter(function(fileWriter) {
			if(fileWriter.length < dumpsize){
				requestChunk(dumpurl, fileWriter.length, function(buf){
					fileWriter.seek(fileWriter.length);
					var bb = new BlobBuilder();
					bb.append(buf);
					fileWriter.write(bb.getBlob());
					console.log('writing');
					downloadChunk();
				})
			}else{
				console.log('done');
			}
		})
	}, errorHandler);
}


function downloadIndex(){
	fs.root.getFile('dump.index', {create:true, exclusive: false}, function(fileEntry){
		fileEntry.createWriter(function(fileWriter) {
			if(fileWriter.length < indexsize){
				requestChunk(indexurl, fileWriter.length, function(buf){
					fileWriter.seek(fileWriter.length);
					var bb = new BlobBuilder();
					bb.append(buf);
					fileWriter.write(bb.getBlob());
					console.log('writing');
					downloadIndex();
				})
			}else{
				console.log('done');
			}
		})
	}, errorHandler);
}

var chunksize = 1024 * 1024; //one megabyte

function requestChunk(url, pos, callback){
	var xhr = new XMLHttpRequest(); //resuse object
	console.log('downloading ',url + "?"+Math.random(),'position',pos);
	xhr.open('GET', url+ "?"+Math.random(), true);
	xhr.setRequestHeader('Range', 'bytes='+pos+'-'+(pos+chunksize));

	xhr.responseType = 'arraybuffer';
	
	xhr.onload = function(){
		callback(xhr.response)
	}
	xhr.send(null)
}

/*

	xhr = new XMLHttpRequest();
	xhr.open('GET', 'http://localhost/js-wikireader/app/tools/dump.lzma', true);
	xhr.setRequestHeader('Range', 'bytes=500-999000');
	xhr.responseType = 'arraybuffer';
	xhr.send(null);
	
*/


function errorHandler(e) {
  var msg = '';

  switch (e.code) {
    case FileError.QUOTA_EXCEEDED_ERR:
      msg = 'QUOTA_EXCEEDED_ERR';
      break;
    case FileError.NOT_FOUND_ERR:
      msg = 'NOT_FOUND_ERR';
      break;
    case FileError.SECURITY_ERR:
      msg = 'SECURITY_ERR';
      break;
    case FileError.INVALID_MODIFICATION_ERR:
      msg = 'INVALID_MODIFICATION_ERR';
      break;
    case FileError.INVALID_STATE_ERR:
      msg = 'INVALID_STATE_ERR';
      break;
    default:
      msg = 'Unknown Error';
      break;
  };

  console.log('Error: ' + msg);
}
