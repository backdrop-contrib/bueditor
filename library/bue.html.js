// $Id$

//Html creating and parsing methods.
//Requires: none
(function($) {

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

//shortcuts
var Html = BUE.html;
var Nc = BUE.nctag;

})(jQuery);

//backward compatibility.
eDefHTML = BUE.html;
eDefInput = BUE.input;
eDefSelectBox = BUE.selectbox;
eDefTable = BUE.table;
eDefRow = BUE.trow;
eDefNoEnd = BUE.nctag;
eDefRegEsc = BUE.regesc;
eDefParseTag = BUE.parseHtml;
eDefInputText = function(n, v, s) {return BUE.input('text', n, v, {'size': s||null})};
eDefInputSubmit = function(n, v) {return BUE.input('submit', n, v)};