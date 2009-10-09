// $Id$
(function($) {

//process initial text(icon) fields. Add selector-opener next to them.
var iconProc = function(i, inp) {
  var sop = bue.sop.cloneNode(false);
  sop._txt = inp;
  sop.onclick = sopClick;
  inp.parentNode.insertBefore(sop, inp);
  bue.IL[inp.value] && iconShow(inp.value, sop);
};

//click event for selector opener.
var sopClick = function(e) {
  var pos = $(activeSop = this).offset();
  $(bue.IS).css({left: pos.left-parseInt($(bue.IS).width()/2)+10, top: pos.top+10}).show();
  $('#edit-selaction').addClass('ie6');//fix ie6's selectbox z-index bug.
  setTimeout(function(){$(document).click(doClick)});
  return false;
};

//document click to close selector
var doClick = function(e) {
  $(document).unbind('click', doClick);
  $(bue.IS).hide();
  $('#edit-selaction').removeClass('ie6');
};

//select text option
var textClick = function() {
  var sop = activeSop;
  if (sop._ico && $(sop._txt).is(':hidden')) {
    $(sop._ico).hide();
    $(sop._txt).show().val('');
  }
  sop._txt.focus();
};

//replace textfield with icon
var iconShow = function(name, sop) {
  $(sop._txt).val(name).hide();
  var img = sop._ico;
  if (img) {
    img.src = iconUrl(name);
    img.alt = img.title = name;
    $(img).show();
  }
  else {
    img = sop._ico = iconCreate(name).cloneNode(false);
    sop.parentNode.appendChild(img);
  }
};

//select image option
var iconClick = function() {iconShow(this.title, activeSop)};

//return URL for an icon
var iconUrl = function(name) {return bue.IP + name};

//create icon image.
var iconCreate = function(name) {
  var img = bue.IL[name];
  if (!img) return false;
  if (img.nodeType) return img;
  img = bue.IL[name] = document.createElement('img');
  img.src = iconUrl(name);
  img.alt = img.title = name;
  return img;
};

//create icon selector table
var createIS = function() {
  var table = $html('<table><tbody><tr><td title="'+ Drupal.t('Text button') +'"><input type="text" size="1" /></td></tr></tbody></table>')[0];
  var tbody = table.tBodies[0];
  var row = tbody.rows[0];
  row.cells[0].onclick = textClick;
  var i = 1;
  for (var name in bue.IL) {
    if (i == 6) {
      tbody.appendChild(row = document.createElement('tr'));
      i = 0;
    }
    row.appendChild(cell = document.createElement('td'));
    cell.title = name;
    cell.onclick = iconClick;
    cell.appendChild(iconCreate(name));
    i++;
  }
  //fill in last row
  for(; i < 6; i++) {
    row.appendChild(document.createElement('td'));
  }
  table.id = 'icon-selector';
  $(bue.IS = table).appendTo(document.body).hide();
};

//table drag adjustment. make value updating simpler and start from 0.
var alterDrag = function() {
  var tdrag = Drupal.tableDrag['button-table'];
  tdrag.updateFields = function() {
    $('#button-table input.input-weight').each(function(i, field) {field.value = i});
  };
  //sort initially to make new buttons sink.
  tdrag.updateFields();
};

//actions for selected buttons
var selAction = function() {
  var $chks = $('#button-table').find('input:checkbox');
  if ($chks.size()) {
    $('#edit-go').click(function() {
      var action = $('#edit-selaction').val();
      if (action && $chks.filter(':checked').size()) {
        return action != 'delete' || confirm(Drupal.t('Are you sure want to delete the selected buttons?'));
      }
      return false;
    });
    $('#edit-selaction').change(function() {
      $('#edit-copyto')[this.value == 'copyto' ? 'show' : 'hide']();
    }).change();
  }
  else {
    $('#sel-action-wrapper').hide();
  }
};

//process resizable textareas
var textArea = function(i, T) {
  var wrp = document.createElement('div');
  var spn = document.createElement('span');
  var grp = document.createElement('div');
  wrp.className = 'resizable-textarea';
  grp.className = 'grippie';
  T.className += ' textarea-processed';
  grp.onmousedown = initDrag;
  grp.T = T;
  spn.appendChild(grp);
  wrp.appendChild(spn);
  T.parentNode.insertBefore(wrp, T);
  spn.insertBefore(T, grp);
  //grp.style.marginRight = (grp.offsetWidth - T.offsetWidth) +'px';//slow
};

//start resizing textarea
var initDrag = function(e) {
  var $T = $(this.T), $doc = $(document);
  var doDrag = function(e) {$T.height(Math.max(18, bue.Y + e.pageY));return false;}
  var noDrag = function(e) {$doc.unbind('mousemove', doDrag).unbind('mouseup', noDrag);$T.css('opacity', 1);}
  bue.Y = $T.css('opacity', 0.25).height() - (e||event).pageY;
  $doc.mousemove(doDrag).mouseup(noDrag);
  return false;
};

//create table header
var createHeader = function(table) {
  var $fixed = table.$fixed = $(table.cloneNode(false));
  var $repo = table.$repo = $(document.createElement('table')).append(table.tHead.cloneNode(true));
  $repo.css({visibility: 'hidden', position: 'absolute', left: -1000, top: -1000}).insertBefore(table);
  $fixed.addClass('sticky-header').css('position', 'fixed')[0].id += '-fixed';
  return $fixed.insertBefore(table);
};

//handle window scroll (table header)
var winScroll = function(e) {
  var $w = $(window), sX = $w.scrollLeft(), sY = $w.scrollTop();
  for (var table, i = 0; table = bue.tables[i]; i++) {
    tableScroll(table, sX, sY);
  }
};

//handle window resize (table header)
var winResize = function(e) {
  for (var table, i = 0; table = bue.tables[i]; i++) if (table.$fixed && table.$fixed[0].tHead) {
    table.$fixed.width($(table).width());
  }
};

//handle sticky head on scroll (table header)
var tableScroll = function(table, sX, sY) {
  var $table = $(table), pos = $table.offset();
  var minY = pos.top, maxY = minY + $table.height() - $(table.tHead).height() * 2, minX = pos.left;
  var action = minY < sY && sY < maxY;
  var $fixed = table.$fixed || false;
  if (!action && (!$fixed || !$fixed[0].tHead)) return;
  $fixed = $fixed || createHeader(table);//create when necessary
  var $repo = table.$repo;
  if (action) {
    $fixed.css({visibility: 'visible', top: 0, left: minX-sX});
    if (!$fixed[0].tHead) {//run once
      var head = table.tHead;
      $table.prepend($repo[0].tHead);
      $fixed.append(head).width($table.width());
    }
  }
  else {//run once
    $fixed.css('visibility', 'hidden');
    var head = table.tHead;
    $table.prepend($fixed[0].tHead);
    $repo.append(head);
  }
};

//Faster alternative to resizable textareas
Drupal.behaviors.textarea = function(context) {
  $('textarea.resizable:not(.textarea-processed)', context).each(textArea);
};

//Faster alternative to sticky headers.
//Header creation is skipped on load and done once the user scrolls on a table.
//Fixes tableselect bug where the state of checkbox in the cloned header is not updated.
Drupal.behaviors.tableHeader = function(context) {
  var tables =$('table.sticky-enabled:not(.sticky-table)', context).addClass('sticky-table').get();
  if (tables.length) {
    if (!bue.tables) {
      bue.tables = [];
      $(window).scroll(winScroll).resize(winResize);
    }
    bue.tables = bue.tables.concat(tables);
  }
};

//html to jQuery
var $html = function(s){return bue.$div.html(s).children()};
var bue = {};

$(document).ready(function() {
  //initiate required variables
  bue.IL = Drupal.settings.BUE.iconlist;
  bue.BP = Drupal.settings.basePath;
  bue.IP = bue.BP + Drupal.settings.BUE.iconpath +'/';
  bue.$div = $(document.createElement('div'));
  bue.sop = $html('<img class="icon-selector-opener" src="'+ bue.BP +'misc/menu-expanded.png" title="'+ Drupal.t('Select an icon') +'" />')[0];
  //add icon selector into doc and create a global access for it.
  createIS();
  //process icon textfields
  $('input.input-icon').each(iconProc);
  //button actions adjustment
  selAction();
  //table drag adjustment
  alterDrag();
});

})(jQuery);