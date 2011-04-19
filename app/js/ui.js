function scoreResult(result, query){
  return damlev(result.substr(0, query.length), query) * 0.5 + damlev(result.substr(0, query.length).toLowerCase(), query.toLowerCase()) * 2 + Math.abs(query.length - result.length) * 0.1
}

autocomplete(document.getElementById('search'), document.getElementById('autocomplete'), function(query, callback){
	runSearch(query, function(results){
		callback(results.slice(0, 15).map(function(x){
			return x.title
		}))
	})
}, function(query){
	//console.log(query);
	readArticle(query, function(title, text){
		document.getElementById('title').innerText = title;	
		document.getElementById('content').innerText = text;
	})
})


function runSearch(query, callback){
	binarySearch(slugfy(query), 0, accessibleIndex, 200, 400, defaultParser, function(low, high, res){
		readIndex(low, high - low, function(text){
			callback(text.split('\n').slice(1).map(function(x){
				var parts = x.split(/\||\>/), title = parts[0], ptr = parts[1];
				return {title: title, pointer: /\>/.test(x) ? ptr : parse64(ptr), redirect: /\>/.test(x), score: scoreResult(title, query)}
			}).sort(function(a, b){
				return a.score - b.score
			}))
				//var display = /\>/.test(x)?ptr:title;
				//scoremap[display] = Math.min(scoremap[display] || Infinity, scoreResult(title, query));
			})
			/*
			var scoremap = {};
			text.split('\n').slice(1).forEach(function(x){
				var parts = x.split(/\||\>/), title = parts[0], ptr = parts[1];
				//var display = /\>/.test(x)?ptr:title;
				//scoremap[display] = Math.min(scoremap[display] || Infinity, scoreResult(title, query));
			});
			callback(Object.keys(scoremap).sort(function(a, b){
				return scoremap[a] - scoremap[b];
			}).slice(0, 15))
	
		})
			*/
	})
}

var redirectCache = {};

function findBlock(query, callback){
	runSearch(query, function(results){
		if(results[0].redirect){
			findBlock(results[0].pointer, callback)
		}else{
			callback(results[0].title, results[0].pointer)
		}
	})
}

var articleCache = {};
var worker;


function readArticle(query, callback){
	findBlock(query, function(title, position){
		if(articleCache[title]) return callback(title, articleCache[title]);
		readPage(position, function(){
			readArticle(title, callback); //recurse because im lazy
		})
	})
}

function readPage(position, callback, blocksize){
	var fr = new FileReader();
	if(worker) worker.terminate();
	worker = new Worker('js/LZMA_simple.js');
	worker.addEventListener('error', function(e){ 
    console.log('LZMA decompression error', e);
  }, false)
  worker.addEventListener('message', function(e){
  	var block = e.data;
  	var re = /=([^\n\#\<\>\[\]\|\{\}]+)=\n\n\n\n/g;
  	var matches = re.exec(block), lastIndex = 0;
		while (matches){
			articleCache[matches[1]] = block.slice(re.lastIndex, (matches = re.exec(block))?matches.index:undefined)
		}
  	callback();
  	//portal 2 is coming tomorrow so this is obligatory
  	//window.companioncube = block;
  }, false);
	fr.onload = function(){
		worker.postMessage(fr.result);
	}
	fr.readAsBinaryString(dump.slice(position, blocksize || 200000));
}
