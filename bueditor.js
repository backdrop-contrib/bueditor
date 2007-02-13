// $Id$

// initiate editor variable that will hold other variables and fuctions.
var editor = { instances : [], buttons : [], path : '', G : {}, dialog : {}, mode : (window.getSelection || document.getSelection) ? 1 : ( document.selection && document.selection.createRange ? 2 : 0 )};

editor.bpr = 20; //maximum # of buttons per row.

editor.initiate = function () {
  var i, txt, ec, ins, j = 0, txts = document.getElementsByTagName('textarea'), template = editor.template();
  for (i=0; txt=txts[i]; i++) {
    if (hasClass(txt, 'editor-textarea')) {
      ec = document.createElement('div');
      ec.id = 'editor-'+ j;
      ec.className = 'editor-container';
      ec.innerHTML = template.replace(/\%n/g, j);
      txt.parentNode.insertBefore(ec, txt);
      editor.instances[j] = new editor.instance(txt.id, j);
      j++;
    }
  }
  editor.active = editor.instances[0];
  // if there is more than 1 editor., enable/disable accesskeys according to state of the textareas.
  if (editor.instances.length>1) {
    for (i=0; ins=editor.instances[i]; i++) {
      ins.textArea.onfocus = function () { 
        if (!(editor.active == this.editor || editor.dialog.editor)) {
          editor.active.accesskeys(false);
          this.editor.accesskeys(true);
          editor.active = this.editor;
        }
      }
      if (editor.active != ins) ins.accesskeys(false);
    }
  }
  //initiate editor dialog html object
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

editor.instance = function (tid, index) {
  this.index = index;
  this.textArea = $(tid);
  this.textArea.editor = this;
  this.buttons = $('editor-'+index).getElementsByTagName('input');
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

editor.buttonClick = function (eindex, bindex) {
  try {
    var E = editor.active = editor.instances[eindex];
    E.bindex = bindex;
    var b = editor.buttons[bindex];
    var content = b[1];
    editor.dialog.close();//restore sel. pos. for ie.
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

editor.template = function () {
  var b, output = '';
  //editor.buttons is an array of arrays with index values 0-title, 1-content, 2-icon, 3-accesskey, 4-button function
  for (var i=0; b=editor.buttons[i]; i++) {
    if (i && i%editor.bpr==0) output += '<br />';
    if (b[1].substr(0, 3) == 'js:') b[4] = new Function(b[1].substr(3));
    var inner = b[2].length>2 ? ('type="image" src="'+ editor.path +'icons/'+ b[2] +'" class="editor-image-button"') : ('type="button" value="'+ b[2] +'" class="editor-text-button"');
    output += '<input '+ inner +' onclick="editor.buttonClick(%n, '+ i +'); return false;" id="editor-%n-button-'+ i +'" title="'+ b[0] +'" accesskey="'+ b[3] +'" />';
  }
  return output;
}

editor.processText = function (text) {
  return editor.mode == 2 ? text.replace(/\r\n/g, '\n') : text;
}

//dialog functions
editor.dialog.open = function (title, content) {
  if (this.editor) this.close();
  this.title(title);
  this.content(content);
  this.editor = editor.active;
  this.editor.buttonsDisabled(true);
  this.esp = this.editor.posSelection();
  var pos = absolutePosition(this.editor.buttons[this.editor.bindex||0]);
  this.el.style.top = pos.y + 'px';
  this.el.style.left = pos.x + 'px';
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

if (isJsEnabled()) {
  addLoadEvent(editor.initiate);
}
