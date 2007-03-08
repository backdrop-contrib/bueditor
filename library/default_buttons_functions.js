// $Id$
//collection of functions required for editor default buttons.

//Automatically break new lines as in Drupal preview. ported from original php function at http://photomatt.net/scripts/autop
function eDefAutoP(txt, br) {
  var br = typeof br == 'undefined' ? 1 : br;
  var txt = txt||'';
  if (!txt.match(/\n|\r/)) return txt;
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

//escape regular expression specific chaacters
function eDefRegEsc(text) {
  return text.replace(/([\\\^\$\*\+\?\.\(\)\[\]\{\}\|])/g, '\\$1');
}
//enclose each line in the given text with the given tags.
function eDefProcessLines(text, tagA, tagB) {
  return tagA+ text.replace(/(\r?\n|\r)/g, tagB+'$1'+tagA) +tagB;
}
//enclose lines in the selected text with inA and inB and then enclose the resulting text with outA and outB. If the selected text was processed before, restore it.
function eDefSelProcessLines(outA, inA, inB, outB) {
  var match, E = editor.active, sel = E.getSelection().replace(/\r\n|\r/g, '\n');
  if (!sel) E.tagSelection(outA+inA, inB+outB);
  else if (match = sel.match(new RegExp('^'+ eDefRegEsc(outA) + eDefRegEsc(inA) +'((.|\n)*)'+ eDefRegEsc(inB) + eDefRegEsc(outB) +'$'))) {
    E.replaceSelection(match[1].replace(new RegExp(eDefRegEsc(inB) +'\n'+ eDefRegEsc(inA), 'g'), '\n'));
  }
  else E.replaceSelection(outA+eDefProcessLines(sel, inA, inB)+outB);
}

//return html for the given tag.
function eDefHTML(tag, innerHTML, attributes) {
  var attributes = attributes||[];
  var html = '<'+ tag;
  for (var i in attributes) {
    html += attributes[i] == null ? '' : ' '+ i +'="'+ attributes[i] +'"';
  }
  html += editor.inArray(tag, ['img', 'input', 'hr', 'br']) ? ' />' : '>'+ innerHTML +'</'+ tag +'>';
  return html;
}

//returns form input html.
function eDefInput(type, name, value, attributes) {
  var a = {'type': type, 'name': name, 'value': value||''}, b = attributes||{};
  for (var i in b) a[i] = b[i];
  return eDefHTML('input', '', a);
}
function eDefInputText(name, value, size) {
  return eDefInput('text', name, value, {'size': size||null});
}
function eDefInputSubmit(name, value) {
  return eDefInput('submit', name, value);
}

//return a table row containing the cells(arguments of the function). eDefRow(cell1, cell2 ...)
function eDefRow(cells, attributes) {
  var cell, html = '';
  for (var i=0; cell=cells[i]; i++) {
    html += cell['data'] ? eDefHTML('td', cell['data'], cell['attributes']) : eDefHTML('td', cell);
  }
  return eDefHTML('tr', html, attributes);
}
function eDefTable(rows, attributes) {
  var row, html = '';
  for (var i=0; row=rows[i]; i++) {
    html += row['data'] ? eDefRow(row['data'], row['attributes']) : eDefRow(row);
  }
  return eDefHTML('table', html, attributes);
}

//Previews the selected text in the textarea. If there is no selection, previews the whole content. By default lines and paragraphs break automatically. Pure HTML preview is eDefPreview('full')
function eDefPreview(NoAutoP) {
  var P, E = editor.active, T = E.textArea;
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
    P.style.display = 'block';
    P.style.height = T.style.height||(T.offsetHeight+'px');
    P.style.width = T.style.width||(T.offsetWidth+'px');
    P.innerHTML = '<div class="node"><div class="content">'+ html +'</div></div>';
    T.style.height = '1px';
    E.buttonsDisabled(true, E.bindex);
    editor.addClass(E.buttons[E.bindex], 'stay-clicked');
  }
  else {
    editor.delClass(E.buttons[E.bindex], 'stay-clicked');
    E.buttonsDisabled(false);
    T.style.height = P.style.height;
    P.style.display = 'none';
  }
}

//Insert the data in the given form to the textarea. Link and image dialogs use this function.
function eDefFileInsert(form, type) {
  var el, file = editor.G.selFile||{attributes: []}, E = editor.active;
  for (var i=0; el = form.elements[i]; i++) {
    if (el.name.substr(0, 5) == 'file_') {
      file.attributes[el.name.substr(5)] = el.value == '' ? (editor.inArray(el.name, ['file_src', 'file_alt']) ? '' : null) : el.value;
    }
  }
  editor.dialog.close();
  if (type == 'image') {
    E.replaceSelection(eDefHTML('img', '', file.attributes));
  }
  else if (type == 'link') {
    if (typeof file.innerHTML == 'string') {
      E.replaceSelection(eDefHTML('a', file.innerHTML, file.attributes));
    }
    else {
      var a = eDefHTML('a', '', file.attributes);
      E.tagSelection(a.substr(0, a.length-4), '</a>');
    }
  }
  editor.G.selFile = null;
}

//file dialog for the type. labels are interface texts. browser is URL of the file browser.
function eDefFileDialog(type, labels, bURL) {
  var row, html, sel = editor.active.getSelection();
  var field = ({image : {name: 'src', tag: 'img'}, link : {name: 'href', tag: 'a'}})[type];
  var bButton = bURL ? ' '+eDefInput('button', 'brw', labels.brw, {onclick: 'eDefFileBrowser(\''+ bURL +'\', this.form.elements[\'file_'+ field.name +'\'].value, \''+ type +'\')'}) : '';
  var file = (editor.G.selFile = editor.parseTag(sel, field.tag)||{attributes: []}).attributes;
  var rows = [[labels.url, eDefInputText('file_'+ field.name, file[field.name], 25)+bButton]];
  if (type == 'image') {
    rows[rows.length] = [labels.w +' x '+ labels.h, eDefInputText('file_width', file.width, 3) +' x '+ eDefInputText('file_height', file.height, 3)];
    rows[rows.length] = [labels.alt, eDefInputText('file_alt', file.alt, 25)];
  }
  else if (type == 'link') {
    rows[rows.length] = [labels.tt, eDefInputText('file_title', file.title, 25)];
  }
  for (var i=3; i<arguments.length; i++) rows[rows.length] = arguments[i];//insert additional arguments as rows.
  html = eDefTable(rows) + eDefHTML('div', eDefInputSubmit('ok', labels.ok));
  html = eDefHTML('form', html, {name: 'eDefForm', onsubmit: 'eDefFileInsert(this, \''+ type +'\'); return false;'});
  editor.dialog.open(labels.title, html);
}

//open the file browser.
function eDefFileBrowser(bURL, fURL, type) {
  eDefImceUrl = fURL;
  window.open(bURL, 'eDef', 'width=640, height=480, resizable=1');
}

//IMCE custom URL and custom finishing function. IMCE js API.
var eDefImceUrl = '';
function eDefImceFinish(url, width, height, fsize, win) {
  var el = document.forms['eDefForm'].elements;
  if (el['file_src']) {
    el['file_src'].value = url;
    el['file_width'].value = width;
    el['file_height'].value = height;
  }
  else if (el['file_href']) {
    el['file_href'].value = url;
  }
  win.close();
}

//Display help text(button title) for each button of the editor.
function eDefHelp() {
  var b, rows = [], E = editor.active;
  if (typeof editor.G.help == 'undefined') {
    for (var i=0; b=E.buttons[i]; i++) {
      rows[i] = [eDefInput(b.type,'', b.value||'', {'class': b.className, src: b.src||null}), b.title];
    }
    editor.G.help = eDefTable(rows, {id: 'editor-help'});
  }
  editor.dialog.open(editor.buttons[E.bindex][0], editor.G.help);
}
