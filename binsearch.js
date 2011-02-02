var win = 222; //longest wikipedia article title is 208 char.

function binsearch(start, len, slug, callback, mindow){
  mindow = mindow || 10000;
  var fr = new FileReader();
  if(len < mindow) return callback(start, len, slug);
  fr.onload = function(){
    var arr = fr.result.split('\n');
    var mid = slugfy(arr[1]); //this is the entry on the index. slugify the whole thing.
    if(mid > slug){
      //console.log(mid,'>',slug)
      binsearch(start, Math.round(len/2) + win, slug, callback, mindow);
    }else{
      //console.log(mid,'<',slug);
      binsearch(start + Math.round(len/2) - win, Math.round(len/2) + 2 * win, slug, callback, mindow);
    }
  }
  var midpoint = Math.round(start + len/2);
  var miniblob = index.slice(midpoint - win, 2 * win);
  fr.readAsText(miniblob,'utf-8');
}

