// $Id$
//collection of functions required for default buttons.
(function(E) {

//html for a given tag. attributes having value=null are not printed.
BUE.html = function(tag, ihtml, attr) {
  var A = attr || {}, I = ihtml || '';
  var H = '<'+ tag;
  for (var i in A) {
    H += A[i] == null ? '' : ' '+ i +'="'+ A[i] +'"';
  }
  H += Nc(tag) ? (' />'+ I) : ('>'+ I +'</'+ tag +'>');
  return tag ? H : I;
};

//form input html.
BUE.input = function(t, n, v, a) {
  return Html('input', '', $.extend({'type': t, 'name': n, 'value': v||null}, a));
};

//selectbox html. opt has property:value pairs.
BUE.selectbox = function(n, v, opt, attr) {
  var opt = opt||{}, H = '';
  for (var i in opt) {
    H += Html('option', opt[i], {'value': i, 'selected': i == v ? 'selected' : null});
  }
  return Html('select', H, $.extend({}, attr, {'name': n}));
};

//table html
BUE.table = function(rows, attr) {
  for (var R, H = '', i = 0; R = rows[i]; i++) {
    H += typeof R['data'] == 'undefined' ? BUE.trow(R) : BUE.trow(R['data'], R['attr']);
  }
  return Html('table', H, attr);
};
BUE.trow = function(cells, attr) {
  for (var C, H = '', i = 0; C = cells[i]; i++) {
    H += typeof C['data'] == 'undefined' ? Html('td', C) : Html('td', C['data'], C['attr']);
  }
  return Html('tr', H, attr);
};

//Escape regular expression specific characters in a string
BUE.regesc = function (s) {
  return s.replace(/([\\\^\$\*\+\?\.\(\)\[\]\{\}\|\:])/g, '\\$1');
};

//Check if a string is a non closing html tag.
BUE.nctag = function (s) {
  return !s || s.search(/^(img|input|hr|br|embed)$/) > -1;
};

//Parse the string as html. If match an html element return properties, otherwise return null.
BUE.parseHtml = function(s, tag) {
  var r = new RegExp('^<('+ (tag || '[a-z][a-z0-9]*') +')([^>]*)>($|((?:.|[\r\n])*)</\\1>$)');
  if (!(match = s.match(r)) || (!match[3] && !Nc(match[1]))) {
    return null;
  }
  var tag = match[1], arr = [], attr = {}, match;
  if ((arr = match[2].split('"')).length > 1) {
    for (var i = 0; typeof(arr[i+1]) != 'undefined'; i += 2) {
      attr[arr[i].replace(/\s|\=/g, '')] = arr[i+1];
    }
  }
  return {tag: tag, attributes: attr, html: match[4]};
};

//Convert new line characters to html breaks or paragraphs. Ported from http://photomatt.net/scripts/autop
BUE.autop = function (s) {
  if (s == '' || s.search(/\n|\r/) == -1) {
    return s;
  }
  var  X = function(x, a, b) {return x.replace(new RegExp(a, 'g'), b)};
  var  R = function(a, b) {return s = X(s, a, b)};
	var blocks = '(table|thead|tfoot|caption|colgroup|tbody|tr|td|th|div|dl|dd|dt|ul|ol|li|pre|select|form|blockquote|address|math|style|script|object|input|param|p|h[1-6])';
	s += '\n';
  R('<br />\\s*<br />', '\n\n');
  R('(<' + blocks + '[^>]*>)', '\n$1');
  R('(</' + blocks + '>)', '$1\n\n');
  R('\r\n|\r', '\n'); // cross-platform newlines
  R('\n\n+', '\n\n');// take care of duplicates
  R('\n?((.|\n)+?)\n\\s*\n', '<p>$1</p>\n');// make paragraphs
  R('\n?((.|\n)+?)$', '<p>$1</p>\n');//including one at the end
  R('<p>\\s*?</p>', '');// under certain strange conditions it could create a P of entirely whitespace
  R('<p>(<div[^>]*>\\s*)', '$1<p>');
  R('<p>([^<]+)\\s*?(</(div|address|form)[^>]*>)', '<p>$1</p>$2');
  R('<p>\\s*(</?' + blocks + '[^>]*>)\\s*</p>', '$1');
  R('<p>(<li.+?)</p>', '$1');// problem with nested lists
  R('<p><blockquote([^>]*)>', '<blockquote$1><p>');
  R('</blockquote></p>', '</p></blockquote>');
  R('<p>\\s*(</?' + blocks + '[^>]*>)', '$1');
  R('(</?' + blocks + '[^>]*>)\\s*</p>', '$1');
  R('<(script|style)(.|\n)*?</\\1>', function(m0) {return X(m0, '\n', '<PNL>')});
  R('(<br />)?\\s*\n', '<br />\n');
  R('<PNL>', '\n');
  R('(</?' + blocks + '[^>]*>)\\s*<br />', '$1');
  R('<br />(\\s*</?(p|li|div|dl|dd|dt|th|pre|td|ul|ol)[^>]*>)', '$1');
  if (s.indexOf('<pre') != -1) {
    R('(<pre(.|\n)*?>)((.|\n)*?)</pre>', function(m0, m1, m2, m3) {
      return X(m1, '\\\\([\'\"\\\\])', '$1') + X(X(X(m3, '<p>', '\n'), '</p>|<br />', ''), '\\\\([\'\"\\\\])', '$1') + '</pre>';
    });
  }
  return R('\n</p>$', '</p>');
};

//IMCE integration
var f = {form: {}, value: '', focus: function(){}};
var I = E.imce = BUE.imce = {field: f};
$(function() {I.url = Drupal.settings.BUE.imceURL || ''});

//imce button
I.button = function(fname, text) {
  return I.url ? Input('button', 'bue_ib_'+ fname, text || t('Browse'), {'onclick': 'BUE.imce.open(this.form.elements[this.name.substr(7)])'}) : '';
};

//open imce
I.open = function(field) {
  I.field = field || f;
  if (!I.pop) {
    var url = I.url + (I.url.indexOf('?') < 0 ? '?' : '&') + 'app=bue|onload@bueImceLoad';
    I.pop = BUE.openPopup('bue-imce-pop', t('File Browser'), '<iframe src="'+ url +'"></iframe>');
  }
  else {
    I.pop.open();
    I.hlight();
  }
  var $p = $(I.pop), $w = $(window), o = $.browser.opera;
  var h = (o ? $w[0].innerHeight : $w.height()) - $p.height(), w = $w.width() - $p.width();
  $p.css({'top': $w.scrollTop() + Math.max(0, h/2), 'left': Math.max(0, w/2)});
};

//close imce & process file
I.finish = function(file, win) {
  I.field.value = file.url;
  var el = I.field.form.elements || {}, val = {'alt': file.name, 'width': file.width, 'height': file.height};
  for (var i in val) {
    if (el['attr_'+i]) el['attr_'+i].value = val[i];
  }
  I.pop.close();
  I.field.focus();
};

//highlight file
I.hlight = function() {
  I.win.imce.highlight(I.field.value.substr(I.field.value.lastIndexOf('/')+1));
};

//imce startup function.
window.bueImceLoad = function(win) {
  (I.win = win).imce.setSendTo(t('Send to editor'), I.finish);
  I.hlight();
};

//Show/hide content preview.
E.prv = function(safecheck) {
  var E = this;
  if (E.prvOn) {
    return E.prvHide();
  }
  var safecheck = typeof safecheck == 'undefined' ? true : safecheck;
  var content = E.getContent();
  if (safecheck && !(E.safeToPreview = E.safeToPreview || content.indexOf('<') == -1)) {
    content = '<div class="warning">' + t('The preview is disabled due to previously inserted HTML code in the content. This aims to protect you from any potentially harmful code inserted by other editors or users. If you own the content, just preview an empty text to re-enable the preview.') + '</div>';
  }
  return E.prvShow(BUE.autop(content));
};

//show preview with html inside.
E.prvShow = function(html, wrap) {
  var E = this;
  var $T = $(E.textArea);
  var $P = E.prvArea ? $(E.prvArea) : $(E.prvArea = document.createElement('div')).addClass('preview').css({'display': 'none', 'overflow': 'auto'}).insertBefore($T);
  if (typeof wrap == 'undefined' || wrap) {
    html = '<div class="'+ (E.textArea.name == 'comment' ? 'comment' : 'node') +'"><div class="content">' + html + '</div></div>';
  }
  if (E.prvOn) {
    $P.html(html);
    return E;
  }
  $P.show().height($T.height()).width($T.width()).html(html);
  $T.height(1);
  E.buttonsDisabled(true, E.bindex);
  $(E.buttons[E.bindex]).addClass('stay-clicked');
  E.prvOn = true;
  return E;
};

//Hide preview.
E.prvHide = function() {
  var E = this;
  if (E.prvOn) {
    var $P = $(E.prvArea);
    $(E.textArea).height($P.height());
    $P.hide();
    $(E.buttons[E.bindex]).removeClass('stay-clicked');
    E.buttonsDisabled(false);
    E.prvOn = false;
  }
  return E;
};

//Ajax preview. Requires ajax_markup module.
 E.prvAjax = function() {
  var E = this;
  if (E.prvOn) {
    return E.prvHide();
  }
  if (!$.ajaxMarkup) {
    return E.prvShow(t('Preview requires <a href="http://drupal.org/project/ajax_markup">Ajax markup</a> module with proper permissions set.'));
  }
  E.prvShow(t('Loading...'));
  $.ajaxMarkup(E.getContent(), $.ajaxMarkup.getFormat(E.textArea), function(output, status, request) {
    if (E.prvOn) {
      E.prvShow(status ? output : output.replace(/\n/g, '<br />'));
    }
  });
  return E;
};

//Wraps selected lines with b1 & b2 and then wrap the result with a1 & a2. Also restores a processed selection.
E.wrapLines = function(a1, b1, b2, a2) {
  var E = this, str = E.getSelection().replace(/\r\n|\r/g, '\n');
  if (!str) {
    return E.tagSelection(a1 + b1, b2 + a2);
  }
  var M, R = new RegExp('^' + Esc(a1 + b1) + '((.|\n)*)' + Esc(b2 + a2) + '$');
  if (M = str.match(R)) {
    R = new RegExp(Esc(b2) + '\n' + Esc(b1), 'g');
    return E.replaceSelection(M[1].replace(R, '\n'));
  }
  return E.replaceSelection(a1 + b1 + str.replace(/\n/g, b2 + '\n' + b1) + b2 + a2);
};

//Display help text(button title) of each button.
E.help = function(effect) {
  var E = this;
  if (!E.helpHTML) {
    var akey = E.ctrlKeys ? 'Ctrl' : ($.browser.mozilla ? 'Shift + Alt' : ($.browser.msie ? 'Alt' : ''));
    for (var B, rows = [], i = 0; B = E.buttons[i]; i++) {
      rows[i] = [Input(B.type, null, B.value || null, {'class': B.className, 'src': B.src || null}), B.title];
      if (B.accessKey && akey) {
        rows[i][1] += ' (' + akey + ' + ' + B.accessKey + ')';
      }
    }
    E.helpHTML = BUE.table(rows, {'id': 'bue-help'});
  }
  BUE.quickPop.open(E.helpHTML, effect);
  return E;
};

//Tag toggling. Add/remove tag after parsing the selection.
E.toggleTag = function(tag, attributes, cursor) {
  var E = this, S = E.getSelection(), O = BUE.parseHtml(S, tag);
  if (O) {
    return E.replaceSelection(O.html, cursor);
  }
  E.replaceSelection(Html(tag, S, attributes), cursor);
  if (!S && !Nc(tag)) {
    var pos = E.posSelection().end - tag.length - 3;
    E.makeSelection(pos, pos);
  }
  return E;
};

//open a dialog for a tag to get user input for the given attributes(fields).
E.tagDialog = function(tag, fields, opt) {
  var E = this, S = E.getSelection(), O = BUE.parseHtml(S, tag) || {'attributes': {}};
  //process field
  var fproc = function(f) {
    f = typeof(f) == 'string' ? {'name': f} : f;
    if (f.name == 'html') {
      f.value =  typeof O.html == 'string' ? O.html : (S || f.value || '');
    }
    f.value = Drupal.checkPlain(typeof O.attributes[f.name] == 'string' ? O.attributes[f.name] : (f.value || ''));
    f.title  = typeof f.title == 'string' ? f.title : f.name.substr(0, 1).toUpperCase() + f.name.substr(1);
    f.fname = 'attr_' + f.name;
    f.attributes = $.extend({name: f.fname, id: f.fname}, f.attributes);
    f.attributes['class'] = f.required ? (f.attributes['class'] || '') + ' required' : (f.attributes['class'] || null);
    f.type = f.value.indexOf('\n') > -1 ? 'textarea' : (f.type || 'text');
    return f;
  };
  //create field html
  var fhtml = function (f) {
    var h = f.prefix || '';
    switch (f.type) {
      case 'select': h += BUE.selectbox(f.fname, f.value, f.options || {}, f.attributes); break;
      case 'textarea': h += Html('textarea', '\n' + f.value, f.attributes); break;
      default: h += Input('text', f.fname, f.value, f.attributes); break;
    }
    return h + (f.suffix || '');
  };
  //create rows containing fields.
  for (var field, rows = [], i = 0, n = 0; field = fields[i]; i++, n++) {
    field = fproc(field);
    rows[n] = [field.title, fhtml(field)];
    while (field.getnext && (field = fields[++i])) {
      rows[n][1] += fhtml(fproc(field));
    }
  }
  //dialog options
  var opt = $.extend({title: t('Tag editor - @tag', {'@tag': tag.toUpperCase()}), stitle: t('OK'), func: function(a, b) {return E.tgdSubmit(a, b)}, effect: 'show'}, opt);
  //open the dialog containing the tag editing form
  var table = BUE.table(rows, {'class': 'bue-tgd-table'})
  var sbm = Html('div', Input('submit', 'bue_tgd_submit', opt.stitle));
  var $form = $(Html('form', table + sbm, {name: 'bue_tgd_form', id: 'bue-tgd-form'}));
  BUE.dialog.open(opt.title, $form, opt.effect);
  //form validate/submit
  $form.submit(function() {
    for (var el, i = 0; el = this.elements[i]; i++) if ($(el).is('.required') && !el.value) {
      $(el).fadeOut('fast', function(){$(this).fadeIn('fast').focus()});
      return false;
    }
    BUE.dialog.close();
    try {(typeof opt.func == 'string' ? window[opt.func] : opt.func)(tag, this)} catch(e) {alert(e.name +': '+ e.message)};
    return false;
  })[0].elements[0].focus();
  return E;
};

//default submit handler for tag form
E.tgdSubmit = function(tag, form) {
  var E = this, O = BUE.parseHtml(E.getSelection(), tag) || {'attributes': {}};
  for (var name, el, i = 0; el = form.elements[i]; i++) {
    if (el.name.substr(0, 5) == 'attr_') {
      name = el.name.substr(5);
      if (name == 'html') O.html = el.value;
      else O.attributes[name] = el.value.replace(/\x22/g, '&quot;').replace(/>/g, '&gt;').replace(/</g, '&lt;') || null;
    }
  }
  if (typeof O.html == 'string' || Nc(tag)) {
    E.replaceSelection(Html(tag, O.html, O.attributes));
 }
  else {
    var h = Html(tag, '', O.attributes);
    E.tagSelection(h.substr(0, h.length - tag.length - 3), '</'+ tag +'>');
  }
  return E;
};

//create clickable tag options that insert corresponding tags into the editor.[[tag, title, attributes],[...],...]
E.tagChooser = function(tags, opt) {
  var E = this, opt = $.extend({wrapEach: 'li', wrapAll: 'ul', applyTag: true, effect: 'fadeIn'}, opt);
  var wa = Html(opt.wrapAll || 'div', '', {'class': 'tag-chooser'}), $wa = $(wa);
  var we = Html(opt.wrapEach, '', {'class': 'choice'});
  var lnk = Html('a', '', {href: '#', 'class': 'choice-link'});
  for (var i in tags) {
    var data = {nc: Nc(tags[i][0]), html: Html(tags[i][0], tags[i][1], tags[i][2])}, $lnk = $(lnk);
    $lnk.html(opt.applyTag ? data.html : tags[i][1]).bind('click', data, function(e) {
      var h = e.data.html, p1 = h.substr(0, h.indexOf('>')+1);
      e.data.nc ? E.replaceSelection(p1).focus() : E.tagSelection(p1, h.substr(h.lastIndexOf('<'))).focus();
      return false;
    }).appendTo($wa)[we ? 'wrap' : 'end'](we);
  }
  BUE.quickPop.open($wa, opt.effect);
  return E;
};

//shortcuts
var Html = BUE.html;
var Input = BUE.input;
var Nc = BUE.nctag;
var Esc = BUE.regesc;
var t = Drupal.t;

})(BUE.instance.prototype);

//backward compatibility.
eDefHTML = BUE.html;
eDefInput = BUE.input;
eDefSelectBox = BUE.selectbox;
eDefTable = BUE.table;
eDefRow = BUE.trow;
eDefAutoP = BUE.autop;
eDefNoEnd = BUE.nctag;
eDefRegEsc = BUE.regesc;
eDefParseTag = BUE.parseHtml;
eDefInputText = function(n, v, s) {return BUE.input('text', n, v, {'size': s||null})};
eDefInputSubmit = function(n, v) {return BUE.input('submit', n, v)};
eDefBrowseButton = function(l, f, t) {return BUE.imce.button(f, t)};
eDefSelProcessLines = eDefTagLines = function (a, b, c, d) {BUE.active.wrapLines(a, b, c, d)};
eDefPreview = function() {BUE.active.prv()};
eDefPreviewShow = function(E, s, w) {E.prvShow(s, w)};
eDefPreviewHide = function(E) {E.prvHide()};
eDefAjaxPreview = function() {BUE.active.prvAjax()};
eDefHelp = function(fx) {BUE.active.help(fx)};
eDefTagDialog = function(a, b, c, d, e, f) {BUE.active.tagDialog(a, b, {title: c, stitle: d, func: e, effect: f})};
eDefTagInsert = function(a, b) {BUE.active.tgdSubmit(a, b)};
eDefTagger = function(a, b, c) {BUE.active.toggleTag(a, b, c)};
eDefTagChooser = function(a, b, c, d, e) {BUE.active.tagChooser(a, {applyTag: b, wrapEach: c, wrapAll: d, effect: e})};