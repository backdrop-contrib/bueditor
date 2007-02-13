// $Id$
//collection of functions required for editor default buttons.

//Automatically break new lines as in Drupal preview. ported from original php function at http://photomatt.net/scripts/autop
function eDefAutoP(txt, br) {
  var br = typeof br == 'undefined' ? 1 : br;
  var txt = txt||'';
  if (txt.indexOf('\n') == -1) return txt;
	txt += '\n'; // just to make things a little easier, pad the end
	txt = txt.replace(/<br \/>\s*<br \/>/g, '\n\n');
	var blocks = '(table|thead|tfoot|caption|colgroup|tbody|tr|td|th|div|dl|dd|dt|ul|ol|li|pre|select|form|blockquote|address|math|style|script|object|input|param|p|h[1-6])';
	txt = txt.replace(new RegExp('(<' + blocks + '[^>]*>)', 'g'), '\n$1');
	txt = txt.replace(new RegExp('(<\/' + blocks + '>)', 'g'), '$1\n\n');
	txt = txt.replace(/\r\n|\r/g, '\n'); // cross-platform newlines
	txt = txt.replace(/\n\n+/g, '\n\n'); // take care of duplicates
	txt = txt.replace(/\n?((.|\n)+?)\n\s*\n/g, '<p>$1</p>\n'); // make paragraphs
  txt = txt.replace(/\n?((.|\n)+?)$/, '<p>$1</p>\n'); //including one at the end
	txt = txt.replace(/<p>\s*?<\/p>/g, ''); // under certain strange conditions it could create a P of entirely whitespace
	txt = txt.replace(/<p>(<div[^>]*>\s*)/g, '$1<p>');
	txt = txt.replace(/<p>([^<]+)\s*?(<\/(div|address|form)[^>]*>)/g, '<p>$1</p>$2');
	txt = txt.replace(new RegExp('<p>\s*(<\/?' + blocks + '[^>]*>)\s*<\/p>', 'g'), '$1');
	txt = txt.replace(/<p>(<li.+?)<\/p>/g, '$1'); // problem with nested lists
	txt = txt.replace(/<p><blockquote([^>]*)>/g, '<blockquote$1><p>');
	txt = txt.replace(/<\/blockquote><\/p>/g, '</p></blockquote>');
	txt = txt.replace(new RegExp('<p>\s*(<\/?' + blocks + '[^>]*>)', 'g'), '$1');
	txt = txt.replace(new RegExp('(<\/?' + blocks + '[^>]*>)\s*<\/p>', 'g'), '$1');
	if (br) {
		txt = txt.replace(/<(script|style)(.|\n)*?<\/\1>/g, function($0) {return $0.replace(/\n/g, '<PNL />')});
		txt = txt.replace(/(<br \/>)?\s*\n/g, '<br />\n'); // optionally make line breaks
		txt = txt.replace(/<PNL \/>/g, '\n');
	}
	txt = txt.replace(new RegExp('(<\/?' + blocks + '[^>]*>)\s*<br \/>', 'g'), '$1');
	txt = txt.replace(/<br \/>(\s*<\/?(p|li|div|dl|dd|dt|th|pre|td|ul|ol)[^>]*>)/g, '$1');
	if (txt.indexOf('<pre') != -1) {
		txt = txt.replace(/(<pre(.|\n)*?>)((.|\n)*?)<\/pre>/g, function($0, $1, $2, $3) {return $1.replace(/\\([\'\"\\])/g, '$1') + $3.replace(/<p>/g, '\n').replace(/<\/p>|<br \/>/g, '').replace(/\\([\'\"\\])/g, '$1') + '</pre>'}); //'
  }
	txt = txt.replace(/\n<\/p>$/g, '</p>');
	return txt;
}

//enclose each line in the given text with the given tags.
function eDefProcessLines(text, tagA, tagB) {
  return tagA+ text.replace(/(\r?\n|\r)/g, tagB+'$1'+tagA) +tagB;
}
//enclose lines in the selected text with inA and inB and then enclose the resulting text with outA and outB. If the selected text is processed before, restore it.
function eDefSelProcessLines(outA, inA, inB, outB) {
  var match, E = editor.active, sel = E.getSelection().replace(/\r\n|\r/, '\n');
  if (match = sel.match(new RegExp('^'+ outA + inA +'((.|\n)*)'+ inB + outB +'$'))) {
    E.replaceSelection(match[1].replace(new RegExp(inB +'\n'+ inA, 'g'), '\n'));
  }
  else if (sel) E.replaceSelection(outA+eDefProcessLines(sel, inA, inB)+outB);
  else E.tagSelection(outA+inA, inB+outB);
}
//returns form input html. atxt contains additional attributes
function eDefHtmlInput(type, name, value, size, atxt) {
  return '<input type="'+ type +'" name="'+ (name||'') +'" value="'+ (value||'') +'" size="'+ (size||'') +'" '+ (atxt||'') +' />';
}
function eDefHtmlInputT(name, value, size, atxt) {
  return eDefHtmlInput('text', name, value, size, eDefTxtClass(atxt, 'form-item'));
}
function eDefHtmlInputB(name, value, size, atxt) {
  return eDefHtmlInput('button', name, value, size, eDefTxtClass(atxt, 'form-submit'));
}
function eDefTxtClass(txt, c) {
  var txt = txt||'';
  if (txt && txt.indexOf('class="')!=-1) return txt.replace(/(class\=\")/, '$1'+c+' ');
  return txt+' class="'+c+'"';
}

//return a table row of cells(attributes of the function). eDefHtmlRow(cell1, cell2 ...), cell = [content, attributes]
function eDefHtmlRow() {
  var a, cells = '';
  for (var i=0; a=arguments[i]; i++) cells += eDefHtmlCell(a[0], a[1]);
  return '<tr>'+ cells +'</tr>';
}
// return a table cell containing the given value and having the given attributes
function eDefHtmlCell(value, atxt) {
  return '<td'+ (atxt||'')+'>'+ (value||'') +'</td>';
}

//Previews the selected text in the textarea. If there is no selection, previews the whole content. By default lines and paragraphs break automatically. Pure HTML preview is eDefPreview('full')
function eDefPreview(NoAutoP) {
  var P, E = editor.active, T = E.textArea, B = E.buttons[E.bindex];
  if (E.preview) {
    P = E.preview;
  }
  else {
    P = document.createElement('div');
    P.className = 'preview';
    P.style.display = 'none';
    P.style.overflow = 'auto';
    T.parentNode.insertBefore(P, T);
    E.preview = P;
  }
  if (P.style.display == 'none') {
    var html = NoAutoP ? E.getSelection()||T.value : eDefAutoP(E.getSelection()||T.value);
    if (editor.mode != 2) editor.G['pos'+T.id] = E.posSelection();
    P.style.display = 'block';
    P.style.height = T.style.height||(T.offsetHeight+'px');
    P.style.width = T.style.width||(T.offsetWidth+'px');
    P.innerHTML = '<div class="node"><div class="content">'+ html +'</div></div>';
    T.style.display = 'none';
    $(B).addClass('stay-clicked');
    E.buttonsDisabled(true, E.bindex);
  }
  else {
    $(B).removeClass('stay-clicked');
    E.buttonsDisabled(false);
    P.innerHTML = '';
    P.style.display = 'none';
    T.style.display = 'block';
    if (editor.mode != 2) E.makeSelection(editor.G['pos'+T.id].start, editor.G['pos'+T.id].end);
  }
}

//Insert the data in the given form to the textarea. Link and image dialogs use this function.
function eDefFileInsert(form, type) {
  var el = form.elements, E = editor.active;
  var o = editor.G.selObj||{attributes : []};
  editor.dialog.close();
  if (type == 'image') {
    var def = ['src', 'width', 'height', 'alt'];
    var img = '<img';
    for(var i in def) o.attributes[def[i]] = el[def[i]].value;
    for(var i in o.attributes) img += ' '+ i +'="'+ o.attributes[i] +'"';
    img += ' />';
    E.replaceSelection(img);
  }
  else if (type == 'link') {
    var a = '<a';
    var def = ['href', 'title'];
    for(var i in def) o.attributes[def[i]] = el[def[i]].value;
    for(var i in o.attributes) if (o.attributes[i]) a += ' '+ i +'="'+ o.attributes[i] +'"';
    a += '>';
    editor.G.selObj ? E.replaceSelection(a + o.innerHTML +'</a>') : E.tagSelection(a, '</a>');
  }
  editor.G.selObj = null;
}

//Open file insertion dialog of the given type. L containes translated interface text. brwURL is URL of the file browser
function eDefFileDialog(type, L, brwURL) {
  var brwButton = brwURL ? eDefHtmlInput('button', 'brw', L.brw, '', 'class="file-browser" onclick="eDefFileBrowser(\''+ brwURL +'\', \''+ type +'\', this.form)"') : '';
  var content = '<form name="eDialogForm" onsubmit="eDefFileInsert(this, \''+ type +'\'); return false;"><div class="form-item"><table>';
  if (type == 'image') {
    editor.G.selObj = editor.parseTag(editor.active.getSelection(), 'img');
    var i = editor.G.selObj ? editor.G.selObj.attributes : {};
    content += eDefHtmlRow([L.url], [eDefHtmlInputT('src', i.src, 25)+' '+brwButton]);
    content += eDefHtmlRow([L.w+' x '+L.h], [eDefHtmlInputT('width', i.width, 3)+' x '+eDefHtmlInputT('height', i.height, 3)]);
    content += eDefHtmlRow([L.alt], [eDefHtmlInputT('alt', i.alt, 25)]);
  }
  else if (type == 'link') {
    editor.G.selObj = editor.parseTag(editor.active.getSelection(), 'a');
    var a = editor.G.selObj ? editor.G.selObj.attributes : {};
    content += eDefHtmlRow([L.url], [eDefHtmlInputT('href', a.href, 25)+' '+brwButton]);
    content += eDefHtmlRow([L.tt], [eDefHtmlInputT('title', a.title, 25)]);
  }
  content += '</table><div>'+ eDefHtmlInput('submit', 'ok', L.ok, '') +'</div></div></form>';
  editor.dialog.open(L.title, content);
}

//open the file browser of the given type using the given URL.
function eDefFileBrowser(brwURL, type, form) {
  var fields = {image : 'src', link : 'href'};
  eDefImceUrl = form ? form.elements[fields[type]].value : '';
  window.open(brwURL, 'eDef', 'width=640, height=480, resizable=1');
}

//IMCE custom URL and custom finishing function. IMCE js API.
var eDefImceUrl = '';
function eDefImceFinish(url, width, height, fsize, win) {
  var el = document.forms['eDialogForm'].elements;
  if (el['src']) {
    el['src'].value = url;
    el['width'].value = width;
    el['height'].value = height;
  }
  else if (el['href']) {
    el['href'].value = url;
  }
  win.close();
}

//Display help text(button title) for each button of the editor.
function eDefHelp() {
  var b, E = editor.active;
  if (typeof editor.G.help == 'undefined') {
    editor.G.help = '<table id="editor-help">';
    for (var i=0; b=E.buttons[i]; i++) {
      editor.G.help += '<tr><td><input type="'+b.type+'" class="'+b.className+'"'+(b.src?'src="'+b.src+'"' : 'value="'+b.value+'"')+' /></td><td>'+b.title+'</td></tr>';
    }
    editor.G.help += '</table>';
  }
  editor.dialog.open(editor.buttons[E.bindex][0], editor.G.help);
}
