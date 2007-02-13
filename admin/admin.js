// $Id$

if (Drupal.jsEnabled) {
  $(document).ready(editorAdminInitiate);
}

function editorAdminInitiate() {
  var sel, sels = eById('button-table').getElementsByTagName('select');
  for (var i=0; sel=sels[i]; i++) {
    if (sel.id.substr(sel.id.length-5)=='-icon') {
      sel.onchange = function () { editorIconCap(this) };
      editorIconCap(sel);
    }
  }
  if (eById('button-table').rows[1].cells[5].getElementsByTagName('input').length) {
    eById('button-table').rows[0].cells[5].innerHTML = '<input type="checkbox" onclick="editorCheckAll(this.checked)">';
    eById('edit-go').onclick = editorGoSelected;
  }
  else {
    eById('edit-go').style.display = 'none';
    eById('edit-selaction').style.display = 'none';
  }
}

function editorIconCap(input) {
  input.parentNode.lastChild.tagName=='IMG' ? input.parentNode.removeChild(input.parentNode.lastChild) : '';
  var cap = eById('edit-button-'+ input.id.split('-')[2] +'-caption');
  if (input.value) {
    cap.style.display =  'none';
    var img = document.createElement('img');
    img.src = editorPath +'icons/'+ input.value;
    img.style.display = 'block';
    input.parentNode.appendChild(img);
  }
  else {
    cap.style.display =  'block';
  }
}

function editorCheckAll(state) {
  var chk, chks = eById('button-table').tBodies[0].getElementsByTagName('input');
  for (var i=0; chk=chks[i]; i++) {
    if (chk.type == 'checkbox') {
      chk.checked = state;
    }
  }
}

function editorGoSelected() {
  if (eById('edit-selaction').selectedIndex) {
    var chk, chks = eById('button-table').tBodies[0].getElementsByTagName('input');
    for (var i=0; chk=chks[i]; i++) {
      if (chk.type == 'checkbox' && chk.checked) {
        return true;
      }
    }
  }
  return false;
}

function eById(id) {
  return document.getElementById(id);
}