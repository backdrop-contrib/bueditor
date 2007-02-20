// $Id$

// initiate editor variable that will hold other variables and fuctions.
var editor = { instances : [], buttons : [], path : '', G : {}, dialog : {}, mode : (window.getSelection || document.getSelection) ? 1 : ( document.selection && document.selection.createRange ? 2 : 0 )};

editor.bpr = 20; //maximum # of buttons per row.

//process textareas that have "editor-textarea" class.
editor.initiate = function () {
  var i, T, Ts = document.getElementsByTagName('textarea');
  for (i=0; T=Ts[i]; i++) {
    if ( T.className && (' '+ T.className +' ').indexOf(' editor-textarea ')+1) {
      editor.processTextarea(T);
    }
  }
}

//create an editor instance
editor.instance = function (T, index) {
  this.index = index;
  this.textArea = T;
  this.textArea.editor = this;
  this.buttons = document.getElementById('editor-'+index).getElementsByTagName('input');
  this.bindex = null;//latest clicked button index
  this.focus = function () {
    this.textArea.focus();
  }
  this.getContent = function () {
    return editor.processText(this.textArea.value);
  }
  this.setContent = function (content) {
    var st = this.textArea.scrollTop;
    this.textArea.value = content;
    this.textArea.scrollTop = st;
  }
  this.getSelection = function () {
    var pos = this.posSelection();
    return this.getContent().substring(pos.start, pos.end);
  }
  this.replaceSelection = function (txt, cursor) {
    var txt = editor.processText(txt);
    var pos = this.posSelection();
    var content = this.getContent();
    this.setContent(content.substr(0, pos.start) + txt + content.substr(pos.end));
    var end = cursor == 'start' ? pos.start : pos.start+txt.length;
    var start = cursor == 'end' ? end : pos.start;
    this.makeSelection(start, end);
  }
  this.tagSelection = function (left, right, cursor) {
    var left = editor.processText(left);
    var right = editor.processText(right);
    var llen = left.length;
    var pos = this.posSelection();
    var content = this.getContent();
    this.setContent(content.substr(0, pos.start) + left + content.substring(pos.start, pos.end) + right + content.substr(pos.end));
    var end = cursor=='start' ? pos.start+llen : pos.end+llen;
    var start = cursor=='end' ? end : pos.start+llen;
    this.makeSelection(start, end);
  }
  this.makeSelection = function (start, end) {
    if (end<start) end = start;
    editor.selMake(this.textArea, start, end);
    if (editor.dialog.esp) editor.dialog.esp = {start : start, end : end};
  }
  this.posSelection = function () {
    return editor.dialog.esp ? editor.dialog.esp : editor.selPos(this.textArea);
  }
  this.buttonsDisabled = function (state, bindex) {
    for (var i=0; b=this.buttons[i]; i++) {
      b.disabled = i==bindex ? !state : state;
    }
  }
  this.accesskeys = function (state) {
    for (var i=0; b=this.buttons[i]; i++) {
      b.accessKey = state ? editor.buttons[i][3] : '';
    }
  }
}

//execute button's click event
editor.buttonClick = function (eindex, bindex) {
  try {
    var E = editor.active = editor.instances[eindex];
    E.bindex = bindex;
    var b = editor.buttons[bindex];
    var content = b[1];
    editor.dialog.close();
    if (b[4]) b[4](); //execute button script.
    else if (content) {
      var arr = content.split('%TEXT%');
      if (arr.length==2) E.tagSelection(arr[0], arr[1]);
      else E.replaceSelection(arr.length==1 ? content : arr.join(E.getSelection()), 'end');
    }
    if (!(editor.dialog.editor || E.textArea.style.display=='none')) E.focus();
  }
  catch (e) { alert(e.name +': '+ e.message); }
  return false;
}

//return html of editor buttons
editor.template = function () {
  if (typeof editor.tplHTML != 'undefined') return editor.tplHTML;
  editor.tplHTML = '';
  for (var i=0; b=editor.buttons[i]; i++) {
    if (i && i%editor.bpr==0) editor.tplHTML += '<br />';
    if (b[1].substr(0, 3) == 'js:') b[4] = new Function(b[1].substr(3));
    var inner = b[2].length>2 ? ('type="image" src="'+ editor.path +'icons/'+ b[2] +'" class="editor-image-button"') : ('type="button" value="'+ b[2] +'" class="editor-text-button"');
    editor.tplHTML += '<input '+ inner +' onclick="editor.buttonClick(%n, '+ i +'); return false;" id="editor-%n-button-'+ i +'" title="'+ b[0] +'" accesskey="'+ b[3] +'" />';
  }
  return editor.tplHTML;
}

//integrate the editor into textarea T
editor.processTextarea = function (T) {
  if (T.editor || T.style.display == 'none' || T.style.visibility == 'hidden') return;
  var index = editor.instances.length;
  var ec = document.createElement('div');
  ec.id = 'editor-'+ index;
  ec.className = 'editor-container';
  ec.innerHTML = editor.template().replace(/\%n/g, index);
  T.parentNode.insertBefore(ec, T);
  var E = editor.instances[index] = new editor.instance(T, index);
  T.onfocus = function () { 
    if (!(editor.active == this.editor || editor.dialog.editor)) {
      editor.active.accesskeys(false);
      this.editor.accesskeys(true);
      editor.active = this.editor;
    }
  }
  if (index==0) {
    editor.createDialog();
    editor.active = E;
  }
  else E.accesskeys(false);
}

//remove editor from textarea T
editor.restoreTextarea = function (T) {
  if (T.editor) {
    var ec = document.getElementById('editor-'+T.editor.index);
    ec.parentNode.removeChild(ec);
    editor.instances[T.editor.index] = null;
    T.onfocus = null;
    T.editor = null;
  }
}

//create editor dialog html object
editor.createDialog = function () {
  if (typeof editor.dialog.el != 'undefined') return;
  editor.dialog.el = document.createElement('table');
  with(editor.dialog.el) {
    with(insertRow(0)) {
      className = 'head even';
      with(insertCell(0)) {className = 'title'; innerHTML = 'Untitled';}
      with(insertCell(1)) {className = 'close'; innerHTML = '<a>x</a>';}
    }
    with(insertRow(1)) {
      className = 'body odd';
      with(insertCell(0)) {className = 'content'; colSpan = 2;}
    }
    rows[0].onmousedown = function (e) {
      var e = e||window.event;
      var D = editor.dialog.el;
      var X = e.clientX-parseInt(D.style.left||0);
      var Y = e.clientY-parseInt(D.style.top||0);
      document.onmousemove = function (e) {
        var e = e||window.event;
        D.style.left = (e.clientX-X) + 'px';
        D.style.top = (e.clientY-Y) + 'px';
        return false;
      }
      document.onmouseup = function (e) {
        document.onmousemove = null;
        document.onmouseup = null;
      }
      return false;
    }
    rows[0].cells[1].firstChild.onclick = function() {editor.dialog.close();}
    id = 'editor-dialog';
    style.position = 'absolute';
    style.display = 'none';
  }
  document.body.appendChild(editor.dialog.el);
}

//dialog functions
editor.dialog.open = function (title, content) {
  if (this.editor) this.close();
  this.title(title);
  this.content(content);
  this.editor = editor.active;
  this.editor.buttonsDisabled(true);
  this.esp = this.editor.posSelection();
  var ta = this.editor.textArea;
  this.el.style.top = editor.absPos(ta, 'y') + 'px';
  this.el.style.left = editor.absPos(ta, 'x') + 'px';
  this.el.style.display = 'block';
}
editor.dialog.close = function () {
  if (this.editor) {
    this.editor.buttonsDisabled(false);
    if (this.editor == editor.active) {// restore previous states
      if (editor.mode == 2) this.editor.makeSelection(this.esp.start, this.esp.end); // selection for IE
      else this.editor.focus(); // focus for FF
    }
    this.editor = null;
    this.esp = null;
    this.el.style.display = 'none';
  }
}
editor.dialog.title = function (title) {
  this.el.rows[0].cells[0].innerHTML = title||'';
}
editor.dialog.content = function (content) {
  this.el.rows[1].cells[0].innerHTML = content||'';
}

//custom functions
//if the given text matches html syntax of the given tag, return attributes and innerHMTL of it, otherwise return null.
editor.parseTag = function (text, tag) {
  var result, arr = [], attr = [];
  var closed = !(tag=='img' || tag=='input' || tag=='br' || tag=='hr');
  var re = new RegExp('^<'+ tag +'([^>]*)'+ (closed ? ('>((.|[\r\n])*)<\/'+tag) : '') +'>$');
  if (result = re.exec(text)) {
    if ((arr = result[1].split('"')).length>1) {
      for (var i=0; typeof(arr[i+1])!='undefined'; i+=2) attr[arr[i].replace(/\s|\=/g, '')] = arr[i+1];
    }
    return {attributes : attr, innerHTML : result[2]||''};
  }
  return null;
}

//return an array of DOM elements corresponding to the given text.
editor.textToDOM = function (text) {
  if (!editor.DC) { //dom container
    editor.DC = document.createElement('div');
    editor.DC.style.display = 'none';
    document.body.appendChild(editor.DC);
  }
  editor.DC.innerHTML = text;
  return editor.DC.childNodes;
}

//return absolute position of element el on the axis(x or y)
editor.absPos = function (el, axis) {
  var prop = axis=='x' ? 'offsetLeft' : 'offsetTop';
  var pos = el[prop]||0;
  while (el = el.offsetParent) pos += el[prop];
  return pos;
}

// browser specific functions.
if (editor.mode == 0) {//mode 0 - selection handling not-supported
  editor.selPos = function (T) {return {start : T.value.length, end : T.value.length};}
  editor.selMake = function (T, start, end) {}
}
else if (editor.mode == 1) {//mode 1 - Firefox, opera, safari.
  editor.selPos = function (T) { return {start : T.selectionStart||0, end : T.selectionEnd||0};}
  editor.selMake = function (T, start, end) {T.setSelectionRange(start, end);}
}
else if (editor.mode == 2) {//mode 2 - IE.
  editor.selPos = function (T) {
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
    for (var i = 0; tmp.charAt(start+i+mlen)=='\n'; i++);
    var end = start+slen;
    for (; val.charAt(end)=='\n'; end++);
    end -= i;
    T.value = val;
    if (start == end && !val.charAt(end)) range.collapse(false);//bookmark has problems with a cursor at the end
    else range.moveToBookmark(bm);
    range.select();
    return {start : start, end : end};
  }
  editor.selMake = function (T, start, end) {
    range = T.createTextRange();
    range.collapse();
    range.moveEnd('character', end);
    range.moveStart('character', start);
    range.select();
  }
}
editor.processText = function (text) {
  return editor.mode == 2 ? text.replace(/\r\n/g, '\n') : text;
}

//initiate
if (document.getElementsByTagName && document.createElement  && document.getElementById) {
  var wload = window.onload;
  window.onload = typeof(wload)=='function' ? function() {wload(); editor.initiate();} : editor.initiate();
}
