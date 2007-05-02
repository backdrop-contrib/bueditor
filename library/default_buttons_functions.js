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

//enclose each line in the given text with the given tags.
function eDefProcessLines(text, tagA, tagB) {
  return tagA+ text.replace(/(\r?\n|\r)/g, tagB+'$1'+tagA) +tagB;
}
//enclose lines in the selected text with inA and inB and then enclose the resulting text with outA and outB. If the selected text was processed before, restore it.
function eDefSelProcessLines(outA, inA, inB, outB) {
  var match, E = editor.active, sel = E.getSelection().replace(/\r\n|\r/g, '\n');
  if (!sel) E.tagSelection(outA+inA, inB+outB);
  else if (match = sel.match(new RegExp('^'+ editor.regEsc(outA) + editor.regEsc(inA) +'((.|\n)*)'+ editor.regEsc(inB) + editor.regEsc(outB) +'$'))) {
    E.replaceSelection(match[1].replace(new RegExp(editor.regEsc(inB) +'\n'+ editor.regEsc(inA), 'g'), '\n'));
  }
  else E.replaceSelection(outA+eDefProcessLines(sel, inA, inB)+outB);
}

//return html for the given tag. attributes having value=null are not printed.
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

//returns selectbox. options is the object having property:value pairs.
function eDefSelectBox(name, value, options, attributes) {
  var options = options||[], output = '';
  for (var i in options) {
    output += eDefHTML('option', options[i], {value: i, selected: i == value ? 'selected' : null});
  }
  typeof(attributes) == 'object' ? (attributes.name = name) : (attributes = {'name': name});
  return eDefHTML('select', output, attributes);
}

//return a table row containing the cells(array of strings or objects(data:string, attributes:object))
function eDefRow(cells, attributes) {
  var html = '';
  for (var i in cells) {
    html += typeof(cells[i]) == 'string'  ? eDefHTML('td', cells[i]) : eDefHTML('td', cells[i]['data'], cells[i]['attributes']);
  }
  return eDefHTML('tr', html, attributes);
}
function eDefTable(rows, attributes) {
  var row, html = '';
  for (var i=0; row=rows[i]; i++) {
    html += typeof(row['data']) == 'undefined' ? eDefRow(row) : eDefRow(row['data'], row['attributes']);
  }
  return eDefHTML('table', html, attributes);
}

//Previews the textarea content. By default, lines and paragraphs break automatically. Set NoAutoP=true to preview pure html. Set selOnly=true to preview only the selected text.
function eDefPreview(NoAutoP, selOnly) {
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
    var html = selOnly ? E.getSelection() : T.value;
    html = NoAutoP ? html : eDefAutoP(html);
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

//Display help text(button title) for each button of the editor.
function eDefHelp() {
  var b, rows = [], E = editor.active;
  if (typeof eDefHelpHTML == 'undefined') {
    for (var i=0; b=E.buttons[i]; i++) {
      rows[i] = [eDefInput(b.type,'', b.value||'', {'class': b.className, src: b.src||null}), b.title];
    }
    eDefHelpHTML = eDefTable(rows, {id: 'editor-help'});
  }
  editor.dialog.open(editor.buttons[E.bindex][0], eDefHelpHTML);
}

//html for file browser button..
function eDefBrowseButton(url, field, text, type) {
  return url ? eDefInput('button', 'brw', text||'Browse', {onclick: 'eDefFileBrowser(\''+ url +'\', this.form.elements[\''+ field +'\'].value, \''+ type +'\')'}) : '';
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
  var val = {src: url, href: url, width: width, height: height}
  for (var i in val) {
    if (el['attr_'+i]) el['attr_'+i].value = val[i];
  }
  win.close();
}

//open a dialog for any tag to get user input for the given attributes(fields).
function eDefTagDialog(tag, fields, dtitle, stitle, func) {
  var field, title, html, rows = [], obj = eDefParseTag(editor.active.getSelection(), tag)||{attributes: []};
  for (var i=0; field=fields[i]; i++) {
    if (typeof(field) == 'string') field = {name: field};
    title  = typeof(field['title']) == 'string' ? field['title'] : field['name'].substr(0, 1).toUpperCase() + field['name'].substr(1);
    html = eDefAttrField(field, obj.attributes[field['name']]);
    while (field['getnext'] && (field = fields[++i])) {
      if (typeof(field) == 'string') field = {name: field};
      html += eDefAttrField(field, obj.attributes[field['name']]);
    }
    rows[rows.length] = [title, html];
  }
  html = eDefTable(rows, {'class': 'editor-tagedit'}) +'<br />'+ eDefHTML('input', '', {type: 'submit', value: stitle||null});
  html = eDefHTML('form', html, {name: 'eDefForm', onsubmit: (func||'eDefTagInsert')+'(\''+ tag +'\', this); return false;'});
  editor.dialog.open(dtitle||(tag.toUpperCase() +' Tag Dialog'), html);
}

//return form element html for a given attribute(field)
function eDefAttrField(field, value) {
  var value = typeof(value) == 'string' ? value : (field['value']||'');
  var html = field['prefix']||'';
  if (field['type'] == 'select') {
    html += eDefSelectBox('attr_'+ field['name'], value, field['options'], field['attributes']);
  }
  else {
    html += eDefInput('text', 'attr_'+ field['name'], value, field['attributes']);
  }
  return html + (field['suffix']||'');
}

//create and insert the html for the tag with user-supplied form values.
function eDefTagInsert(tag, form) {try {
  var name, el, obj = eDefParseTag(editor.active.getSelection(), tag)||{attributes: []};
  for (var i=0; el = form.elements[i]; i++) {
    if (el.name.substr(0, 5) == 'attr_') {
      name = el.name.substr(5);
      obj.attributes[name] = el.value == '' ? (tag == 'img' && editor.inArray(name, ['src', 'alt']) ? '' : null) : el.value;
    }
  }
  editor.dialog.close();
  if (typeof(obj.innerHTML) == 'string' || editor.inArray(tag, ['img', 'input', 'hr', 'br'])) {
    editor.active.replaceSelection(eDefHTML(tag, obj.innerHTML, obj.attributes));
  }
  else {
    var txt = eDefHTML(tag, '', obj.attributes);
    editor.active.tagSelection(txt.substr(0, txt.length-tag.length-3), '</'+ tag +'>');
  }
} catch(e){}}


//if the given text matches html syntax of the given tag, return attributes and innerHMTL of it, otherwise return null.
eDefParseTag = function (text, tag) {
  var result, arr = [], attr = [];
  var re = new RegExp('^<'+ tag +'([^>]*)'+ (editor.inArray(tag, ['img', 'input', 'hr', 'br']) ? '' : ('>((.|[\r\n])*)<\/'+tag)) +'>$');
  if (result = re.exec(text)) {
    if ((arr = result[1].split('"')).length>1) {
      for (var i=0; typeof(arr[i+1])!='undefined'; i+=2) attr[arr[i].replace(/\s|\=/g, '')] = arr[i+1];
    }
    return {attributes : attr, innerHTML : result[2]||''};
  }
  return null;
}


//THIS IS HERE FOR BACKWARD COMPATIBILITY.
//eDefFileDialog is deprecated. the new eDefTagDialog allows to open dialogs for any tag and any attribute.
//file dialog for the type. labels are interface texts. bURL is the URL of the file browser.
function eDefFileDialog(type, L, bURL) {
  if (type == 'image'){
    var form = [
      {name: 'src', title: L.url, 'suffix': eDefBrowseButton(bURL, 'attr_src', L.brw, 'image')},
      {name: 'width', title: L.w +' x '+ L.h, suffix: ' x ', getnext: true, attributes: {size: 3}},
      {name: 'height', attributes: {size: 3}},
      {name: 'alt', title: L.alt}
    ];
    eDefTagDialog('img', form, L.title, L.ok);
  }
  else if (type == 'link') {
    var form = [
      {name: 'href', title: L.url, 'suffix': eDefBrowseButton(bURL, 'attr_href', L.brw, 'link')},
      {name: 'title', title: L.tt}
    ];
    eDefTagDialog('a', form, L.title, L.ok);
  }
}
