// $Id$
(function($) {
//Global BUE
var BUE = window.BUE = window.BUE || {preset: {}, instances: [], popups: {}, templates: {}, postprocess: []};

//editor settle.
BUE.initiate = function () {
  BUE.initDialog();//create editor quickPop.
  BUE.initQuickPop();//create editor dialog
  (Drupal.behaviors.BUE = BUE.behavior)(document);//set drupal behavior.
};

//Get editor settings from Drupal.settings and process preset textareas.
BUE.behavior = function(context) {
  var set = Drupal.settings.BUE || null, tpls = BUE.templates, pset = BUE.preset;
  if (set) {
    $.each(set.templates, function (id, tpl) {
      tpls[id] = tpls[id] || $.extend({}, tpl);
    });
    $.extend(pset, set.preset);
    set.templates = {};
    set.preset = {};
  }
  $.each(pset, function (tid, tplid) {
    BUE.processTextarea($('#'+ tid, context).get(0), tplid);
  });
  //fix enter key on autocomplete fields triggering button click.
  $('input.form-autocomplete', context).keydown(function(e) {return e.keyCode != 13});
};

//integrate editor template into textarea T
BUE.processTextarea = function (T, tplid) {
  if (!T || !BUE.templates[tplid] || !(T = $(T).filter('textarea')[0])) return false;
  //check visibility on the element-level only.
  if (T.style.display == 'none' || T.style.visibility == 'hidden') return false;
  if (T.bue) return T.bue;
  var E = new BUE.instance(T, tplid);
  !BUE.active || BUE.active.textArea.disabled ? E.activate() : E.accesskeys(false);
  //post process. this kind of loop does not miss processes added by processes.
  for (var F, i = 0; F = BUE.postprocess[i]; i++) {
    $.isFunction(F) && F(E, $);
  }
  return E;
};

//create an editor instance
BUE.instance = function (T, tplid) {
  var i = BUE.instances.length, E = T.bue = BUE.instances[i] = this;
  E.index = i;
  E.textArea = T;
  E.tplid = tplid;
  E.tpl = BUE.templates[tplid];
  E.bindex = null;
  E.safeToPreview = T.value.indexOf('<') == -1;
  E.UI = $html(BUE.theme(tplid).replace(/\%n/g, i)).insertBefore(T);
  E.buttons = $('.bue-button', E.UI).each(function(i, B) {
    var arr = B.id.split('-');
    $($.extend(B, {eindex: arr[1], bid: arr[3], bindex: i})).click(function(){return BUE.buttonClick(B.eindex, B.bindex)});
  }).get();
  $(T).focus(function() {!BUE.dialog.esp && T.bue.activate()});
};

//execute button's click event
BUE.buttonClick = function (eindex, bindex) { try {
  var E = BUE.instances[eindex].activate();
  var domB = E.buttons[bindex];
  var tplB = E.tpl.buttons[domB.bid];
  var content = tplB[1];
  E.bindex = bindex;
  E.dialog.close();
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

//open popup.
BUE.openPopup = function (id, title, content, effect) {
  return BUE.createPopup(id).open(title, content, effect);
};

//create popup
BUE.createPopup = function (id, title, content) {
  if (BUE.popups[id]) {
    return BUE.popups[id];
  }
  var P = BUE.popups[id] = $html(BUE.popHtml).appendTo('body').attr('id', id).find('.bue-popup-title').html(title || '').end().find('.bue-popup-content').html(content || '').end().get(0);
  //open
  P.open = function (title, content, effect) {
    var E = P.bue = BUE.active, pos = $(E.buttons[E.bindex]).offset();
    $(P).css({left: pos.left - 20, top: pos.top + 10});
    if (typeof title != 'undefined' && title != null) {
      $('.bue-popup-title', P).html(title);
    }
    if (typeof content != 'undefined' && content != null) {
      $('.bue-popup-content', P).html(content);
    }
    $(P)[effect || 'show']();
    return P;
  };
  //close
  P.close = function (effect) {return $(P)[effect || 'hide']()[0]};
  $('.bue-popup-close', P).click(function() {P.close()});
  //drag
  $('.bue-popup-head', P).mousedown(function (e) {
    var X = e.pageX, Y = e.pageY, pos = {X: parseInt($(P).css('left')), Y: parseInt($(P).css('top'))};
    var drag =  function(e) {$(P).css({left: pos.X + e.pageX - X, top: pos.Y + e.pageY - Y});return false;};
    var undrag = function(e) {$(document).unbind('mousemove', drag).unbind('mouseup', undrag)};
    $(document).mousemove(drag).mouseup(undrag);
  });
  return P;
};

//initialize editor dialog.
BUE.initDialog = function () {
  var D = BUE.instance.prototype.dialog = BUE.dialog = BUE.createPopup('bue-dialog');
  var foc  = function () {this.blur()};
  var Do = D.open, Dc = D.close;
  D.open = function (title, content, effect) {
    D.esp && D.close();
    var E = BUE.active;
    E.buttonsDisabled(true);
    $(E.buttons[E.bindex]).addClass('stay-clicked');
    D.esp = E.posSelection();
    $(E.textArea).focus(foc);
    return Do(title, content, effect);
  };
  D.close = function (effect) {
    if (!D.esp) return D;
    var E = D.bue;
    $(E.textArea).unbind('focus', foc);
    E.buttonsDisabled(false);
    $(E.buttons[E.bindex]).removeClass('stay-clicked');
    E == BUE.active && E.makeSelection(D.esp.start, D.esp.end).focus();// restore previous states
    D.esp = null;
    return Dc(effect);
  };
  return D;
};

//initialize editor quickpop.
BUE.initQuickPop = function () {
  var Q = BUE.instance.prototype.quickPop = BUE.quickPop = BUE.createPopup('bue-quick-pop');
  var Qo = Q.open, Qc = Q.close;
  Q.open = function(content, effect) {
    $(document).mouseup(Q.close);
    return Qo(null, content, effect);
  };
  Q.close = function() {
    $(document).unbind('mouseup', Q.close);
    return Qc();
  };
  $('.bue-popup-head', Q).hide();
  return Q;
};

//return html of editor template buttons
BUE.theme = function (tplid) {
  var tpl = BUE.templates[tplid] || {html: ''}, html = '';
  if (typeof tpl.html == 'string') return tpl.html;
  //B(0-title, 1-content, 2-icon or caption, 3-accesskey) and 4-function for js buttons
  for (var B, i = 0; B = tpl.buttons[i]; i++) {
    var img = B[2].search(/\.(png|gif|jpg)$/i) != -1 ? ((new Image()).src = tpl.iconpath +'/'+ B[2]) : null;
    B[4] = B[1].substr(0, 3) == 'js:' ? new Function('E', B[1].substr(3)) : null;//set functions for js buttons
    if (B[0].substr(0, 4) == 'tpl:') {//theme button.
      html += B[4] ? B[4]() : B[1];
      html += B[2] ? ('<span class="separator">'+ (img ? '<img src="'+ img +'" />' : B[2]) +'</span>') : '';
    }
    else {//functional button
      var attr = img ? ['image', 'image', 'src="'+ img +'" alt="'+ B[2] +'"'] : ['button', 'text', 'value="'+ B[2] +'"'];
      html += '<input id="bue-%n-button-'+ i +'" title="'+ B[0] +'" accesskey="'+ B[3] +'" type="'+ attr[0] +'" class="bue-button bue-'+ attr[1] +'-button editor-'+ attr[1] +'-button" '+ attr[2] +' tabindex="-1" />';
    }
  }
  return tpl.html = '<div class="bue-ui editor-container clear-block" id="bue-ui-%n">'+ html +'</div>';
};

//default template for editor popups or dialogs. Use table wrapper against various IE positioning bugs.
BUE.popHtml = '<table class="bue-popup" style="display: none;"><tbody class="bue-zero"><tr class="bue-zero"><td class="bue-zero"><div class="bue-popup-head clear-block"><div class="bue-popup-title"></div><div class="bue-popup-close">x</div></div><div class="bue-popup-body clear-block"><div class="bue-popup-content"></div></div></td></tr></tbody></table>';

//Cross browser selection handling
BUE.mode = (window.getSelection || document.getSelection) ? ($.browser.opera ? 3 : 1) : (document.selection && document.selection.createRange ? 2 : 0 );
//New line standardization. At least make them represented by a single char.
BUE.processText = BUE.text = BUE.mode < 2 ? (function (s) {return s.toString()}) : (function (s) {return s.toString().replace(/\r\n/g, '\n')});
//Mode 1 (default) functions for all except IE and Opera
BUE.selPos = function (T) {return {start: T.selectionStart || 0, end: T.selectionEnd || 0}};
BUE.selMake = function (T, start, end) {T.setSelectionRange(start, end)};
//mode 2 - IE.
if (BUE.mode == 2) {
  BUE.selPos = function (T) {
    T.focus();
    var i, val = BUE.text(T.value), mark = '~`^'; //dummy text.
    for (i = 0; val.indexOf(mark) != -1; i++) mark += mark.charAt(i); //make sure mark is unique.
    var mlen = mark.length, range = document.selection.createRange();
    var bm = range.getBookmark(), slen = BUE.text(range.text).length;
    range.text = mark;
    var tmp = BUE.text(T.value), start = tmp.indexOf(mark);
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
    var text = BUE.text(T.value), i = text.substring(0, start).split('\n').length, j = text.substring(start, end).split('\n').length;
    T.setSelectionRange(start + i -1 , end + i + j - 2);
  };
}

//Instance methods.
var E = BUE.instance.prototype;
E.focus = function () {
  this.textArea.focus();
  return this;
};
E.getContent = function () {
  return BUE.text(this.textArea.value);
};
E.setContent = function (content) {
  var T = this.textArea, st = T.scrollTop;
  T.value = content;
  T.scrollTop = st;
  return this;
};
E.getSelection = function () {
  var pos = this.posSelection();
  return this.getContent().substring(pos.start, pos.end);
};
E.replaceSelection = function (txt, cursor) {
  var E = this, pos = E.posSelection(), content = E.getContent(), txt = BUE.text(txt);
  var end = cursor == 'start' ? pos.start : pos.start+txt.length, start = cursor == 'end' ? end : pos.start;
  E.setContent(content.substr(0, pos.start) + txt + content.substr(pos.end));
  return E.makeSelection(start, end);
};
E.tagSelection = function (left, right, cursor) {
  var E = this, pos = E.posSelection(), content = E.getContent();
  var left = BUE.text(left), right = BUE.text(right), llen = left.length;
  var end = cursor == 'start' ? pos.start+llen : pos.end+llen, start = cursor == 'end' ? end : pos.start+llen;
  E.setContent(content.substr(0, pos.start) + left + content.substring(pos.start, pos.end) + right + content.substr(pos.end));
  return E.makeSelection(start, end);
};
E.makeSelection = function (start, end) {
  if (end < start) end = start;
  BUE.selMake(this.textArea, start, end);
  if (this.dialog.esp) this.dialog.esp = {'start': start, 'end': end};
  return this;
};
E.posSelection = function () {
  return this.dialog.esp || BUE.selPos(this.textArea);
};
E.buttonsDisabled = function (state, bindex) {
  for (var B, i=0; B = this.buttons[i]; i++) {
    B.disabled = i == bindex ? !state : state;
  }
  return this;
};
E.accesskeys = function (state) {
  for (var B, i=0; B = this.buttons[i]; i++) {
    B.accessKey = state ? this.tpl.buttons[B.bid][3] : '';
  }
  return this;
};
E.activate = function() {
  var E = this, A = BUE.active || null;
  if (E == A) return E;
  A && A.accesskeys(false) && E.accesskeys(true);
  return BUE.active = E;
};

//html 2 jquery. way faster than $(html)
var $html = function(s){return $(document.createElement('div')).html(s).children()};
//initiate bueditor
$(document).ready(BUE.initiate);
//not to break old button scripts.
window.editor = window.editor || BUE;

})(jQuery);
