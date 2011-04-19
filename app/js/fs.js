var indexurl = 'http://localhost/js-wikireader/app/tools/dump.index';
var indexsize = 740060;
var dumpsize = 55254607;
var dumpurl = 'http://localhost/js-wikireader/app/tools/dump.lzma';
var index, dump;

var accessibleIndex = 0;
var accessibleTitle = ''; //almost last accessible title
var fs;

var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_', clookup = {};
for(var i = 0; i < chars.length; i++) clookup[chars[i]] = i;

function parse64(string){
	//base 64 (note its not the base64 you know and love) conversions
	if(!string) return NaN;
	var n = 0;
	for(var l = string.length, i = 0; i < l; i++) n = n * 64 + clookup[string[i]];
	return n;
}

window.requestFileSystem(window.PERSISTENT, 10*1024*1024*1024 /*10 GB*/, function(filesystem){
	fs = filesystem;
	loadIndex(function(){
		console.log('loaded index');
		loadDump(function(){
			console.log('loaded dump');
			updateAccessibleIndex();
			downloadIndex();
			downloadDump();
		});
	});
}, errorHandler);


function updateAccessibleIndex(){
	downloadStatus(function(index, title){
		console.log('accessible index: ', index);
		accessibleIndex = index;
		accessibleTitle = title;
		document.getElementById('status').innerHTML = '<b>Downloading</b> '+accessibleTitle;
	});
}

function loadIndex(callback){
	fs.root.getFile('dump.index', {create:true, exclusive: false}, function(e){
		e.file(function(file){
			index = file;
			if(callback) callback();
		})
	}, errorHandler);
}

function loadDump(callback){
	fs.root.getFile('dump.lzma', {create:true, exclusive: false}, function(e){
		e.file(function(file){
			dump = file;
			if(callback) callback();
		})
	}, errorHandler);
}

function updateDownloadStatus(){
	if(!dump) return;
	document.getElementById('progress').value = dump.size / dumpsize;
}


function downloadStatus(callback){
	if(!index || !dump) return false;
	if(dump.size < 1000 || index.size < 1000) return callback(0, 0, 0);
	//get the current size of the accessible index.
	binarySearch(dump.size, accessibleIndex, index.size, 500, 1000, function(text){
		return parse64(text.match(/\n.+?\|([\w/_\-]+)/)[1])
	}, function(low, high, result, text){	 //using the text arg is bad! but we're using this to save a bit of time
		console.log(low, high, result);
		readIndex(low, high - low, function(raw){
			var text = utfdec(raw);
			var lines = text.split("\n").slice(1);
			var lastnum = -1;
			var bytecount = text.split("\n")[0].length;
			for(var i = 0; i < lines.length; i++){
				var num = parse64(lines[i].split("|")[1]);
				if(!isNaN(num) && (lastnum == -1 || Math.abs(lastnum - num) < 1024 * 1024)){
					if(num > dump.size) break;
					lastnum = num;
				}
				bytecount += lines[i].length + 1; //account for the newline
			}
			var title = text.split('\n')[1].split(/\||\>/)[0];
			callback(low + bytecount, title, lastnum, bytecount);
		})
	})
}


function binarySearch(value, low, high, win, threshold, parser, callback){
	var mid = Math.round(low + (high - low) / 2);
	//console.log(value, low, high, win, threshold, mid);
	readIndex(mid - win, win * 2, function(text){
		var result = parser(text); //maybe ideally something closer to the exact center would be better.
		var offset = text.split("\n")[0].length + 1;
		  
		if(high - low < threshold * 2){
			return callback(low, high, result, text);
		}
		//console.log(result, result < value ? '<' : '>', value);
		if(result < value){
			binarySearch(value, mid - win, high, win, threshold, parser, callback);
		}else{
			binarySearch(value, low, mid + win, win, threshold, parser, callback);
		}
	})
}


function defaultParser(text){
	return slugfy(text.split("\n")[1].split(/\||\>/)[0])
}




var indexCache = {};

function readIndex(start, length, callback){
	var hash = 'i'+start+'-'+length;
	if(indexCache[hash]) return callback(indexCache[hash]);
	var fr = new FileReader();
	fr.onload = function(){
		indexCache[hash] = fr.result;
		callback(fr.result);
	}
	fr.readAsText(index.slice(Math.max(0, start), Math.min(index.size - start, length)), 'utf-8');
}


function downloadDump(){
	fs.root.getFile('dump.lzma', {create:true, exclusive: false}, function(fileEntry){
		fileEntry.createWriter(function(fileWriter) {
			document.getElementById('status').innerHTML = '<b>Downloading</b> '+accessibleTitle;
			document.getElementById('progress').value = fileWriter.length / dumpsize;
			if(fileWriter.length < dumpsize){
				requestChunk(dumpurl, fileWriter.length, function(buf){
					fileWriter.seek(fileWriter.length);
					var bb = new BlobBuilder();
					bb.append(buf);
					fileWriter.write(bb.getBlob());
					console.log('writing');
					downloadDump();
					updateAccessibleIndex();
				})
			}else{
				console.log('done downloading dump');
				document.getElementById('download').style.display = 'none';
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
				console.log('done downloading index');
			}
		})
	}, errorHandler);
}

var chunksize = 1024 * 1024; //one megabyte
function requestChunk(url, pos, callback){

	document.getElementById('download').style.display = '';
	
	var xhr = new XMLHttpRequest(); //resuse object
	console.log('downloading ',url + "?"+Math.random(),'position',pos);
	xhr.open('GET', url+ "?"+Math.random(), true);
	xhr.setRequestHeader('Range', 'bytes='+pos+'-'+(pos+chunksize));

	xhr.responseType = 'arraybuffer';
	xhr.onerror = function(){
		//do something
	}
	xhr.onload = function(){
		setTimeout(function(){
			callback(xhr.response)
		},1000);
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
  document.getElementById('status').innerHTML = '<b>Error</b> '+msg;
}
