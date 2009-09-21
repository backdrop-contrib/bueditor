// $Id$

function bueInit() {
  //add icon selector into doc and create a global access for it.
  iconSelector = $(bueIcoSelector()).appendTo(document.body).hide();
  //process icon textfields
  $('input.input-icon').each(bueProcessIcoField);
  //button actions adjustment
  bueSelAction();
  //table drag adjustment
  bueAlterDrag();
}

//process initial text(icon) fields. Add selector-opener next to them.
function bueProcessIcoField() {
  var op = document.createElement('img');
  op.src = Drupal.settings.basePath +'misc/menu-expanded.png';
  op.className = 'icon-selector-opener';
  op.title = Drupal.t('Select an icon');
  op._txt = this;
  $(op).insertAfter(this).click(bueOpClick);
  if (Drupal.settings.BUE.iconlist[this.value]) {
    bueInsertIco(this.value, op);
  }
}

//click event for selector opener.
function bueOpClick(e) {
  var pos = $(this).offset();
  selectop = this;
  iconSelector.css({left: pos.left-parseInt(iconSelector.width()/2)+10, top: pos.top+10}).show();
  $(document).click(bueDoClick);
  $('#edit-selaction').addClass('ie6');//fix ie6's selectbox z-index bug.
  return false;
}

//document click to close selector
function bueDoClick(e) {
  $(document).unbind('click', bueDoClick);
  $(iconSelector).hide();
  $('#edit-selaction').removeClass('ie6');
}

//select text option
function bueTxtClick() {
  if (selectop._ico && $(selectop._txt).is(':hidden')) {
    $(selectop._ico).hide();
    $(selectop._txt).show().val('');
  }
  selectop._txt.focus();
}

//select image option
function bueIcoClick() {
  bueInsertIco(this.title, selectop);
}

//replace textfield with icon
function bueInsertIco(name, op) {
  if (!op._ico) {
    op._ico = document.createElement('img');
  }
  $(op._txt).val(name).hide();
  $(op._ico).attr('src', bueIcoUrl(name)).insertBefore(op).show();
}

//return URL for an icon
function bueIcoUrl(name) {
  return Drupal.settings.basePath + Drupal.settings.BUE.iconpath + '/' + name;
}

//create icon selector table
function bueIcoSelector() {
  var cols = 6;//number of columns
  var index = 1//first cell is reserved for text button option.
  var table = document.createElement('table');
  //insert first row and cell containing textfield option.
  var row = table.insertRow(0);
  var cell = row.insertCell(0);
  $(cell).attr('title', Drupal.t('Text button')).html('<input type="text" size="1" />').click(bueTxtClick);
  //insert icon options
  for (var name in Drupal.settings.BUE.iconlist) {
    var col = index%cols;
    if (col == 0) {
      row = table.insertRow(index/cols);
    }
    cell = row.insertCell(col);
    $(cell).attr('title', name).html('<img src="'+ bueIcoUrl(name) +'" alt="'+ name +'" />').click(bueIcoClick);
    index++;
  }
  //fill in last row
  for(; col = index%cols; index++) {
    row.insertCell(col);
  }
  table.id = 'icon-selector';
  return table;
}

//table drag adjustment. make value updating simpler and start from 0.
function bueAlterDrag() {
  var tdrag = Drupal.tableDrag['button-table'];
  tdrag.updateFields = function() {
    $('#button-table input.input-weight').each(function(i, field) {
      field.value = i;
    });
  };
  //sort initially to make new buttons sink.
  tdrag.updateFields();
}

//actions for selected buttons
function bueSelAction() {
  $bueCheckboxes = $('#button-table').find('input:checkbox');
  if ($bueCheckboxes.size()) {
    $('#edit-go').click(function() {
      var action = $('#edit-selaction').val();
      if (action && $bueCheckboxes.filter(':checked').size()) {
        return action == 'delete' && !confirm(Drupal.t('Are you sure want to delete the selected buttons?')) ? false : true;
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
}

$(document).ready(bueInit);