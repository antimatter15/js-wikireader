function autocomplete(text, div, callback, onselect){
	var results = [], selected = null;
	text.addEventListener('focus', function(){
		if(results.length) div.style.display = '';
	}, true);
	text.addEventListener('input', function(){
		if(!text.value) return;
		callback(text.value, function(res){
			div.innerHTML = '';
			results = res.map(function(text){
				var result = document.createElement('div');
				result.className = 'item';
				result.innerHTML = text;
				div.appendChild(result);
				return result
			});
			if(results.length){
				div.style.display = '';
				select(results[0]);
				onselect(selected.innerText);
			}
		})
	}, true);
	function select(item){
		results.forEach(function(e){e.className = 'item'})
		item.className = 'item highlight';
		selected = item;
		//onselect(item.innerText)
	}
	div.addEventListener('mouseover', function(e){
		if(e.target.className == 'item') select(e.target);
	}, true);
	div.addEventListener('click', function(e){
		console.log(e.target);
		if(/item/.test(e.target.className)){
		 select(e.target);
		 onselect(selected.innerText);
  	 //text.value = selected.innerText;
	 }
	}, true)
	text.addEventListener('keydown', function(e){
		if(e.keyCode == 38){ //up
			if(results.length) div.style.display = '';
			select(selected.previousSibling || selected);
			onselect(selected.innerText);
			e.preventDefault();
		}else if(e.keyCode == 40){ //down
			if(results.length) div.style.display = '';
			select(selected.nextSibling || selected);
			onselect(selected.innerText);
			e.preventDefault();
		}else if(e.keyCode == 13){
			//text.value = selected.innerText;
			onselect(selected.innerText);
			div.style.display = 'none';
			text.blur();
		}
	}, false);
	text.ownerDocument.addEventListener('click', function(e){
		if(e.target.className != 'item' && e.target != text){
			div.style.display = 'none';
		}
	}, true)
	text.ownerDocument.addEventListener('blur', function(e){
		//div.style.display = 'none';
	}, true)
}
