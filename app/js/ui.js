function scoreResult(result, query){
  return damlev(result.substr(0, query.length), query) * 0.5 + damlev(result.substr(0, query.length).toLowerCase(), query.toLowerCase()) * 2 + Math.abs(query.length - result.length) * 0.1
}
var lastSearchTime = 0;
autocomplete(document.getElementById('search'), document.getElementById('autocomplete'), function(query, callback){
	if(accessibleIndex < 100) return callback(["Downloading... Please Wait"]);
	runSearch(query, function(results){
		
		var map = {};
		callback(results.map(function(x){
			return x.redirect ? x.pointer : x.title;
		}).filter(function(x){
		  if(map[x]) return 0;
		  return map[x] = 1;
		}).slice(0,15).map(function(x){
			//this is probably one of my cleverest regexes ever
			//return x.replace(new RegExp('('+query.split('').join('|')+')','gi'), '|$1|').replace(/((\|.\|){2,})/g, '<b>$1</b>').replace(/\|/g,'')
			return x.replace(new RegExp('('+query.replace(/[^\w]/g, ' ').replace(/ +/g,'|')+')', 'gi'), '<b>$1</b>')
		}))
	})
}, function(query){
	if(new Date - lastSearchTime > 3141){ //Pi! also 3sec is like google instant's magic number apparnetly too
		document.title = query;
    history.pushState({}, '', '?'+query);
	}
	lastSearchTime = new Date;
	loadArticle(query);
});

function incrementSlider(pagesDelta){
	var step = document.getElementById('slider').step - 0;
	document.getElementById('slider').value -= pagesDelta * -step;
	updateIndex();
}



function updateIndex(){
	var val = document.getElementById('slider').value - 0;
	var step = document.getElementById('slider').step - 0;
	var max = document.getElementById('slider').max - 0;	
	document.getElementById('title').innerText = "Index: Page "+(1+(val/step))+" of "+Math.floor(1+(max/step));	
	readIndex(val - 200, step + 200, function(text){
		document.getElementById('pageitems').innerHTML = '<a href="javascript:incrementSlider(-1)" class="prev">Previous</a> / <a class="next" href="javascript:incrementSlider(1)">Next</a><br>' + text.split('\n').slice(1, -1).map(function(x){
			var title = x.split(/\||>/)[0];
			return '<a href="?'+title+'">'+title+'</a>';
		}).join("<br>");
	});
}

var lastArticlePos = 0;

function loadArticle(query){
	
	query = query.replace(/w(ikipedia)?:/,'');
	if(query == ''){
		return;
	}
	if(query == 'Special:Random'){
		//this is actually much more complicated than it needs to be. but its probably
		//simpler this way and requires less reafactoring, so meh.
		readIndex(Math.floor(accessibleIndex * Math.random()), 400, function(text){
			var title = text && text.split('\n')[1].split(/\||\>/)[0];
			loadArticle(title);
			document.title = title;
      history.replaceState({}, '', '?'+title);
		});
		document.getElementById('title').innerText = "Special:Random";	
		return;
	}
	if(query == 'Special:Index'){
		if(accessibleIndex == 0) return setTimeout(function(){
			loadArticle(query);
		}, 100);
		document.getElementById('title').innerText = "Index";	
		document.getElementById('content').innerHTML = "<input type=range id=slider> <div id=pageitems>";
		document.getElementById('slider').max = accessibleIndex;
		var step = Math.floor(document.body.scrollHeight*document.body.scrollWidth/191.04);
		document.getElementById('slider').step = step;
		document.getElementById('slider').value = Math.floor(lastArticlePos/step) * step;

		var lastTime = 0;
		document.getElementById('slider').onchange = function(){
			lastTime = +new Date;
			var closureTime = lastTime;
			setTimeout(function(){
				if(closureTime >= lastTime) updateIndex();
			}, 200)
		}
		updateIndex();
		return;
	}
	document.getElementById('title').innerText = "Loading "+query+"...";	
	readArticle(query, function(title, text, pos){
		document.title = title;
		history.replaceState({}, '', '?'+title);
		document.getElementById('title').innerText = title;	
		document.getElementById('content').innerHTML = parse_wikitext(text);
		//document.getElementById('content').innerText = text;
		if(pos) lastArticlePos = pos;
		//console.log(pos, accessibleIndex, pos/accessibleIndex);
		//document.getElementById('slider').max = accessibleIndex;
		//document.getElementById('slider').value = pos;
	})
}

/*
function parse_wikitext(text){
	return text.replace(/===([^=\n]+)===\n+/g,'<h3>$1</h3>').replace(/==([^=\n]+)==\n+/g,'<h2>$1</h2>')
						 .replace(/\n\*\* ([^\n]+)/g, '\n<ul><ul><li>$1</li></ul></ul>')
						 .replace(/\n\* ([^\n]+)/g, '\n<ul><li>$1</li></ul>')
						 .replace(/'''([^']+)'''/g, '<b>$1</b>')
						 .replace(/''([^']+)''/g, '<i>$1</i>')
						 .replace(/\n+/g, '<br>')
						 .replace(/\[\[([^\|\]]+)\|([^\]]+)\]\]/g, '<a href="$1">$2</a>');
}
*/

function runSearch(query, callback){
	binarySearch(slugfy(query), 0, accessibleIndex, 200, 800, defaultParser, function(low, high, res){
		readIndex(low, high - low, function(text){
			callback(text.split('\n').slice(1, -1).map(function(x){
				var parts = x.split(/\||\>/), title = parts[0], ptr = parts[1];
				return {title: title, pointer: /\>/.test(x) ? ptr : parse64(ptr), redirect: /\>/.test(x), score: scoreResult(title, query)}
			}).sort(function(a, b){
				return a.score - b.score
			}), low)
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
	runSearch(query, function(results, pos){
		if(results[0].redirect){
			findBlock(results[0].pointer, callback)
		}else{
			callback(results[0].title, results[0].pointer, pos)
		}
	})
}




document.body.onclick = function(e){
  if(e.button == 0  ){
    var link = null;
    if(e.target.tagName.toLowerCase() == 'a'){
      link = e.target;
    }else if(e.target.parentNode.tagName.toLowerCase() == 'a'){
      link = e.target.parentNode;
    }
    if(link){
      if(link.href.replace(/\?.*$/,'') == location.href.replace(/\?.*$/,'')){
        e.preventDefault();
        history.pushState({}, '', link.href);
        loadArticle(decodeURIComponent(location.search.substr(1)))
      }
    }
  }
}

onpopstate = function(e){

  loadArticle(decodeURIComponent(location.search.substr(1)))
}


var articleCache = {};
var worker;


function readArticle(query, callback){
	if(!index || accessibleIndex < 10 || !dump) return setTimeout(function(){
		readArticle(query, callback);
	}, 10);
	findBlock(query, function(title, position, location){
		if(articleCache[title]) return callback(title, articleCache[title], location);
		readPage(position, function(){
			callback(title, articleCache[title] || "==Page Not Found==", location);
		})
	})
}

function readPage(position, callback, blocksize){
	var fr = new FileReader();
	if(worker) worker.terminate();
	worker = new Worker('js/lzma.js');
	worker.addEventListener('error', function(e){ 
    console.log('LZMA decompression error', e);
  }, false);
  var starttime, endtime;
  worker.addEventListener('message', function(e){
    endtime = +new Date;
    console.log(endtime - starttime);
  	var block = e.data;
  	var re = /=([^=\n\#\<\>\[\]\|\{\}]+)=\n\n\n\n/g;
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
		starttime = +new Date;
	}
	fr.readAsBinaryString(blobSlice(dump, position, blocksize || 200000));
}
