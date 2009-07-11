// $Id$

//Global container
var BUE = {
  preset: {push: function(arr) {this[arr[0]] = arr[1];}},
  instances: [],
  popups: {},
  dialog: {},
  templates: {},
  mode: (window.getSelection || document.getSelection) ? ($.browser.opera ? 3 : 1) : (document.selection && document.selection.createRange ? 2 : 0 ),
  postprocess: []
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
  //fix enter key on autocomplete fields triggering button click.
  $('input.form-autocomplete', context).keydown(function(e) {return e.keyCode != 13});
};

//editor settle.
BUE.initiate = function () {
  //set editor quickPop.
  var Q = BUE.quickPop = BUE.createPopup('bue-quickpop');
  var endQ = function() {Q.close(); $(document).unbind('mouseup', endQ);};
  Q.oldopen = Q.open;
  Q.open = function(content, effect) {Q.oldopen(null, content, effect);$(document).mouseup(endQ);};
  $('.head:first', Q).hide();
  //set editor dialog.
  BUE.dialog.popup = BUE.createPopup('bue-dialog');
  BUE.dialog.popup.close = function (effect) {BUE.dialog.close(effect);}
  //set drupal behavior.
  (Drupal.behaviors.BUE = BUE.behavior)(document);
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
  $.each(E.buttons, function(i, B) {
    var arr = B.id.split('-'), k;
    B.eindex = arr[1];
    B.bid = arr[3];
    B.bindex = i;
    $(B).click(function(){return BUE.buttonClick(B.eindex, B.bindex)});
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
  //post process. this kind of loop does not miss processes added by processes.
  for (var F, i = 0; F = BUE.postprocess[i]; i++) {
    $.isFunction(F) && F(E);
  }
  return E;
};

//create an editor instance
BUE.instance = function (T, tplid) {
  var i = BUE.instances.length, E = T.editor = BUE.instances[i] = this;
  E.index = i;
  E.textArea = T;
  E.tpl = BUE.templates[E.tplid = tplid];
  E.UI = $(BUE.theme(tplid).replace(/\%n/g, E.index)).insertBefore(T);
  E.buttons = $('input.bue', E.UI).get();
  E.bindex = null;
  E.safeToPreview = T.value.indexOf('<') == -1;
  E.focus = function () {
    E.textArea.focus();
    return E;
  };
  E.getContent = function () {
    return E.textArea.value.bueText();
  };
  E.setContent = function (content) {
    var st = E.textArea.scrollTop;
    E.textArea.value = content;
    E.textArea.scrollTop = st;
    return E;
  };
  E.getSelection = function () {
    var pos = E.posSelection();
    return E.getContent().substring(pos.start, pos.end);
  };
  E.replaceSelection = function (txt, cursor) {
    var txt = txt.bueText();
    var pos = E.posSelection();
    var content = E.getContent();
    E.setContent(content.substr(0, pos.start) + txt + content.substr(pos.end));
    var end = cursor == 'start' ? pos.start : pos.start+txt.length;
    var start = cursor == 'end' ? end : pos.start;
    return E.makeSelection(start, end);
  };
  E.tagSelection = function (left, right, cursor) {
    var left = left.bueText();
    var right = right.bueText();
    var llen = left.length;
    var pos = E.posSelection();
    var content = E.getContent();
    E.setContent(content.substr(0, pos.start) + left + content.substring(pos.start, pos.end) + right + content.substr(pos.end));
    var end = cursor=='start' ? pos.start+llen : pos.end+llen;
    var start = cursor=='end' ? end : pos.start+llen;
    return E.makeSelection(start, end);
  };
  E.makeSelection = function (start, end) {
    if (end < start) end = start;
    BUE.selMake(E.textArea, start, end);
    if (BUE.dialog.esp) BUE.dialog.esp = {'start': start, 'end': end};
    return E;
  };
  E.posSelection = function () {
    return BUE.dialog.esp ? BUE.dialog.esp : BUE.selPos(E.textArea);
  };
  E.buttonsDisabled = function (state, bindex) {
    for (var B, i=0; B = E.buttons[i]; i++) {
      B.disabled = i == bindex ? !state : state;
    }
    return E;
  };
  E.accesskeys = function (state) {
    for (var B, i=0; B = E.buttons[i]; i++) {
      B.accessKey = state ? E.tpl.buttons[B.bid][3] : '';
    }
    return E;
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
  if (!$(domB).hasClass('stay-clicked')) E.focus(); } catch (e) {alert(e.name +': '+ e.message);}
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
      ET.html += '<input id="editor-%n-button-'+ i +'" title="'+ B[0] +'" accesskey="'+ B[3] +'" type="'+ attr[0] +'" class="bue editor-'+ attr[1] +'-button" '+ attr[2] +' tabindex="-1" />';
    }
  }
  ET.html += '</div>'; 
  return ET.html;
};

//default template for editor popups or dialogs.
BUE.popHtml = '<table class="editor-popup" style="position: absolute; display: none;"><tbody><tr class="head even"><td class="title"></td><td class="close"><a>x</a></td></tr><tr class="body odd"><td colspan="2" class="cnt"></td></tr></tbody></table>';

//open popup.
BUE.openPopup = function (id, title, content, effect) {
  return BUE.createPopup(id).open(title, content, effect);
}

//create popup
BUE.createPopup = function (id, title, content) {
  if (BUE.popups[id]) {
    return BUE.popups[id];
  }
  var P = BUE.popups[id] = $(BUE.popHtml).appendTo('body').attr('id', id).find('.title:first').html(title || '').end().find('.cnt:first').html(content || '').end().get(0);
  //drag
  $('.head:first', P).mousedown(function (e) {
    var X = e.pageX, Y = e.pageY, pos = $(P).offset();
    var drag =  function(e) {$(P).css({left: pos.left + e.pageX - X, top: pos.top + e.pageY - Y});return false;};
    var undrag = function(e) {$(document).unbind('mousemove', drag).unbind('mouseup', undrag)};
    $(document).mousemove(drag).mouseup(undrag);
  });
  //close
  P.close = function (effect) {$(P)[effect || 'hide']()};
  $('.close:first', P).click(function() {P.close()});
  //open
  P.open = function (title, content, effect) {
    var pos = $(BUE.active.buttons[BUE.active.bindex]).offset();
    $(P).css({left: pos.left - 20, top: pos.top + 10});
    P.editor = BUE.active;
    if (typeof title != 'undefined' && title != null) {
      $('.title:first', P).html(title);
    }
    if (typeof content != 'undefined' && content != null) {
      $('.cnt:first', P).html(content);
    }
    $(P)[effect || 'show']();
    return P;
  };
  return P;
};

//dialog functions
BUE.dialog.open = function (title, content, effect) {
  var D = BUE.dialog;
  if (D.editor) D.close();
  var E = D.editor = BUE.active;
  E.buttonsDisabled(true);
  $(E.buttons[E.bindex]).addClass('stay-clicked');
  D.esp = E.posSelection();
  D.popup.open(title, content, effect);
  D.oldfocus = E.textArea.onfocus;
  E.textArea.onfocus = function () {this.blur();};
};
BUE.dialog.close = function (effect) {
  var E, D = BUE.dialog;
  if (E = D.editor) {
    E.textArea.onfocus = D.oldfocus;
    E.buttonsDisabled(false);
    $(E.buttons[E.bindex]).removeClass('stay-clicked');
    if (E.index == BUE.active.index) {// restore previous states
      if (BUE.mode == 2) E.makeSelection(D.esp.start, D.esp.end); // selection for IE
      else E.focus(); // focus for FF
    }
    D.editor = null;
    D.esp = null;
    $(D.popup)[effect || 'hide']();
  }
};

// browser specific selection handling functions.

//New line standardization. At least make them represented by a single char.
BUE.processText = BUE.mode < 2 ? (function (s) {return s}) : (function (s) {return s.replace(/\r\n/g, '\n')});
String.prototype.bueText = function () {return BUE.processText(this)};

//Mode 1 (default) functions for all except IE and Opera
BUE.selPos = function (T) {
  return {start: T.selectionStart || 0, end: T.selectionEnd || 0};
};
BUE.selMake = function (T, start, end) {
  T.setSelectionRange(start, end);
};

//mode 2 - IE.
if (BUE.mode == 2) {
  BUE.selPos = function (T) {
    T.focus();
    var i, val = T.value.bueText(), mark = '~`^'; //dummy text.
    for (i = 0; val.indexOf(mark) != -1; i++) mark += mark.charAt(i); //make sure mark is unique.
    var mlen = mark.length, range = document.selection.createRange();
    var bm = range.getBookmark(), slen = range.text.bueText().length;
    range.text = mark;
    var tmp = T.value.bueText(), start = tmp.indexOf(mark);
    for (i = 0; tmp.charAt(start+i+mlen) == '\n'; i++);
    for (var end = start+slen; val.charAt(end) == '\n'; end++);
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
}

//Mode 3 - Opera
else if (BUE.mode == 3) {
  BUE.selPos = function (T) {
    var start = T.selectionStart || 0, end = T.selectionEnd || 0;
    var i = T.value.substring(0, start).split('\r\n').length, j = T.value.substring(start, end).split('\r\n').length;
    return {'start': start - i + 1, 'end': end - i - j + 2};
  };
  BUE.selMake = function (T, start, end) {
    var text = T.value.bueText(), i = text.substring(0, start).split('\n').length, j = text.substring(start, end).split('\n').length;
    T.setSelectionRange(start + i -1 , end + i + j - 2);
  };
}

$(document).ready(BUE.initiate);
var editor = editor || BUE;//not to break old button scripts.
