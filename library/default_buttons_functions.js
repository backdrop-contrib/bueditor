// $Id$
//collection of functions required for default buttons.

//Automatically break new lines like in Drupal preview. ported from the php equivalent http://photomatt.net/scripts/autop
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

//enclose lines in the selected text with inA and inB and then enclose the resulting text with outA and outB. If the selected text was processed before, restore it.
function eDefTagLines(outA, inA, inB, outB) {
  var match, E = BUE.active, sel = E.getSelection().replace(/\r\n|\r/g, '\n');
  if (!sel) E.tagSelection(outA+inA, inB+outB);
  else if (match = sel.match(new RegExp('^'+ eDefRegEsc(outA) + eDefRegEsc(inA) +'((.|\n)*)'+ eDefRegEsc(inB) + eDefRegEsc(outB) +'$'))) {
    E.replaceSelection(match[1].replace(new RegExp(eDefRegEsc(inB) +'\n'+ eDefRegEsc(inA), 'g'), '\n'));
  }
  else E.replaceSelection(outA + inA + sel.replace(/(\r?\n|\r)/g, inB +'$1'+ inA) + inB + outB);
}
eDefSelProcessLines = eDefTagLines;//backwards compatibility.

//return html for the given tag. attributes having value=null are not printed.
function eDefHTML(tag, innerHTML, attributes) {
  var attr = attributes||{}, inner = innerHTML||'';
  var html = '<'+ tag;
  for (var i in attr) {
    html += attr[i] == null ? '' : ' '+ i +'="'+ attr[i] +'"';
  }
  html += eDefNoEnd(tag) ? (' />'+ inner) : ('>'+ inner +'</'+ tag +'>');
  return tag ? html : inner;
}
//check if the tag is non-closing
function eDefNoEnd(tag) {
  return !tag || $.inArray(tag, ['img', 'input', 'hr', 'br', 'embed']) > -1;
}

//returns form input html.
function eDefInput(type, name, value, attributes) {
  return eDefHTML('input', '', $.extend({'type': type, 'name': name, 'value': value||null}, attributes));
}
function eDefInputText(name, value, size) {
  return eDefInput('text', name, value, {'size': size||null});
}
function eDefInputSubmit(name, value) {
  return eDefInput('submit', name, value);
}

//returns selectbox. options is the object having property:value pairs.
function eDefSelectBox(name, value, options, attributes) {
  var options = options||{}, html = '';
  for (var i in options) {
    html += eDefHTML('option', options[i], {'value': i, 'selected': i == value ? 'selected' : null});
  }
  return eDefHTML('select', html, $.extend({}, attributes, {'name': name}));
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
  var E = BUE.active, T = $(E.textArea);
  if (!E.preview) {
    E.preview = $(document.createElement('div')).addClass('preview').css({'display': 'none', 'overflow': 'auto'}).insertBefore(T);
  }
  var P =  E.preview; 
  if (P.css('display') == 'none') {
    var html = selOnly ? E.getSelection() : T.val();
    html = NoAutoP ? html : eDefAutoP(html);
    P.show().height(T.height()).width(T.width()).html('<div class="node"><div class="content">'+ html +'</div></div>');
    T.height(1);
    E.buttonsDisabled(true, E.bindex);
    $(E.buttons[E.bindex]).addClass('stay-clicked');
  }
  else {
    $(E.buttons[E.bindex]).removeClass('stay-clicked');
    E.buttonsDisabled(false);
    T.height(P.height());
    P.hide();
  }
}

//Display help text(button title) for each button of the BUE.
function eDefHelp(effect) {
  var B, rows = [], E = BUE.active;
  if (typeof E.helpHTML == 'undefined') {
    for (var i = 0; B = E.buttons[i]; i++) {
      rows[i] = [eDefInput(B.type, null, B.value||null, {'class': B.className, 'src': B.src||null}), B.title];
    }
    E.helpHTML = eDefTable(rows, {'id': 'editor-help'});
  }
  BUE.quickPop.open(E.helpHTML, effect);
}

//html for file browser button..
function eDefBrowseButton(url, field, text, type) {
  return url ? eDefInput('button', 'brw', text||'Browse', {'onclick': 'eDefFileBrowser(\''+ url +'\', this.form.elements[\''+ field +'\'].value, \''+ type +'\')'}) : '';
}

//open the file browser.
function eDefFileBrowser(bURL, fURL, type) {
  eDefFileURL = fURL;
  if (typeof eDefImceWin == 'undefined' || eDefImceWin.closed) {//open popup
    eDefImceWin = window.open(bURL + (bURL.indexOf('?') < 0 ? '?' : '&') +'app=BUEditor|onload@eDefImceLoad', '', 'width='+ 760 +',height='+ 560 +',resizable=1');
  }
  else eDefImceHighlight();//if popup is already opened. highlight the file url.
  eDefImceWin.focus();//bring the popup into view
}

//Executed when imce loads. Sets a send to opearation.(title is "Send to BUEditor". files are send to eDefImceFinish)
function eDefImceLoad(win) {
  win.imce.setSendTo(Drupal.t('Send to @app', {'@app': 'BUEditor'}), eDefImceFinish);
  eDefImceHighlight();
  $(window).unload(function() {
    if (eDefImceWin && !eDefImceWin.closed) eDefImceWin.close();
  });
}

//IMCE complete
function eDefImceFinish(file, win) {
  var el = document.forms['eDefForm'].elements;
  var val = {'src': file.url, 'alt': file.name, 'href': file.url, 'width': file.width, 'height': file.height}
  for (var i in val) {
    if (el['attr_'+i]) el['attr_'+i].value = val[i];
  }
  win.blur();//or close()
  el[el.length-1].focus();//focus on last element.
}

//IMCE file highlight
function eDefImceHighlight() {
  eDefImceWin.imce.highlight(eDefFileURL.substr(eDefFileURL.lastIndexOf('/')+1));
}

//open a dialog for any tag to get user input for the given attributes(fields).
function eDefTagDialog(tag, fields, dtitle, stitle, func, effect) {
  var field, title, html, rows = [], sel = BUE.active.getSelection(), obj = eDefParseTag(sel, tag)||{'attributes': {}};
  for (var i=0; field = fields[i]; i++) {
    field = typeof(field) == 'string' ? {'name': field} : field;
    if (field.name == 'html') field.value =  typeof obj.innerHTML == 'string' ? obj.innerHTML : sel;
    title  = typeof(field.title) == 'string' ? field.title : field.name.substr(0, 1).toUpperCase() + field.name.substr(1);
    html = eDefAttrField(field, obj.attributes[field.name]);
    while (field.getnext && (field = fields[++i])) {
      if (typeof(field) == 'string') field = {'name': field};
      html += eDefAttrField(field, obj.attributes[field.name]);
    }
    rows[rows.length] = [title, html];
  }
  html = eDefTable(rows, {'class': 'editor-tagedit'}) +'<br />'+ eDefHTML('input', '', {'type': 'submit', 'value': stitle||null});
  html = eDefHTML('form', html, {'name': 'eDefForm', 'onsubmit': (func||'eDefTagInsert')+'(\''+ tag +'\', this); return false;'});
  BUE.dialog.open(dtitle||(tag.toUpperCase() +' Tag Dialog'), html, effect);
  try{document.forms['eDefForm'].elements[0].focus()} catch(e){};//try focusing on the first input
}

//return form element html for a given attribute(field)
function eDefAttrField(field, value) {
  var name = 'attr_'+ field.name;
  var value = (typeof(value) == 'string' ? value : (field.value||'')).replace(/</g, '&lt;').replace(/\"/g, '&quot;');
  var type = value.indexOf('\n') != -1 ? 'textarea' : (field.type||'text');
  var html = field.prefix||'';
  switch (type) {
    case 'select': html += eDefSelectBox(name, value, field.options, field.attributes); break;
    case 'textarea': html += eDefHTML('textarea', '\n'+value, $.extend({'name': name}, field.attributes)); break;
    default: html += eDefInput('text', name, value, field.attributes); break;
  }
  return html + (field.suffix||'');
}

//create and insert the html for the tag with user-supplied form values.
function eDefTagInsert(tag, form) {try{//this is a submit event.
  var name, el, obj = eDefParseTag(BUE.active.getSelection(), tag)||{'attributes': {}};
  for (var i = 0; el = form.elements[i]; i++) {
    if (el.name.substr(0, 5) == 'attr_') {
      name = el.name.substr(5);
      if (name == 'html') obj.innerHTML = el.value;
      else obj.attributes[name] = el.value == '' ? (tag == 'img' && (name == 'src' || name == 'alt') ? '' : null) : el.value;
    }
  }
  BUE.dialog.close();
  if (typeof(obj.innerHTML) == 'string' || eDefNoEnd(tag)) {
    BUE.active.replaceSelection(eDefHTML(tag, obj.innerHTML, obj.attributes));
  }
  else {
    var html = eDefHTML(tag, '', obj.attributes);
    BUE.active.tagSelection(html.substr(0, html.length-tag.length-3), '</'+ tag +'>');
  }
}catch(e){}}

//if the given text matches html syntax of the given tag, return attributes and innerHMTL of it, otherwise return null.
function eDefParseTag(text, tag) {
  var result, arr = [], attr = {};
  var re = new RegExp('^<'+ tag +'([^>]*)'+ (eDefNoEnd(tag) ? '' : ('>((.|[\r\n])*)<\/'+tag)) +'>$');
  if (result = re.exec(text)) {
    if ((arr = result[1].split('"')).length > 1) {
      for (var i = 0; typeof(arr[i+1]) != 'undefined'; i += 2) {
        attr[arr[i].replace(/\s|\=/g, '')] = arr[i+1];
      }
    }
    return {'attributes': attr, 'innerHTML' : result[2]||''};
  }
  return null;
}

//escape regular expression specific characters
function eDefRegEsc (text) {
  return text.replace(/([\\\^\$\*\+\?\.\(\)\[\]\{\}\|])/g, '\\$1');
};

//create clickable tag options that insert corresponding tags into the editor.[[tag, title, attributes],[...],...]
function eDefTagChooser(tags, applyTag, wrapEach, wrapAll, effect) {
  var content = '';
  var choice = eDefHTML(wrapEach, '<a href="javascript:void(0)" class="choice" onclick="eDefClickChoice(\'%tag\', \'%esc\')">%html</a>') +'\n';
  for (var i in tags) {
    var html = eDefHTML(tags[i][0], tags[i][1], tags[i][2]);
    content += choice.replace('%html', applyTag ? html : tags[i][1]).replace('%tag', tags[i][0]).replace('%esc', escape(html));
  }
  BUE.quickPop.open(eDefHTML(wrapAll, content, {'class': 'chooser'}), effect);
}
function eDefClickChoice(tag, html) {
  var html = unescape(html), partA = html.substr(0, html.indexOf('>')+1), E = BUE.active;
  eDefNoEnd(tag) ? E.replaceSelection(partA) : E.tagSelection(partA, html.substr(html.lastIndexOf('<')));
  E.focus();
}

//Tag toggling. if the selection is an instance of the tag remove the tag, otherwise insert it.
function eDefTagger(tag, attributes, cursor) {
  var E = BUE.active, sel = E.getSelection(), dom = eDefParseTag(sel, tag), html = eDefHTML(tag, sel, attributes);
  if (dom) E.replaceSelection(dom.innerHTML, cursor);
  else if (sel) E.replaceSelection(html, cursor);
  else E.tagSelection(html.substr(0, html.indexOf('>')+1), html.substr(html.lastIndexOf('<')), cursor);
}