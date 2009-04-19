// $Id$

//Global container
var BUE = {
  'preset': {push: function(arr) {this[arr[0]] = arr[1];}},
  'instances': [],
  'popups': {},
  'dialog': {},
  'templates': {},
  'mode': (window.getSelection || document.getSelection) ? 1 : (document.selection && document.selection.createRange ? 2 : 0 )
};

//Get editor settings from Drupal.settings and process preset textareas.
BUE.behavior = function(context) {
  if (Drupal.settings.BUE) {
    $.each(Drupal.settings.BUE.templates||{}, function (id, tpl) {
      BUE.templates[id] = BUE.templates[id] || $.extend({}, tpl);
    });
    Drupal.settings.BUE.templates = {};
    $.each(Drupal.settings.BUE.preset||{}, function (id, tplid) {
      BUE.preset[id] = BUE.preset[id] || tplid;
    });
    Drupal.settings.BUE.preset = {};
  }
  $.each(BUE.preset, function (tid, tplid) {
    BUE.processTextarea($('#'+ tid, context).get(0), tplid);
  });
};

//editor settle.
BUE.initiate = function () {
  (Drupal.behaviors.BUE = BUE.behavior)(document);
  //set editor quickPop.
  var qp = BUE.quickPop = BUE.createPopup('bue-quickpop');
  $(qp.rows[0]).hide();
  qp.oldopen = qp.open;
  qp.open = function(content, effect) {
    qp.oldopen(null, content, effect);
    $(document).mousedown(qpToEnd);
    function qpToEnd() {$(document).mouseup(qpEnd);}
    function qpEnd() {$(document).unbind('mousedown', qpToEnd).unbind('mouseup', qpEnd); qp.close();}
  };
  //set editor dialog
  BUE.dialog.popup = BUE.createPopup('bue-dialog');
  BUE.dialog.popup.close = function (effect) {BUE.dialog.close(effect);}
  //fix enter key triggering button click on autocomplete fields.
  $('input.form-autocomplete').keydown(function(e) {return e.keyCode != 13});
};

//integrate editor template into textarea T
BUE.processTextarea = function (T, tplid) {
  var T = typeof(T) == 'string' ? $('#'+ T).get(0) : T;
  if (!BUE.templates[tplid] || !T || !T.tagName || T.tagName != 'TEXTAREA' || $(T).is(':hidden')) return false;
  if (T.editor) return T.editor;
  var E = new BUE.instance(T, tplid);
  $(T).focus(function () {
    if (!(BUE.active == this.editor || BUE.dialog.editor)) {
      BUE.active.accesskeys(false);
      BUE.active = this.editor;
      BUE.active.accesskeys(true);
    }
  });
  $.each(E.buttons, function(i) {
    var arr = this.id.split('-');
    this.eindex = arr[1];
    this.bid = arr[3];
    this.bindex = i;
    this.onclick = function(){return BUE.buttonClick(this.eindex, this.bindex)};
  });
  if (E.index == 0) {
    BUE.active = E;
  }
  else if (BUE.active.textArea.disabled) {
    BUE.active.accesskeys(false);
    BUE.active = E;
  }
  else {
    E.accesskeys(false);
  }
  return E;
};

//create an editor instance
BUE.instance = function (T, tplid) {
  this.index = BUE.instances.length;
  this.textArea = T;
  this.textArea.editor = BUE.instances[this.index] = this;
  this.tpl = BUE.templates[tplid];
  this.UI = $(BUE.theme(tplid).replace(/\%n/g, this.index)).insertBefore(T);
  this.buttons = $('input.bue', this.UI).get();
  this.bindex = null;
  this.focus = function () {
    this.textArea.focus();
    return this;
  };
  this.getContent = function () {
    return BUE.processText(this.textArea.value);
  };
  this.setContent = function (content) {
    var st = this.textArea.scrollTop;
    this.textArea.value = content;
    this.textArea.scrollTop = st;
    return this;
  };
  this.getSelection = function () {
    var pos = this.posSelection();
    return this.getContent().substring(pos.start, pos.end);
  };
  this.replaceSelection = function (txt, cursor) {
    var txt = BUE.processText(txt);
    var pos = this.posSelection();
    var content = this.getContent();
    this.setContent(content.substr(0, pos.start) + txt + content.substr(pos.end));
    var end = cursor == 'start' ? pos.start : pos.start+txt.length;
    var start = cursor == 'end' ? end : pos.start;
    this.makeSelection(start, end);
    return this;
  };
  this.tagSelection = function (left, right, cursor) {
    var left = BUE.processText(left);
    var right = BUE.processText(right);
    var llen = left.length;
    var pos = this.posSelection();
    var content = this.getContent();
    this.setContent(content.substr(0, pos.start) + left + content.substring(pos.start, pos.end) + right + content.substr(pos.end));
    var end = cursor=='start' ? pos.start+llen : pos.end+llen;
    var start = cursor=='end' ? end : pos.start+llen;
    this.makeSelection(start, end);
    return this;
  };
  this.makeSelection = function (start, end) {
    if (end < start) end = start;
    BUE.selMake(this.textArea, start, end);
    if (BUE.dialog.esp) BUE.dialog.esp = {'start': start, 'end': end};
    return this;
  };
  this.posSelection = function () {
    return BUE.dialog.esp ? BUE.dialog.esp : BUE.selPos(this.textArea);
  };
  this.buttonsDisabled = function (state, bindex) {
    for (var B, i=0; B = this.buttons[i]; i++) {
      B.disabled = i == bindex ? !state : state;
    }
    return this;
  };
  this.accesskeys = function (state) {
    for (var B, i=0; B = this.buttons[i]; i++) {
      B.accessKey = state ? this.tpl.buttons[B.bid][3] : '';
    }
    return this;
  };
};

//execute button's click event
BUE.buttonClick = function (eindex, bindex) { try {
  var E = BUE.active = BUE.instances[eindex];
  var domB = E.buttons[bindex];
  var tplB = E.tpl.buttons[domB.bid];
  var content = tplB[1];
  E.bindex = bindex;
  BUE.dialog.close();
  if (tplB[4]) {//execute button script.
    tplB[4](E);
  }
  else if (content) {//or insert content
    var arr = content.split('%TEXT%');
    if (arr.length == 2) E.tagSelection(arr[0], arr[1]);
    else E.replaceSelection(arr.length == 1 ? content : arr.join(E.getSelection()), 'end');
  }
  if (!$(domB).hasClass('stay-clicked')) E.focus();
  } catch (e) {alert(e.name +': '+ e.message);}
  return false;
};

//return html of editor template buttons
BUE.theme = function (tplid) {
  if (!BUE.templates[tplid]) return '';
  var ET = BUE.templates[tplid];
  if (ET.html) return ET.html;
  ET.html = '<div class="editor-container" id="editor-%n">';
  //B(0-title, 1-content, 2-icon or caption, 3-accesskey) and 4-function for js buttons
  for (var i = 0; B = ET.buttons[i]; i++) {
    var img = B[2].search(/\.(png|gif|jpg)$/i) != -1 ? ((new Image()).src = ET.iconpath +'/'+ B[2]) : null;
    B[4] = B[1].substr(0, 3) == 'js:' ? new Function('E', B[1].substr(3)) : null;//set functions for js buttons
    if (B[0].substr(0, 4) == 'tpl:') {//theme button.
      ET.html += B[4] ? B[4]() : B[1];
      ET.html += B[2] ? ('<span class="separator">'+ (img ? '<img src="'+ img +'" />' : B[2]) +'</span>') : '';
    }
    else {//functional button
      var attr = img ? ['image', 'image', 'src="'+ img +'" alt="'+ B[2] +'"'] : ['button', 'text', 'value="'+ B[2] +'"'];
      ET.html += '<input id="editor-%n-button-'+ i +'" title="'+ B[0] +'" accesskey="'+ B[3] +'" type="'+ attr[0] +'" class="bue editor-'+ attr[1] +'-button" '+ attr[2] +' />';
    }
  }
  ET.html += '</div>'; 
  return ET.html;
};

//general popup&dialog html
BUE.popHtml = '<table class="editor-popup" id="%id" style="position: absolute; display: none;"><tbody><tr class="head even"><td class="title">%tt</td><td class="close"><a>x</a></td></tr><tr class="body odd"><td colspan="2" class="cnt">%ct</td></tr></tbody></table>';

//create/open editor popup object
BUE.openPopup = function (id, title, content, effect) {
  var popup = BUE.createPopup(id);
  popup.open(title, content, effect);
  return popup;
}
BUE.createPopup = function (id, title, content) {
  if (BUE.popups[id]) {
    return BUE.popups[id];
  }
  var html = BUE.popHtml.replace('%id', id).replace('%tt', title||'').replace('%ct', content||'');
  var popup = BUE.popups[id] = $(html).appendTo(document.body).get(0);
  $(popup.rows[0]).mousedown(function (e) {
    var X = e.pageX;
    var Y = e.pageY;
    var pos = $(popup).offset();
    $(document).mousemove(doDrag).mouseup(endDrag);
    function doDrag(e) {
      popup.style.left = (pos.left+e.pageX-X) +'px';
      popup.style.top = (pos.top+e.pageY-Y) +'px';
      return false;
    }
    function endDrag(e) {
      $(document).unbind('mousemove', doDrag).unbind('mouseup', endDrag);
    }
  });
  $(popup.rows[0].cells[1].firstChild).click(function() {popup.close();});
  popup.open = function (title, content, effect) {
    if (typeof(title) == 'string') this.rows[0].cells[0].innerHTML = title;
    if (typeof(content) == 'string') this.rows[1].cells[0].innerHTML = content;
    var pos = $(BUE.active.buttons[BUE.active.bindex]).offset();
    this.style.left = pos.left-20 +'px';
    this.style.top = pos.top+10 +'px';
    this.editor = BUE.active;
    $(this)[effect||'show']();
  };
  popup.close = function (effect) {
    $(this)[effect||'hide']();
  };
  return popup;
};

//dialog functions
BUE.dialog.open = function (title, content, effect) {
  if (this.editor) this.close();
  this.editor = BUE.active;
  this.editor.buttonsDisabled(true);
  $(this.editor.buttons[this.editor.bindex]).addClass('stay-clicked');
  this.esp = this.editor.posSelection();
  this.popup.open(title, content, effect);
  this.oldfocus = this.editor.textArea.onfocus;
  this.editor.textArea.onfocus = function () {this.blur();};
};
BUE.dialog.close = function (effect) {
  if (this.editor) {
    this.editor.textArea.onfocus = this.oldfocus;
    this.editor.buttonsDisabled(false);
    $(this.editor.buttons[this.editor.bindex]).removeClass('stay-clicked');
    if (this.editor == BUE.active) {// restore previous states
      if (BUE.mode == 2) this.editor.makeSelection(this.esp.start, this.esp.end); // selection for IE
      else this.editor.focus(); // focus for FF
    }
    this.editor = null;
    this.esp = null;
    $(this.popup)[effect||'hide']();
  }
};

// browser specific functions.
BUE.processText = function (text) {return text;};//this is the default process
if (BUE.mode == 0) {//mode 0 - selection handling not-supported
  BUE.selPos = function (T) {return {'start': T.value.length, 'end': T.value.length};};
  BUE.selMake = function (T, start, end) {};
}
else if (BUE.mode == 1) {//mode 1 - Firefox, opera, safari.
  BUE.selPos = function (T) { return {'start': T.selectionStart||0, 'end': T.selectionEnd||0};};
  BUE.selMake = function (T, start, end) {T.setSelectionRange(start, end);};
}
else if (BUE.mode == 2) {//mode 2 - IE.
  BUE.selPos = function (T) {
    T.focus();
    var val = T.value.replace(/\r\n/g, '\n');
    var mark = '~`^'; //dummy text.
    for (var i = 0; val.indexOf(mark) != -1; i++) mark += mark.charAt(i); //make sure mark is unique.
    var mlen = mark.length;
    var range = document.selection.createRange();
    var bm = range.getBookmark();
    var slen = range.text.replace(/\r\n/g, '\n').length;
    range.text = mark;
    var tmp = T.value.replace(/\r\n/g, '\n');
    var start = tmp.indexOf(mark);
    for (var i = 0; tmp.charAt(start+i+mlen) == '\n'; i++);
    var end = start+slen;
    for (; val.charAt(end) == '\n'; end++);
    end -= i;
    T.value = val;
    if (start == end && !val.charAt(end)) range.collapse(false);//bookmark has problems with a cursor at the end
    else range.moveToBookmark(bm);
    range.select();
    return {'start': start, 'end': end};
  };
  BUE.selMake = function (T, start, end) {
    range = T.createTextRange();
    range.collapse();
    range.moveEnd('character', end);
    range.moveStart('character', start);
    range.select();
  };
  BUE.processText = function (text) {return text.replace(/\r\n/g, '\n')};
}

$(document).ready(BUE.initiate);
var editor = editor || BUE;//not to break old button scripts.
