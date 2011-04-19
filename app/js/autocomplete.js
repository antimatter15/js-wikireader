function autocomplete(text, div, callback, onselect){
	var results = [], selected = null;
	text.addEventListener('focus', function(){
		if(results.length) div.style.display = '';
	}, true);
	text.addEventListener('input', function(){
		callback(text.value, function(res){
			div.innerHTML = '';
			results = res.map(function(text){
				var result = document.createElement('div');
				result.className = 'item';
				result.innerText = text;
				div.appendChild(result);
				return result
			});
			if(results.length){
				div.style.display = '';
				select(results[0]);
			}
		})
	}, true);
	function select(item){
		results.forEach(function(e){e.className = 'item'})
		item.className = 'item highlight';
		selected = item;
		onselect(item.innerText)
	}
	div.addEventListener('mouseover', function(e){
		if(e.target.className == 'item') select(e.target);
	}, true)
	text.addEventListener('keydown', function(e){
		if(e.keyCode == 38){ //up
			if(results.length) div.style.display = '';
			select(selected.previousSibling || selected);
			e.preventDefault();
		}else if(e.keyCode == 40){ //down
			if(results.length) div.style.display = '';
			select(selected.nextSibling || selected);
			e.preventDefault();
		}else if(e.keyCode == 13){
			//text.value = selected.innerText;
			div.style.display = 'none';
		}
	}, false);
	text.ownerDocument.addEventListener('blur', function(e){
		div.style.display = 'none';
	}, true)
}
