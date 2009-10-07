// $Id$

//Miscellaneous helpful methods: E.wrapLines(), E.toggleTag(), E.help(), E.tagChooser(), E.tagDialog()
//Requires: bue.popup.js, bue.html.js
(function(E, $) {

//Wraps selected lines with b1 & b2 and then wrap the result with a1 & a2. Also restores a wrapped selection.
E.wrapLines = function(a1, b1, b2, a2) {
  var E = this, str = E.getSelection().replace(/\r\n|\r/g, '\n'), Esc = BUE.regesc;
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

//Tag toggling. Add/remove tag after parsing the selection.
E.toggleTag = function(tag, attributes, cursor) {
  var E = this, S = E.getSelection(), O = BUE.parseHtml(S, tag);
  if (O) {
    return E.replaceSelection(O.html, cursor);
  }
  E.replaceSelection(BUE.html(tag, S, attributes), cursor);
  if (!S && !BUE.nctag(tag)) {
    var pos = E.posSelection().end - tag.length - 3;
    E.makeSelection(pos, pos);
  }
  return E;
};

//Display help text(button title) of each button.
E.help = function(effect) {
  var E = this;
  if (!E.helpHTML) {
    var akey = E.ctrlKeys ? 'Ctrl' : ($.browser.mozilla ? 'Shift + Alt' : ($.browser.msie ? 'Alt' : ''));
    for (var B, rows = [], i = 0; B = E.buttons[i]; i++) {
      rows[i] = [BUE.input(B.type, null, B.value || null, {'class': B.className, 'src': B.src || null}), B.title];
      if (B.accessKey && akey) {
        rows[i][1] += ' (' + akey + ' + ' + B.accessKey + ')';
      }
    }
    E.helpHTML = BUE.table(rows, {'id': 'bue-help'});
  }
  E.quickPop.open(E.helpHTML, effect);
  return E;
};

//create clickable tag options that insert corresponding tags into the editor.[[tag, title, attributes],[...],...]
E.tagChooser = function(tags, opt) {
  var E = this, opt = $.extend({wrapEach: 'li', wrapAll: 'ul', applyTag: true, effect: 'fadeIn'}, opt);
  var wa = BUE.html(opt.wrapAll || 'div', '', {'class': 'tag-chooser'}), $wa = $html(wa);
  var we = BUE.html(opt.wrapEach, '', {'class': 'choice'});
  var lnk = BUE.html('a', '', {href: '#', 'class': 'choice-link'});
  for (var i in tags) {
    var data = {nc: BUE.nctag(tags[i][0]), html: BUE.html(tags[i][0], tags[i][1], tags[i][2])}, $lnk = $html(lnk);
    $lnk.html(opt.applyTag ? data.html : tags[i][1]).bind('click', data, function(e) {
      var h = e.data.html, p1 = h.substr(0, h.indexOf('>')+1);
      e.data.nc ? E.replaceSelection(p1).focus() : E.tagSelection(p1, h.substr(h.lastIndexOf('<'))).focus();
      return false;
    }).appendTo($wa)[we ? 'wrap' : 'end'](we);
  }
  E.quickPop.open($wa, opt.effect);
  return E;
};

//open a dialog for a tag to get user input for the given attributes(fields).
E.tagDialog = function(tag, fields, opt) {
  var E = this, S = E.getSelection(), O = BUE.parseHtml(S, tag) || {'attributes': {}};
  for (var field, rows = [], i = 0, n = 0; field = fields[i]; i++, n++) {
    field = fproc(field, O, S);
    rows[n] = [field.title, fhtml(field)];
    while (field.getnext && (field = fields[++i])) {
      rows[n][1] += fhtml(fproc(field, O, S));
    }
  }
  var opt = $.extend({title: Drupal.t('Tag editor - @tag', {'@tag': tag.toUpperCase()}), stitle: Drupal.t('OK'), validate: false, submit: function(a, b) {return E.tgdSubmit(a, b)}, effect: 'show'}, opt);
  var table = BUE.table(rows, {'class': 'bue-tgd-table'})
  var sbm = BUE.html('div', BUE.input('submit', 'bue_tgd_submit', opt.stitle));
  var $form = $html(BUE.html('form', table + sbm, {name: 'bue_tgd_form', id: 'bue-tgd-form'}));
  E.dialog.open(opt.title, $form, opt.effect);
  $form.submit(function(){return fsubmit(tag, this, E, opt)})[0].elements[0].focus();
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
  if (typeof O.html == 'string' || BUE.nctag(tag)) {
    E.replaceSelection(BUE.html(tag, O.html, O.attributes));
 }
  else {
    var h = BUE.html(tag, '', O.attributes);
    E.tagSelection(h.substr(0, h.length - tag.length - 3), '</'+ tag +'>');
  }
  return E;
};

//helpers
var $html = BUE.$html;
//create field html
var fhtml = function (f) {
  var h = f.prefix || '';
  switch (f.type) {
    case 'select': h += BUE.selectbox(f.fname, f.value, f.options || {}, f.attributes); break;
    case 'textarea': h += BUE.html('textarea', '\n' + f.value, f.attributes); break;
    default: h += BUE.input('text', f.fname, f.value, f.attributes); break;
  }
  return h + (f.suffix || '');
};
//process field
var fproc = function(f, O, S) {
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
//tag dialog form submit
var fsubmit = function(tag, form, E, opt) {
  //check required fields.
  for (var el, i = 0; el = form.elements[i]; i++) if ($(el).is('.required') && !el.value) {
    $(el).fadeOut('fast', function(){$(this).fadeIn('fast').focus()});
    return false;
  }
  //custom validate
  var V = opt.validate;
  if (V && $.isFunction(V)) {
    try {if (!V(tag, form)) return false} catch(e) {alert(e.name +': '+ e.message)};
  }
  E.dialog.close();
  //custom submit
  var S = opt.submit;
  S = typeof S == 'string' ? window[S] : S;
  if (S && $.isFunction(S)) {
    try {S(tag, form)} catch(e) {alert(e.name +': '+ e.message)};
  }
  return false;
};

})(BUE.instance.prototype, jQuery);

//backward compatibility.
eDefSelProcessLines = eDefTagLines = function (a, b, c, d) {BUE.active.wrapLines(a, b, c, d)};
eDefTagger = function(a, b, c) {BUE.active.toggleTag(a, b, c)};
eDefHelp = function(fx) {BUE.active.help(fx)};
eDefTagDialog = function(a, b, c, d, e, f) {BUE.active.tagDialog(a, b, {title: c, stitle: d, submit: e, effect: f})};
eDefTagInsert = function(a, b) {BUE.active.tgdSubmit(a, b)};
eDefTagChooser = function(a, b, c, d, e) {BUE.active.tagChooser(a, {applyTag: b, wrapEach: c, wrapAll: d, effect: e})};