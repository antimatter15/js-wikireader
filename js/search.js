

var wiki,index;

onhashchange = function(){
  loadArticle(unescape(location.hash.substr(1)), true)
}

function slugfy(text){
  //a port of the python one
  return text
        .toLowerCase()
        .replace(/([a-zA-Z])(uml|acute|grave|circ|tilde|cedil)/g, '$1')
        .replace(/[^a-zA-Z0-9_]/g, ' ')
        .replace(/ +/g, '')
        .trim()
}

RegExp.escape = function(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

var lq = '';
function bs(orig){
  var query = slugfy(orig);
  if(query.length > 0 && lq != query){
    if(document.getElementById('search').value != orig){
      document.getElementById('search').value = orig;
    }
    lq = query;
    binsearch(0, index.size, query, function(start, len){
      showresults(start, len, orig);
    })
  }
}
var lastart = 0;
function loadArticle(name, nohist){
  if(!nohist){
    if(+new Date - lastart > 3000){
      history.pushState({}, '', '#'+name);
    }else{
      history.replaceState({}, '', '#'+name);
    }
  }
  lastart = +new Date;
  binsearch(0, index.size, slugfy(name), function(start, len, query){  
    console.log('final stage',start,len);
    var fr = new FileReader();
    fr.onload = function(){
      var arr = fr.result.split('\n').slice(1,-1); //abandon the first one. and the last one.
      var matches = arr.map(function(i){
        var title = i.split(';')[1];
        var dist = damlev(title, name);
        return [dist, i]
      }).sort(function(a,b){
        return a[0] - b[0]
      })
      .map(function(i){
        return i[1]
      })
      
      var p = document.getElementById('page');
      if(matches.length == 0){
        p.innerHTML = 'Error 404. Article "'+name+'" not found.'
        return 
      }
      var m = matches[0].split(';');
      var title = m[1];
      var start = m[2];
      var len = m[3];
      
      console.log('loading article', title, start, len);
      
      var wr = new FileReader();
      wr.onload = function(){
        var rere = /\#REDIRECT.*\[\[([^\]]+)\]\]/i; //redirect regex
        if(rere.test(wr.result)){
          loadArticle(wr.result.match(rere)[1])
        }else{
          p.innerHTML = '<h1>'+title+'</h1>'+ wikiParse(wr.result);
          if(window.debug){
            p.innerHTML += '<hr><pre>'+wr.result+'</pre>';
          }
        }
      }
      var miniblob = wiki.slice(start, len);
      wr.readAsText(miniblob,'utf-8');
    }
    var miniblob = index.slice(start, 10000);
    fr.readAsText(miniblob,'utf-8');
  })
}


function showresults(start, len, query){
  console.log('final stage',start,len);
  var fr = new FileReader();
  fr.onload = function(){
    var arr = fr.result.split('\n').slice(1,-1); //abandon the first one. and the last one.

    var re = new RegExp('^'+ RegExp.escape(slugfy(query)));
    var art = document.getElementById('articles');
    art.innerHTML = '';
    var leven = [];
    //console.log(arr);
    var matches = arr.filter(function(i){ //this could probably be optimized
      if(re.test(i)){
        return true
      }else{
        var title = i.split(';')[1];
        var dist = damlev(title.substr(0,query.length), query) + damlev(title, query) / 2;

        leven.push([dist, i]);
      }
    }).sort(function(b,a){
      var bx = b.split(';'), ax = a.split(';');
      
      return damlev(bx[1], query) - damlev(ax[1], query) //a.split(';')[3] - b.split(';')[3] //sort by file size
    })

    matches = matches.concat(leven
      .sort(function(a,b){return a[0] - b[0]})
      .map(function(i){return i[1]})
    );
    
    var articles = {};
    matches.filter(function(item, index){
      var t = item.split(';')[2]; //position where article starts
      if(articles[t]) return false;
      articles[t] = true;
      return true;
    })
    
    
    matches.forEach(function(item, index){
      var li = document.createElement('li');
      li.innerHTML = '<a href="#'+item.split(';')[1]+'">'+item.split(';')[1]+"<"+"/a>";
      art.appendChild(li);
    });
    
    if(matches.length == 0){
      art.innerHTML = 'No results :('
      return;
    }
    
    var m = matches[0].split(';');
    var title = m[1];
    var start = m[2];
    var len = m[3];
    
    
    loadArticle(title);
  }
  var miniblob = index.slice(start, 10000);
  //console.log(midpoint, miniblob, fr)
  fr.readAsText(miniblob,'utf-8');

}

var win = 200; //longest wikipedia article title is 208 char.

var lastresult = [0,0,0]; //a very simple cache

function binsearch(start, len, query, callback){
  if(lastresult[2] == query){
    console.log('pulling data from cache');
    return callback(lastresult[0], lastresult[1], lastresult[2]);
  }
  var fr = new FileReader();
  
  if(len < 10000){
    lastresult = [start,len,query];
    callback(start, len, query)
    
    return;
  }
  fr.onload = function(){
    var arr = fr.result.split('\n');
    if(arr.length < 3) console.log('error less than three parts', arr);
    var mid = arr[1]; //this should be complete;
    //console.log(arr);
    if(mid > query){
      //console.log(mid, '>', query)
      binsearch(start, Math.round(len/2) + win, query, callback);
    }else{
      //console.log(mid, '<', query)
      binsearch(start + Math.round(len/2) - win, Math.round(len/2), query, callback);
    }
  }
  var midpoint = Math.round(start + len/2);
  var miniblob = index.slice(midpoint - win, 2 * win);
  //console.log(midpoint, miniblob, fr)
  fr.readAsText(miniblob,'utf-8');
}

