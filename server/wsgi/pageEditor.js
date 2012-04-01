var pageEditor = {
    template : '<div id="editoroverlay" title="Editor" alipielements="alipi" class="ui-widget-header ui-corner-all">'+
        '<label style="left: 20%;">Reference</label>'+
        '<div id="reference" readonly="yes"></div>'+
        '<label style="left: 70%;">Editor</label>'+
        '<div id="editor" alipielements="alipi" contenteditable="true"></div>'+
        '<div id="forPrevData"></div>'+
        '</div>', 
    startEdit: function(event)
    {
	if($(event.target).attr('m4pageedittype') == 'text')
	{
	    $('#pub_overlay').slideDown();
	    $('#element_edit_overlay').slideDown();

	    _this = pageEditor;
	    $(event.target).removeAttr('m4pageedittype');
	    $(event.target).children().removeAttr('m4pageedittype');
	    $('body').append(_this.template);
	    var tag = event.target.nodeName;
//	    $(event.target).css('border-style', 'dotted');

	    $('#reference').text('<'+tag+'>'+$(event.target).html()+'</'+tag+'>');

	    $('#editor').html($(event.target).html());
	    
	    $('#edit-text').attr('disabled', false);
	    $('#add-audio').attr('disabled', false);
	    $('#add-link').attr('disabled', false);
	    $('#replace-image').attr('disabled', true);
	}
	else if($(event.target).attr('m4pageedittype') == 'image')
	{
	    $('#replace-image').attr('disabled', false);
	    $('#add-audio').attr('disabled', false);
	    $('#add-link').attr('disabled', false);
	    $('#edit-text').attr('disabled', true);
	}
	
    },
};

var DOM = {
    getXpath : function getXPath(element)
    {
	var str = '';
	var currentNode = element;
	var path = '';
	var index = -1;

	if (currentNode.nodeName != "#text")
	{
	    path = DOM.makePath(currentNode);
	}
	else
	{
	    path = DOM.makePath(currentNode.parentNode);
	}

    	
	return path;
    },
    getElementIdx : function getElementIdx(elt)
    {
	var count = 1;
	for (var sib = elt.previousSibling; sib ; sib = sib.previousSibling)
	{
	    if(sib.nodeType == 1 && sib.tagName == elt.tagName)count++
	}
	
	return count;
    },
    
    makePath : function makePath(elt){
	if(elt.tagName != 'IMG')
	    elt = elt.parentNode;
    	var path = '';
	for (; elt && elt.nodeType == 1; elt = elt.parentNode)
	{
	    if(elt.id == "")
	    {
		idx = DOM.getElementIdx(elt);
		xname = elt.tagName;
		if (idx > 1) 
		    xname += "[" + idx + "]";
		path = "/" + xname + path;
	    }
	    else
	    {
		path = "//*[@id='"+elt.id+"']"+path;
		break;
	    }
	}
	return path;
    },
};

var util = {
    historyObj : function EditCommandHistory(pageEditor) {
	var self = this, history = [], imageSrc, imageMatcher, imageHeight, imageWidth, buildDataString, anchorElement, anchorElementId, ajaxResultProcessor = new AjaxResultProcessor();

	this.hasChangesPending = function hasChangesPending() {
	    return history.length > 0;
	};
	this.formUncomplete = function formUnomplete(){
	    return (locName == '' &&  langName=='' && styleName == '' );
	};
	
	this.apply = function apply(command) {
	    var poofPosition, poofDiv;

	    switch (command.command) {
            case 'TEXT_UPDATE':
		command.element = document.getElementById("alipiSelectedElement");
		command.previousData = document.getElementById("forPrevData").innerHTML;
		command.data = document.getElementById("editor").innerHTML;
		DOM.textContent(command.element, command.data);
		pageEditor.showMessage('Text changed');
		break;
            case 'AUDIO_SRC_UPDATE':
		textElementPopup.hasAudio = true;	
		command.previousData = "";
		pageEditor.showMessage('Audio updated');
		break;

            // case 'DELETE':
	    // 	poofPosition = DOM.findPosition(command.element);

	    // 	poofDiv = DOM.BUILDER.DIV({'style' : 'width:32px;height:32px;background: transparent url(http://y.a11y.in/alipi/images/poof.png) no-repeat;position:absolute;top:' + poofPosition.y + 'px;left:' + poofPosition.x + 'px;'});
	    // 	document.body.appendChild(poofDiv);

	    // 	UTIL.animate(function(index, last) {
	    // 		if (last) {
	    // 		    document.body.removeChild(poofDiv);
	    // 		} else {
	    // 		    poofDiv.style.backgroundPosition = '0 -' + (index * 32) + 'px';
	    // 		}
	    // 	    }, 5, 100);

	    // 	DOM.overrideStyleProperty(command.element, 'display', 'none');
	    // 	pageEditor.showMessage('Section deleted');
	    // 	break;

            case 'IMAGE_SRC_UPDATE':
		imageMatcher = new RegExp("(\\d+)x(\\d+),(.+)").exec(command.data);
		imageWidth = imageMatcher[1];
		imageHeight = imageMatcher[2];
		imageSrc = imageMatcher[3];

		if (imageSrc && command.element.src != imageSrc) {
		    command.element.src = imageSrc;
		    pageEditor.showMessage('Image changed');
		}
		if (imageWidth == 0) {
		    command.element.removeAttribute('width');
		} else {
		    command.element.width = imageWidth;
		}

		if (imageHeight == 0) {
		    command.element.removeAttribute('height');
		} else {
		    command.element.height = imageHeight;
		}
		break;

            case 'ANCHOR_UPDATE':
		command.element.setAttribute('href', command.data);
		pageEditor.showMessage('Link changed');
		break;

            case 'ANCHOR_CREATE':
		anchorElement = DOM.BUILDER.A({ 'href' : command.data });
		console.log(command.element);
		command.element.parentNode.replaceChild(anchorElement, command.element);
		anchorElement.appendChild(command.element);
		command.previousData = anchorElement;
		pageEditor.showMessage('Link added');
		break;

	    case 'AUDIO_UPDATE':
		command.element.setAttribute('src', command.data);
		pageEditor.showMessage('Audio changed');
		break;
		
            case 'AUDIO_CREATE':
		audioElement = document.createElement('audio');
		audioElement.setAttribute("id", "audiotag");
		audioElement.setAttribute('src',command.data);
		audioElement.setAttribute('controls','controls');
		audioElement.setAttribute('style', 'display:table;');
		$(audioElement).insertBefore($(selectedElement));		
		pageEditor.showMessage('Audio added');
		break;

            default:
		console.error('Unknown command:', command);
	    }

	    history.push(command);
	};

	this.undo = function undo() {
	    var imageElement, command;

	    if (self.hasChangesPending()) {
		command = history.pop();
		switch (command.command) {
		case 'TEXT_UPDATE':
		    console.log(command.element.innerHTML);
		    console.log(command.previousData.innerHTML);
		    command.element.innerHTML = command.previousData;
		    pageEditor.showMessage('Text change undone');
		    break;

		case 'DELETE':
		    DOM.restoreStyleProperty(command.element, 'display', '');
		    pageEditor.showMessage('Delete undone');
		    break;

		case 'IMAGE_SRC_UPDATE':
		    imageElement = new M4ImageElement(command.element);

		    command.element.src = command.previousData.src;
		    if (command.previousData.size.width) {
			command.element.width = command.previousData.size.width;
		    } else {
			command.element.removeAttribute('width');
		    }
		    if (command.previousData.size.height) {
			command.element.height = command.previousData.size.height;
		    } else {
			command.element.removeAttribute('height');
		    }
		    imageElement.setRawImageSize(command.previousData.rawImageSize)

			pageEditor.showMessage('Image change undone');
		    break;
		    
		case 'AUDIO_SRC_UPDATE':
		    command.element.remove();
		    pageEditor.showMessage('Link removed');
		    break;
		case 'ANCHOR_UPDATE':
		    command.element.setAttribute('href', command.previousData);
		    pageEditor.showMessage('Link change undone');
		    break;

		case 'ANCHOR_CREATE':
		    command.previousData.parentNode.replaceChild(command.element, command.previousData);
		    pageEditor.showMessage('Link removed');
		    break;

		default:
		    console.error('Unknown command:', command);
		}
	    } else {
		pageEditor.showMessage('Nothing to undo');
	    }
	};

	this.publish = function publish() {
	    var result;
	    if(document.getElementById('your-check').checked)
		{
		    localStorage.myContent = buildDataString();
		    window.location.href = "http://dev.a11y.in/test.html";
		    window.reload();
		}
	    else{
		
		AJAX.post('http://dev.a11y.in/test',  buildDataString(), function(result) {
	    		      ajaxResultProcessor.processPublishedResponse(result);
	    		  });
	    }
	};
	
	buildDataString = function buildDataString() {
	    var check_xpath = [], temp_history = [], index = [];
	    for(x=0; x<history.length; x++) {
		check_xpath.push(history[x].xpath);
	    }
	    for(i=0; i<check_xpath.length-1; i++) {
		for(j=i+1; j<check_xpath.length; j++) {
		    if ((check_xpath[i] == check_xpath[j]) && (history[i].elementType == history[j].elementType)) {
			    index.push(i);
			} 
		}
	    }
	    if (index.length > 0) {
		for (var z=0; z<index.length; z++) {
		    delete history[index[z]];
		}
	    }
	    
	    for (var x=0; x<history.length; x++) {
		if (history[x] != undefined) {
		    temp_history.push(history[x]);
		}
	    }

	    history = temp_history;
	    console.log("hello" + styleSelect.innerHTML);
	    var command, buffer;
	    buffer = new UTIL.StringBuffer();
	    UTIL.forEach(history, function(index, command) {
		    buffer.append('###'); //separates the commands
		    buffer.append('about=');  //url=about    //removed '&' on purpose
		    buffer.append(window.location.search.split('=')[1]);
		    buffer.append('&lang=');//lang
		    buffer.append(encodeURIComponent(langName.innerHTML));
		    buffer.append('&location=');//location
		    buffer.append(encodeURIComponent(locName.innerHTML));
		    buffer.append('&style=');//style
		    buffer.append(encodeURIComponent(styleSelect.innerHTML));
		    buffer.append('&blog=');  //blog where to post
		    buffer.append(encodeURIComponent("blog"));
		    buffer.append('&elementtype='); // text, audio, img
		    buffer.append(encodeURIComponent(command.elementType));
		    buffer.append('&xpath=');//xpath
		    buffer.append(encodeURIComponent(command.xpath));
		    buffer.append('&data=');  //data
		    buffer.append(encodeURIComponent(command.data));
		    buffer.append('&author='); //author
		    if (author.value == '') {
		        buffer.append(encodeURIComponent('Anonymous'));
		    } else {
		        buffer.append(encodeURIComponent(author.value));
		    }
		});  	    console.log(buffer.toString());	    
	    return buffer.toString().substring(3);
	}; 
    },
}
