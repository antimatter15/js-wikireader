autocomplete(document.getElementById('search'), document.getElementById('autocomplete'), function(value){
	return ["blah","asdfasdf","meow","kittens"]
}, function(query){
	console.log(query);
	document.getElementById('title').innerText = query;
})
