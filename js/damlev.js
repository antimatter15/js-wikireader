
//another version by me: http://snippets.dzone.com/posts/show/6942
//based on: http://en.wikibooks.org/wiki/Algorithm_implementation/Strings/Levenshtein_distance
//and:  http://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance
function damlev( str1, str2 ){
  if(!str1)str1="";
  if(!str2)str2="";

	var i, j, cost, d = [];
  str1 = str1.split("");
  str2 = str2.split("");
	
	if (str1.length == 0) return str2.length;
	if (str2.length == 0) return str1.length;
	
	for (i = 0; i <= str1.length; i++){
		d[ i ] = new Array();
		d[ i ][ 0 ] = i;
	}
 
	for (j = 0; j <= str2.length; j++) d[ 0 ][ j ] = j;
 
	for ( i = 1; i <= str1.length; i++ ){
		for ( j = 1; j <= str2.length; j++ ){
			cost = str1[i - 1] != str2[j - 1]; //false == 0, true == 1

			d[ i ][ j ] = Math.min(
                            d[ i - 1 ][ j ] + 1,
                            d[ i ][ j - 1 ] + 1,
                            d[ i - 1 ][ j - 1 ] + cost
                            );
			if(i > 1 && j > 1 && str1[i-1] == str2[j-2] && str1[i-2] == str2[j-1]){
        d[i][j] = Math.min(
                          d[i][j],
                          d[i-2][j-2] + cost   // transposition
                          )
       }
		}
	}
	
	return d[str1.length][str2.length];
}
