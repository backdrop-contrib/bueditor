<?php
// $Id$

/**
 * Admin main page.
 */
function bueditor_admin() {
  bueditor_prepare_eop();
  $editors = bueditor_editors('all');
  $token = drupal_get_token('bueditor');
  $header = array(t('Editor name'), array('data' => t('Operations'), 'colspan' => 2));
  $rows = array();
  foreach ($editors as $eid => $editor) {
    $rows[] = array($editor->name, l(t('Edit'), 'admin/settings/bueditor/'. $eid) .' | '. l(t('Delete'), 'admin/settings/bueditor/'. $eid .'/delete', array('attributes' => array('class' => 'eop-delete'))) .' | '. l(t('Copy'), 'admin/settings/bueditor', array('attributes' => array('class' => 'eop-copy', 'name' => 'Copy of '. $editor->name), 'query' => array('eop' => 'copy', 'eid' => $eid, 'token' => $token))));
  }
  $rows[] = array('', l(t('Add new editor'), 'admin/settings/bueditor/new') .' | '. l(t('Add the default editor'), 'admin/settings/bueditor', array('attributes' => array('class' => 'eop-add-default', 'name' => 'default editor'), 'query' => array('eop' => 'add_default', 'token' => $token))));
  $output = '<h2 class="title">'. t('Available editors') .'</h2>';
  $output .= theme('table', $header, $rows, array('id' => 'available-editors-list'));
  $output .= drupal_get_form('bueditor_admin_form');
  return $output;
}

/**
 * Admin form.
 */
function bueditor_admin_form($form_state) {
  $form['roles'] = array('#tree' => TRUE);
  $roles = bueditor_sorted_roles();
  $form['#weighted'] = count($roles) > 3;
  //user#1
  if ($GLOBALS['user']->uid == 1) {
    $u1 = array('name' => t('user #1'), 'weight' => t('n/a'), 'editor' => variable_get('bueditor_user1', 1), 'alt' => variable_get('bueditor_user1_alt', 0));
    $form['roles']['u1'] = bueditor_role_form($u1, $form['#weighted'], 1);
  }
  //other roles
  foreach ($roles as $rid => $role) {
    $core = $rid == DRUPAL_ANONYMOUS_RID || $rid == DRUPAL_AUTHENTICATED_RID;
    $form['roles'][$rid] = bueditor_role_form($role, $form['#weighted'], $core);
  }
  $form['submit'] = array('#type' => 'submit', '#value' => t('Save configuration'));
  $form['#submit'][] = 'bueditor_admin_submit';
  $form['#theme'] = 'bueditor_admin';
  return $form;
}

/**
 * Admin form themed.
 */
function bueditor_admin_theme($form = array()) {
  $header = array(t('User role'), t('Assigned editor'), t('Alternative editor'));
  $keys = array('name', 'editor', 'alt');
  $info = '';
  if ($form['#weighted']) {
    $header[] = t('Weight');
    $keys[] = 'weight';
    $info = '<br />'. t('For users who have <strong>multiple roles</strong>, <strong>weight</strong> property will determine the assigned editor. Lighter roles that are placed upper will take the precedence. So, an administrator role should be placed over other roles by having a smaller weight, ie. -10.');
  }

  $rows = array();
  foreach (element_children($form['roles']) as $rid) {
    $cells = array();
    foreach ($keys as $key) {
      $cells[] = drupal_render($form['roles'][$rid][$key]);
    }
    $rows[] = $cells;
  }

  $output = '<h2 class="title">'. t('Role-editor assignments') .'</h2>';
  $output .= theme('table', $header, $rows, array('id' => 'roles-editors-list'));
  $output .= '<div class="form-item"><div class="description">'. t('Assign editors to user roles.') .'<br />'. t('Alternative editor makes it possible to use different editors for different textareas or different editors on diffrent pages. You just have to configure visibility settings for each editor.') . $info .'</div></div>';
  $output .= drupal_render($form);
  return $output;
}

/**
 * Admin form submit.
 */
function bueditor_admin_submit($form, &$form_state) {
  $roles = $form_state['values']['roles'];
  $roles[DRUPAL_ANONYMOUS_RID]['weight'] = 12;
  $roles[DRUPAL_AUTHENTICATED_RID]['weight'] = 11;
  if ($GLOBALS['user']->uid == 1 && isset($roles['u1'])) {
    variable_set('bueditor_user1', $roles['u1']['editor']);
    variable_set('bueditor_user1_alt', $roles['u1']['alt']);
    unset($roles['u1']);
  }
  if (count($roles) > 3) {
    uasort($roles, 'bueditor_rolesort');
  }
  variable_set('bueditor_roles', $roles);
  drupal_set_message(t('The changes have been saved.'));
}

/**
 * Role-editor form
 */
function bueditor_role_form($role, $weight = TRUE, $core = TRUE) {
  $form['name'] = array(
    '#type' => 'markup',
    '#value' => $role['name'],
  );
  if ($weight) {
    $form['weight'] = $core ? array(
      '#type' => 'markup',
      '#value' => $role['weight'],
    ) : array(
      '#type' => 'weight',
      '#default_value' => $role['weight'],
    );
  }
  $form['editor'] = array(
    '#type' => 'select',
    '#options' => bueditor_editor_options(),
    '#default_value' => $role['editor'],
  );
  $form['alt'] = array(
    '#type' => 'select',
    '#options' => bueditor_editor_options(),
    '#default_value' => $role['alt'],
  );
  return $form;
}

/**
 * Editor options.
 */
function bueditor_editor_options() {
  static $options;
  if (!isset($options)) {
    $options = array(0 => t('none'));
    foreach (bueditor_editors('all') as $eid => $editor) {
      $options[$eid] = $editor->name;
    }
  }
  return $options;
}

/**
 * Template form for buttons
 */
function bueditor_button_form($button = NULL) {
  $button = is_object($button) ? $button : bueditor_button_defaults();
  $form = array();
  $form['title'] = array(
    '#type' => 'textfield',
    '#default_value' => $button->title,
    '#size' => 14,
    '#attributes' => array('class' => 'input-title'),
  );
  $form['content'] = array(
    '#type' => 'textarea',
    '#default_value' => $button->content,
    '#rows' => 1,
    '#attributes' => array('class' => 'input-content'),
  );
  $form['icon'] = array(
    '#type' => 'textfield',
    '#default_value' => $button->icon,
    '#size' => 3,
    '#attributes' => array('class' => 'input-icon'),
  );
  $form['accesskey'] = array(
    '#type' => 'textfield',
    '#default_value' => $button->accesskey,
    '#size' => 2,
    '#maxlength' => 1,
    '#attributes' => array('class' => 'input-key'),
  );
  $form['weight'] = array(
    '#type' => 'textfield',
    '#default_value' => $button->weight,
    '#size' => 3,
    '#attributes' => array('class' => 'input-weight'),
  );
  return $form;
}

/**
 * Editor form.
 */
function bueditor_editor_form($form_state, $editor = NULL) {
  $editor = is_object($editor) ? $editor : bueditor_editor_defaults();

  $form = array(
    '#cache' => TRUE,
    '#tree' => TRUE,
    '#theme' => 'bueditor_editor',
    '#attributes' => array('enctype' => 'multipart/form-data'),
  );
  $form['editor']['eid'] = array(
    '#type' => 'hidden',
    '#value' => $editor->eid
  );
  $form['editor']['name'] = array('#type' => 'textfield',
    '#title' => t('Editor name'),
    '#maxlength' => 255,
    '#default_value' => $editor->name,
    '#required' => TRUE,
  );
  $form['editor']['pages'] = array('#type' => 'textarea',
    '#title' => t('Show the editor on specific pages'),
    '#default_value' => $editor->pages,
    '#description' => t('Enter one page per line as Drupal paths. The * character is a wildcard.'),
  );
  $form['editor']['excludes'] = array('#type' => 'textarea',
    '#title' => t('Hide the editor for specific textareas'),
    '#default_value' => $editor->excludes,
    '#description' => t('Enter one textarea ID per line. The * character is a wildcard.'),
  );
  $form['editor']['iconpath'] = array('#type' => 'textfield',
    '#title' => t('Directory of editor icons'),
    '#maxlength' => 255,
    '#default_value' => $editor->iconpath,
    '#description' => t('Web accessible directory path where editor icons reside.') .' '. t('Placeholders that you can use are; %BUEDITOR (bueditor path), %FILES (drupal files path), and %THEME (current theme\'s path).'),
  );
  $form['editor']['librarypath'] = array('#type' => 'textarea',
    '#title' => t('Editor specific library files'),
    '#default_value' => $editor->librarypath,
    '#description' => t('Web accessible javascript(.js) or style sheet(.css) file paths to be included with the editor. Enter one file path per line.') .' '. t('Placeholders that you can use are; %BUEDITOR (bueditor path), %FILES (drupal files path), and %THEME (current theme\'s path).'),
  );

  //buttons
  foreach (bueditor_buttons($editor->eid) as $bid => $button) {
    $form['buttons'][$bid] = bueditor_button_form($button);
    $form['checks'][$bid] = array('#type' => 'checkbox');
  }

  //imported/copied buttons are previewed. not saved yet.
  if (isset($_SESSION['bueimport']) && $import = $_SESSION['bueimport']) {
    $import = is_array($import) ? $import : bueditor_import_buttons($import);
    if (empty($import)) {
      drupal_set_message(t('There is no button to import.'), 'error');
    }
    else {
      foreach ($import as $bid => $button) {
        $form['buttons']['new'. $bid] = bueditor_button_form($button);
      }
      drupal_set_message(t('New buttons are ready to be saved.'));
    }
    unset($_SESSION['bueimport']);
  }

  //there is always two new buttons.
  $form['buttons']['new'] = $form['buttons']['new_'] = bueditor_button_form();

  if ($editor->eid) {
    //actions for selected buttons
    $form['selaction'] = array('#type' => 'select', '#options' => array('' => t('... selecteds'), 'delete' => t('Delete'), 'export' => t('Export to file'), 'copyto' => t('Copy to editor')));
    $eoptions = array('new' => t('New editor')) + bueditor_editor_options();
    unset($eoptions[0]);
    $form['copyto'] = array('#type' => 'select', '#options' => $eoptions);
    $form['go'] = array('#type' => 'submit', '#value' => t('Go'), '#submit' => array('bueditor_selaction_submit'));
    //import
    $form['buecsv'] = array('#type' => 'file', '#title' => t('CSV file containing the buttons'));
    $form['import'] = array('#type' => 'submit', '#value' => t('Import'), '#submit' => array('bueditor_csv_submit'));
  }
    //configuration submit
  $form['submit'] = array('#type' => 'submit', '#value' => t('Save configuration'), '#submit' => array('bueditor_editor_submit'));
  return $form;
}

/**
 * Editor form themed.
 */
function bueditor_editor_theme($form = array()) {
  $path = drupal_get_path('module', 'bueditor');
  $eid = $form['editor']['eid']['#value'];
  $header = array(
    array('data' => t('Title'), 'class' => 'th-title'),
    array('data' => t('Content'), 'class' => 'th-content'),
    array('data' => t('Icon'), 'class' => 'th-icon'),
    array('data' => t('Key'), 'class' => 'th-key'),
    array('data' => t('Weight'), 'class' => 'th-weight'),
    theme('table_select_header_cell'),
  );
  $rows = array();
  foreach (element_children($form['buttons']) as $bid) {
    $new = !is_numeric($bid);
    $cells = array();
    $cells[] = drupal_render($form['buttons'][$bid]['title']);
    $cells[] = drupal_render($form['buttons'][$bid]['content']);
    $cells[] = drupal_render($form['buttons'][$bid]['icon']);
    $cells[] = drupal_render($form['buttons'][$bid]['accesskey']);
    $cells[] = drupal_render($form['buttons'][$bid]['weight']);
    $cells[] = $new ? '<a>new</a>' : drupal_render($form['checks'][$bid]);
    $row = array('data' => $cells, 'class' => 'draggable');
    if ($new) {
      $row['class'] .= ' new-button';
    }
    $rows[] = $row;
  }

  $help = '<div class="help">'. t('To add a new button, you can either specify it at the bottom of the button list or import a CSV file which contains previously exported buttons. For more information about buttons and editor API please read !readme.', array('!readme' => '<a href="'. base_path() . $path .'/README.txt">README.txt</a>')) .'</div>';
  $name = theme('fieldset', array(
    '#title' => t('Editor name'),
    '#children' => drupal_render($form['editor']['name']),
    '#collapsible' => TRUE,
    '#collapsed' => $eid
  ));
  $visibility = theme('fieldset', array(
    '#title' => t('Visibility settings'),
    '#children' => drupal_render($form['editor']['pages']) . drupal_render($form['editor']['excludes']),
    '#collapsible' => TRUE,
    '#collapsed' => $eid
  ));
  $paths = theme('fieldset', array(
    '#title' => t('Editor paths'),
    '#children' => drupal_render($form['editor']['iconpath']) . drupal_render($form['editor']['librarypath']),
    '#collapsible' => TRUE,
    '#collapsed' => $eid
  ));
  $buttons = theme('table', $header, $rows, array('class' => 'button-table', 'id' => 'button-table'));
  $selaction = $eid ? '<div id="sel-action-wrapper">'. drupal_render($form['selaction']) . drupal_render($form['copyto']) . drupal_render($form['go']) .'</div>' : '';
  $import = $eid ? theme('fieldset', array(
    '#title' => t('Import Buttons'),
    '#children' => drupal_render($form['buecsv']) . drupal_render($form['import']) . $help,
    '#collapsible' => TRUE,
    '#collapsed' => TRUE
  )) : '';
  $demo = '';
  if ($eid && bueditor_settle($eid)) {
    $set['BUE']['preset']['editor-demo'] = "e$eid";
    $demo = '<h2 class="title">'. t('Demo') .'</h2><div class="form-item"><textarea cols="60" rows="20" id="editor-demo" class="form-textarea">DEMO</textarea></div>';
  }

  $set['BUE']['iconpath'] = bueditor_path_tr($form['editor']['iconpath']['#value']);
  $set['BUE']['iconlist'] = bueditor_icons($set['BUE']['iconpath']);
  drupal_add_css($path .'/admin/admin.css', 'media', 'all', FALSE);//no preprocessing
  drupal_add_js($path .'/admin/admin.js', 'module', 'header', FALSE, TRUE, FALSE);//no preprocessing
  drupal_add_js($set, 'setting');
  drupal_add_tabledrag('button-table', 'order', 'sibling', 'input-weight');

  $output = $name . $visibility . $paths;
  $output .= '<h2 class="title">'. t('Buttons') .'</h2>'. $buttons . $selaction;
  $output .= drupal_render($form['submit']) . $import;
  $output .= drupal_render($form) . $demo;
  return $output;
}

/**
 * Save editor & buttons.
 */
function bueditor_editor_submit($form, &$form_state) {
  $editor = (object) $form_state['values']['editor'];
  $buttons = array();
  foreach ($form_state['values']['buttons'] as $bid => $button) {
    if ($button['title']) {
      $button['bid'] = $bid;
      $button['content'] = str_replace("\r\n", "\n", $button['content']);
      $buttons[] = (object) $button;
    }
  }
  $message = $editor->eid ? t('The changes have been saved.') : t('New editor has been added.');
  if ($editor = bueditor_write_editor($editor, $buttons)) {
    $form_state['redirect'] = 'admin/settings/bueditor/'. $editor->eid;
    drupal_set_message($message);
  }
}

/**
 * Export or delete selected buttons.
 */
function bueditor_selaction_submit($form, &$form_state) {
  $bids = array_keys(array_filter($form_state['values']['checks']));
  switch ($form_state['values']['selaction']) {
    case 'delete':
      bueditor_delete_buttons($bids);
      break;
    case 'export':
      bueditor_export_buttons($bids);
      break;
    case 'copyto':
      $_SESSION['bueimport'] = bueditor_buttons_by_id($bids);
      $form_state['redirect'] = 'admin/settings/bueditor/'. $form_state['values']['copyto'];
      break;
  }
}

/**
 * Save CSV file for import operation.
 */
function bueditor_csv_submit($form, &$form_state) {
  if ($file = file_save_upload('buecsv', array(), file_directory_temp())) {
    $_SESSION['bueimport'] = $file->filepath;
  }
}

/**
 * Editor deletion form. Confirm & delete
 */
function bueditor_delete_form($form_state, $editor) {
  return confirm_form(array(), t('Are you sure you want to delete the editor(%name)?', array('%name' => $editor->name)), 'admin/settings/bueditor', t('All buttons and settings of this editor will be removed.') .' '. t('This action cannot be undone.'), t('Delete'), t('Cancel'));
}
function bueditor_delete_form_submit($form, &$form_state) {
  $editor = $form['#parameters'][2];
  bueditor_delete_editor($editor->eid);
  drupal_set_message(t('Editor(%name) has been deleted.', array('%name' => $editor->name)));

  //update roles
  $roles = variable_get('bueditor_roles', array());
  foreach ($roles as $rid => $role) {
    $roles[$rid]['editor'] = $editor->eid == $role['editor'] ? 0 : $role['editor'];
    $roles[$rid]['alt'] = $editor->eid == $role['alt'] ? 0 : $role['alt'];
  }
  variable_set('bueditor_roles', $roles);

  $form_state['redirect'] = 'admin/settings/bueditor';
}

/**
 * Delete buttons.
 */
function bueditor_delete_buttons($bids = array()) {
  if (!empty($bids)) {
    foreach ($bids as $bid) {
      bueditor_delete_button($bid);
    }
    drupal_set_message(t('Selected buttons have been deleted.'));
  }
}
function bueditor_delete_button($bid) {
  db_query("DELETE FROM {bueditor_buttons} WHERE bid = %d", $bid);
}

/**
 * Delete an editor.
 */
function bueditor_delete_editor($eid) {
  db_query("DELETE FROM {bueditor_buttons} WHERE eid = %d", $eid);
  db_query("DELETE FROM {bueditor_editors} WHERE eid = %d", $eid);
}

/**
 * Export buttons as CSV.
 */
function bueditor_export_buttons($bids = array()) {
  foreach (bueditor_buttons_by_id($bids) as $bid => $button) {
    $button = (array) $button;
    unset($button['bid'], $button['eid']);
    if (!isset($output)) {
      $output = '"'. implode('", "', array_keys($button)) .'"'."\n";
    }
    $output .= '"'. implode('", "', array_map('addslashes', array_values($button))) .'"'."\n";
  }
  if (isset($output)) {
    header('Content-type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=bueditor_buttons.csv');
    print $output;
    exit();
  }
  drupal_set_message(t('There is no button to export.'), 'error');
}

/**
 * Import buttons from a CSV file.
 */
function bueditor_import_buttons($file) {
  $buttons = array();
  if (is_file($file) && $fp = fopen($file, 'r')) {
    $fields = fgetcsv($fp, 100000);
    if (in_array('title', $fields)) {
      while ($values = fgetcsv($fp, 100000)) {
        $button = array();
        for ($i = 0; isset($fields[$i]); $i++) {
          $button[$fields[$i]] = stripslashes($values[$i]);
        }
        $buttons[] = (object) $button;
      }
    }
  }
  return $buttons;
}

/**
 * Load icons in the path
 */
function bueditor_icons($path) {
  $icons = file_scan_directory($path, '\.(png|gif|jpg)$', array('.', '..', 'CVS'), 0, 0, 'basename');
  array_walk($icons, create_function('&$value', '$value = 1;'));
  return $icons;
}

/**
 * Sort roles according to their weights.
 */
function bueditor_sorted_roles() {
  static $sorted;
  if (!isset($sorted)) {
    $sorted = array();
    $roles = user_roles();
    $broles = variable_get('bueditor_roles', array());
    $broles[DRUPAL_ANONYMOUS_RID]['weight'] = 12;
    $broles[DRUPAL_AUTHENTICATED_RID]['weight'] = 11;
    foreach ($roles as $rid => $name) {
      $sorted[$rid] = array(
        'name' => $name,
        'weight' => (int) $broles[$rid]['weight'],
        'editor' => (int) $broles[$rid]['editor'],
        'alt' => (int) $broles[$rid]['alt']
      );
    }
    uasort($sorted, 'bueditor_rolesort');
  }
  return $sorted;
}

/**
 * user sorting function for roles.
 */
function bueditor_rolesort($r1, $r2) {
  return $r1['weight']-$r2['weight'];
}

/**
 * Return update state for an object to be used with drupal_write_record.
 */
function bueditor_isupdate($obj, $key) {
  return isset($obj->$key) && is_numeric($obj->$key) && $obj->$key > 0 ? array($key) : array();
}

/**
 * Update/insert an editor.
 */
function bueditor_write_editor($editor, $buttons = array()) {
  if (drupal_write_record('bueditor_editors', $editor, bueditor_isupdate($editor, 'eid'))) {
    foreach ($buttons as $button) {
      $button->eid = $editor->eid;
      drupal_write_record('bueditor_buttons', $button, bueditor_isupdate($button, 'bid'));
    }
    return $editor;
  }
  return FALSE;
}

/**
 * Create the default editor.
 */
function bueditor_add_default_editor($name = 'default editor') {
  $editor = bueditor_editor_defaults($name ? $name : 'default editor');
  //__FILE__ is used to make this function shutdown compatible. Used during installation.
  $buttons = bueditor_import_buttons(dirname(__FILE__) . '/default_buttons.csv');
  return bueditor_write_editor($editor, $buttons);
}

/**
 * Default values of a new editor.
 */
function bueditor_editor_defaults($name = '') {
  return (object) array(
    'eid' => '',
    'name' => $name,
    'pages' => "node/*\ncomment/*",
    'excludes' => 'edit-log',
    'iconpath' => '%BUEDITOR/icons',
    'librarypath' => '%BUEDITOR/library/default_buttons_functions.js'
  );
}

/**
 * Default values of a new button.
 */
function bueditor_button_defaults($title = '') {
  return (object) array(
    'title' => $title,
    'content' => '',
    'icon' => '',
    'accesskey' => '',
    'weight' => 0
  );
}

/**
 * Load buttons by ids.
 */
function bueditor_buttons_by_id($bids = array()) {
  $sql = 'SELECT * FROM {bueditor_buttons} WHERE bid IN ('. db_placeholders($bids) .') ORDER BY weight, title';
  return empty($bids) ? array() : bueditor_query_buttons($sql, $bids);
}

/**
 * Prepare and execute if there is any valid editor operation.
 */
function bueditor_prepare_eop() {
  if (isset($_GET['eop']) && isset($_GET['token']) && drupal_valid_token($_GET['token'], 'bueditor')) {
    $editors = bueditor_editors('all');
    $name = isset($_GET['name']) ? check_plain($_GET['name']) : '';
    $editor = isset($_GET['eid']) && isset($editors[$_GET['eid']]) ? drupal_clone($editors[$_GET['eid']]) : NULL;
    bueditor_eop($_GET['eop'], $editor, $name);
    drupal_goto('admin/settings/bueditor');
  }
  //Add editor name prompt for copy and add_default operations.
  //Confirm editor deletion without going to confirm page.
  drupal_add_js('$(function() {
  $("#available-editors-list").find("a.eop-copy, a.eop-add-default").removeClass("active").click(function() {
    var name = prompt("'. t('Editor name') .'", this.name);
    if (name) location.replace(this.href + "&name=" + name);
    return false;
  }).end().find("a.eop-delete").click(function() {
    if (confirm("'. t('All buttons and settings of this editor will be removed.') .'")) {
      location.replace($(this).nextAll("a.eop-copy")[0].href.replace("eop=copy", "eop=delete"));
    }
    return false;
  });
  });', 'inline');
}

/**
 * Editor operations that don't require form submission.
 */
function bueditor_eop($op, $editor = NULL, $name = '') {
  switch ($op) {
    case 'add_default':
      if ($editor = bueditor_add_default_editor($name)) {
        drupal_set_message(t('Editor(%name) has been added.', array('%name' => $editor->name)));
      }
      break;
    case 'copy':
      if ($editor) {
        $buttons = bueditor_buttons($editor->eid);
        $editor->eid = NULL;
        $editor->name = $name ? $name : 'Copy of '. $editor->name;
        array_walk($buttons, create_function('&$button', '$button->bid = NULL;'));
        if (bueditor_write_editor($editor, $buttons)) {
          drupal_set_message(t('Editor(%name) has been added.', array('%name' => $editor->name)));
        }
      }
      break;
    case 'delete'://mimic editor delete form submission
      if ($editor) {
        $form['#parameters'][2] = $editor;
        $form_state = array();
        bueditor_delete_form_submit($form, $form_state);
      }
      break;
  }
}