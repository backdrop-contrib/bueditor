<?php

/**
 * @file
 * Serves administration pages of BUEditor.
 */

include_once BACKDROP_ROOT . '/' . backdrop_get_path('module', 'bueditor') . '/bueditor.inc';

/**
 * Admin main page.
 */
function bueditor_admin() {
  bueditor_eop();
  $path = 'admin/config/content/bueditor';
  $editors = bueditor_editors('all');
  $token = backdrop_get_token(date('ymd'));
  $header = array(t('Editor name'), t('Operations'));
  $rows = array();
  foreach ($editors as $id => $editor) {
    $rows[] = array(
      check_plain($editor->name),
      l(t('Edit'), $path . '/' . $id) . ' | ' .
      l(t('Delete'), $path . '/' . $id . '/delete', array('attributes' => array('class' => array('eop-delete')))) . ' | ' .
      l(t('Export'), $path, array('attributes' => array('class' => array('eop-export')), 'query' => array('eop' => 'export', 'id' => $id, 'token' => $token)))
    );
  }
  $rows[] = array(array('data' =>
    l(t('Add new editor'), $path . '/new') . ' | ' .
    l(t('Import editor'), $path . '/import')
  , 'colspan' => 2));
  $output['title'] = array(
    '#markup' => '<h2 class="title">' . t('Available editors') . '</h2>'
  );
  $output['table'] = array(
    '#theme' => 'table',
    '#header' => $header,
    '#rows' => $rows,
    '#attributes' => array('id' => 'available-editors-list')
  );
  $output['form'] = backdrop_get_form('bueditor_admin_form');
  return $output;
}

/**
 * Admin form.
 */
function bueditor_admin_form($form, &$form_state) {
  $config = config('bueditor.settings');

  $form['roles'] = array(
    '#tree' => TRUE,
  );
  $roles = bueditor_sorted_roles();
  $form['#weighted'] = count($roles) > 3;
  //user#1
  if ($GLOBALS['user']->uid == 1) {
    $u1 = array(
      'name' => t('Site maintenance account'),
      'weight' => t('n/a'),
      'editor' => $config->get('bueditor_user1'),
      'alt' => $config->get('bueditor_user1_alt'),
    );
    $form['roles']['u1'] = bueditor_role_form($u1, $form['#weighted'], 1);
  }
  //other roles
  foreach ($roles as $rid => $role) {
    $core = $rid == 'anonymous' || $rid == 'authenticated';
    $form['roles'][$rid] = bueditor_role_form($role, $form['#weighted'], $core);
  }
  $form['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Save configuration'),
  );
  $form['#submit'][] = 'bueditor_admin_submit';
  $form['#theme'] = 'bueditor_admin';
  return $form;
}

/**
 * Admin form theming.
 */
function bueditor_admin_theme($variables) {
  $form = $variables['form'];
  $header = array(t('User role'), t('Assigned editor'), t('Alternative editor'));
  $keys = array('name', 'editor', 'alt');
  $info = '';
  if ($form['#weighted']) {
    $header[] = t('Weight');
    $keys[] = 'weight';
    $info = '<br />' . t('For users who have <strong>multiple roles</strong>, the <strong>weight</strong> property will determine the assigned editor. Lighter roles that are placed upper will take the precedence. So, an administrator role should be placed over other roles by having a smaller weight, ie. -10.');
  }

  $rows = array();
  foreach (element_children($form['roles']) as $rid) {
    $cells = array();
    foreach ($keys as $key) {
      $cells[] = backdrop_render($form['roles'][$rid][$key]);
    }
    $rows[] = $cells;
  }

  $output = '<h2 class="title">' . t('Role-editor assignments') . '</h2>';
  $output .= theme('table', array('header' => $header, 'rows' => $rows, 'attributes' => array('id' => 'roles-editors-list')));
  $output .= '<div class="form-item"><div class="description">' . t('Assign editors to user roles.') . '<br />' . t('Alternative editor makes it possible to use different editors for different textareas or different editors on diffrent pages. You just have to configure visibility settings for each editor.') . $info . '</div></div>';
  $output .= backdrop_render_children($form);
  return $output;
}

/**
 * Admin form submission.
 */
function bueditor_admin_submit($form, &$form_state) {
  $config = config('bueditor.settings');
  $roles = $form_state['values']['roles'];
  $roles['anonymous']['weight'] = 12;
  $roles['authenticated']['weight'] = 11;
  if ($GLOBALS['user']->uid == 1 && isset($roles['u1'])) {
    $config->set('bueditor_user1', $roles['u1']['editor']);
    $config->set('bueditor_user1_alt', $roles['u1']['alt']);
    unset($roles['u1']);
  }
  if (count($roles) > 3) {
    uasort($roles, 'bueditor_rolesort');
  }
  $config->set('bueditor_roles', $roles);
  $config->save();
  backdrop_set_message(t('The changes have been saved.'));
}

/**
 * Role-editor form
 */
function bueditor_role_form($role, $weight = TRUE, $core = TRUE) {
  $form['name'] = array(
    '#markup' => check_plain($role['name']),
  );
  if ($weight) {
    $form['weight'] = $core ? array(
      '#markup' => $role['weight'],
    ) : array(
      '#type' => 'weight',
      '#default_value' => $role['weight'],
    );
  }
  $form['editor'] = array(
    '#type' => 'select',
    '#options' => bueditor_editor_options(),
    '#default_value' => $role['editor'],
    '#empty_value' => '0',
  );
  $form['alt'] = array(
    '#type' => 'select',
    '#options' => bueditor_editor_options(),
    '#default_value' => $role['alt'],
    '#empty_value' => '0',
  );
  return $form;
}

/**
 * Editor options.
 */
function bueditor_editor_options() {
  static $options;
  if (!isset($options)) {
    $options = array();
    foreach (bueditor_editors('all') as $id => $editor) {
      $options[$id] = $editor->name;
    }
  }
  return $options;
}

/**
 * Button form
 */
function bueditor_button_form($button = NULL) {
  $button = is_object($button) ? $button : bueditor_button_defaults();
  $form = array();
  $form['title'] = array(
    '#type' => 'textfield',
    '#default_value' => $button->title,
    '#size' => 14,
    '#attributes' => array(
      'class' => array('input-title'),
    ),
  );
  $form['content'] = array(
    '#type' => 'textarea',
    '#default_value' => $button->content,
    '#rows' => 1,
    '#attributes' => array(
      'class' => array('input-content'),
    ),
  );
  $form['icon'] = array(
    '#type' => 'textfield',
    '#default_value' => $button->icon,
    '#size' => 3,
    '#attributes' => array(
      'class' => array('input-icon'),
    ),
  );
  $form['accesskey'] = array(
    '#type' => 'textfield',
    '#default_value' => $button->accesskey,
    '#size' => 2,
    '#maxlength' => 1,
    '#attributes' => array(
      'class' => array('input-key'),
    ),
  );
  $form['weight'] = array(
    '#type' => 'textfield',
    '#default_value' => $button->weight,
    '#size' => 3,
    '#attributes' => array(
      'class' => array('input-weight'),
    ),
  );
  return $form;
}

/**
 * Editor form.
 */
function bueditor_editor_form($form, &$form_state, $editor = NULL) {
  $editor = is_object($editor) ? $editor : bueditor_editor_defaults();
  $editor->id = isset($editor->id) ? $editor->id : NULL;

  $form_state['cache'] = TRUE;
  $form = array(
    '#tree' => TRUE,
    '#theme' => 'bueditor_editor',
    '#attributes' => array('enctype' => 'multipart/form-data'),
  );
  $form['name'] = array(
    '#type' => 'textfield',
    '#title' => t('Editor name'),
    '#maxlength' => 255,
    '#default_value' => $editor->name,
    '#required' => TRUE,
  );
  $form['id'] = array(
    '#type' => 'machine_name',
    '#default_value' => $editor->id,
    '#maxlength' => 32,
    '#disabled' => isset($editor->id),
    '#machine_name' => array(
      'exists' => 'bueditor_id_exists',
    ),
    '#description' => t('A unique machine-readable name for this editor. It must only contain lowercase letters, numbers, and underscores.'),
  );
  $form['editor']['pages'] = array(
    '#type' => 'textarea',
    '#title' => t('Show the editor on specific pages'),
    '#default_value' => $editor->pages,
    '#description' => t('Enter one page per line as Backdrop paths. The * character is a wildcard.'),
  );
  $form['editor']['excludes'] = array(
    '#type' => 'textarea',
    '#title' => t('Hide the editor for specific textareas'),
    '#default_value' => $editor->excludes,
    '#description' => t('Enter one textarea ID per line. The * character is a wildcard.'),
  );
  $form['editor']['iconpath'] = array(
    '#type' => 'textfield',
    '#title' => t('Directory of editor icons'),
    '#maxlength' => 255,
    '#default_value' => $editor->iconpath,
    '#description' => t('Web accessible directory path where editor icons reside.') . ' ' . t('Placeholders that you can use are; %BUEDITOR (bueditor path), %FILES (backdrop files path), and %THEME (current theme\'s path).'),
  );
  $form['editor']['librarypath'] = array(
    '#type' => 'textarea',
    '#title' => t('Editor specific library files'),
    '#default_value' => $editor->librarypath,
    '#description' => t('Web accessible javascript(.js) or style sheet(.css) file paths to be included with the editor. Enter one file path per line.') . ' ' . t('Placeholders that you can use are; %BUEDITOR (bueditor path), %FILES (backdrop files path), and %THEME (current theme\'s path).'),
  );
  $form['editor']['spriteon'] = array(
    '#type' => 'checkbox',
    '#title' => t('Enable CSS sprites'),
    '#default_value' => $editor->spriteon,
    '#description' => t('<a href="http://www.alistapart.com/articles/sprites">What are CSS sprites?</a>. The sprites will be stored in %dir.', array('%dir' => bueditor_sprites_dir())),
  );

  //buttons
  foreach (bueditor_buttons($editor->id) as $bid => $button) {
    $form['buttons'][$bid] = bueditor_button_form($button);
    $form['checks'][$bid] = array('#type' => 'checkbox');
  }

  //imported/copied buttons are previewed. not saved yet.
  if (isset($_SESSION['bueimport']) && $import = $_SESSION['bueimport']) {
    $import = is_array($import) ? $import : bueditor_import_csv_buttons($import);
    if (empty($import)) {
      backdrop_set_message(t('There is no button to import.'), 'warning');
    }
    else {
      foreach ($import as $bid => $button) {
        $form['buttons']['new' . $bid] = bueditor_button_form($button);
      }
      backdrop_set_message(t('New buttons are ready to be saved.'));
    }
    unset($_SESSION['bueimport']);
  }

  //there are always two new buttons.
  $form['buttons']['new'] = $form['buttons']['new_'] = bueditor_button_form();

  if ($editor->id) {
    //actions for selected buttons
    $form += bueditor_selaction_form();
    //button import
    $form += bueditor_button_import_form();
    //demo
    $form += array('demo' => array(
      '#type' => 'text_format',
      '#base_type' => 'textarea',
      '#title' => t('Demo'),
      '#rows' => 10,
      '#value' => 'DEMO',
      '#format' => NULL,//filter_default_format()
    ));
  }
  //configuration submit
  $form['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Save configuration'),
    '#submit' => array('bueditor_editor_submit'),
  );
  return $form;
}

/**
 * Check that editor id exists
 */
function bueditor_id_exists($value) {
  $prefix = 'bueditor.editor.';
  $config_names = config_get_names_with_prefix($prefix);

  foreach ($config_names as $config_name) {
    $config = config($config_name);
    $id = $config->get('id');
    if ($value == $id) {
      return TRUE;
    }
  }
}

/**
 * Editor form theming.
 */
function bueditor_editor_theme($variables) {
  $form = $variables['form'];
  $path = backdrop_get_path('module', 'bueditor');
  $id = $form['id']['#value'];
  $header = array(array(
    'data' => t('Title'),
    'class' => array('th-title'),
  ), array(
    'data' => t('Content'),
    'class' => array('th-content'),
  ), array(
    'data' => t('Icon'),
    'class' => array('th-icon'),
  ), array(
    'data' => t('Key'),
    'class' => array('th-key'),
  ), array(
    'data' => t('Weight'),
    'class' => array('th-weight'),
  ), array(
    'data' => '',
    'class' => 'select-all',
  ));
  $rows = array();
  foreach (element_children($form['buttons']) as $bid) {
    $new = !is_numeric($bid);
    $cells = array();
    $cells[] = backdrop_render($form['buttons'][$bid]['title']);
    $cells[] = backdrop_render($form['buttons'][$bid]['content']);
    $cells[] = backdrop_render($form['buttons'][$bid]['icon']);
    $cells[] = backdrop_render($form['buttons'][$bid]['accesskey']);
    $cells[] = backdrop_render($form['buttons'][$bid]['weight']);
    $cells[] = $new ? '<a>new</a>' : backdrop_render($form['checks'][$bid]);
    $row = array(
      'data' => $cells,
      'class' => array('draggable'),
    );
    if ($new) {
      $row['class'][] = 'new-button';
    }
    $rows[] = $row;
  }

  //set title
  if ($form['name']['#value']) {
    backdrop_set_title(t('Settings for the editor @name', array('@name' => $form['name']['#value'])));
  }
  $name = theme_fieldset(array('element' => array(
    '#title' => t('Editor name'),
    '#children' => backdrop_render($form['name']) . backdrop_render($form['id']),
    '#attributes' => array(),
  )));
  $visibility = theme('fieldset', array('element' => array(
    '#title' => t('Visibility settings'),
    '#children' => backdrop_render($form['editor']['pages']) . backdrop_render($form['editor']['excludes']),
    '#attributes' => array(),
  )));
  $paths = theme('fieldset', array('element' => array(
    '#title' => t('Editor paths'),
    '#children' => backdrop_render($form['editor']['iconpath']) . backdrop_render($form['editor']['spriteon']) . backdrop_render($form['editor']['librarypath']),
    '#attributes' => array(),
  )));
  $import = $id ? theme('fieldset', array('element' => array(
    '#title' => t('Import Buttons'),
    '#children' => t('<em>You can either upload a CSV file exported from BUEditor 6.x-1.x or earlier</em> !csvfield <em>OR paste the editor code containing the buttons</em> !codefield', array('!csvfield' => backdrop_render($form['importcsv']), '!codefield' => backdrop_render($form['importcode']))) . backdrop_render($form['import']),
    '#attributes' => array(),
  ))) : '';
  $buttons = theme('table', array(
    'header' => $header,
    'rows' => $rows,
    'attributes' => array('class' => array('button-table'), 'id' => 'button-table'),
  ));
  $selaction = $id ? '<div id="sel-action-wrapper">' . backdrop_render($form['selaction']) . backdrop_render($form['copyto']) . backdrop_render($form['go']) . '</div>' : '';

  $timer = timer_read('page');
  $demo = '';
  if ($id && !isset($_GET['nodemo']) && bueditor_settle($id)) {
    $set['BUE']['preset']['edit-demo-value'] = "e$id";
    $demo = backdrop_render($form['demo']);
    $set['BUE']['demotime'] = round(timer_read('page') - $timer);
  }

  $set['BUE']['iconpath'] = bueditor_path_tr($form['editor']['iconpath']['#value']);
  $set['BUE']['iconlist'] = bueditor_icons($set['BUE']['iconpath']);
  $output = theme('vertical_tabs', array('element' => array('#children' => $name . $visibility . $paths . $import)));
  $output .= '<h2 class="title">' . t('Buttons') . '</h2>' . $buttons . $selaction . backdrop_render($form['submit']);
  $output .= backdrop_render_children($form) . $demo;

  backdrop_add_js('core/misc/tableselect.js');
  backdrop_add_css($path . '/admin/bueditor.edit.css');
  backdrop_add_js($path . '/admin/bueditor.edit.js');
  backdrop_add_js($set, 'setting');
  backdrop_add_tabledrag('button-table', 'order', 'sibling', 'input-weight');
  return $output;
}

/**
 * Editor form submission.
 */
function bueditor_editor_submit($form, &$form_state) {
  $editor = (object) $form_state['values']['editor'];
  $editor->name = $form_state['values']['name'];
  $editor->id = $form_state['values']['id'];
  $buttons = array();
  foreach ($form_state['values']['buttons'] as $bid => $button) {
    if ($button['title']) {
      $button['bid'] = $bid;
      $button['content'] = str_replace("\r\n", "\n", $button['content']);
      $buttons[] = (object) $button;
    }
  }
  $old = $editor->id;
  if ($editor = bueditor_write_editor($editor, $buttons)) {
    $form_state['redirect'] = 'admin/config/content/bueditor/' . $editor->id;
    $old ? backdrop_set_message(t('The changes have been saved.')) : bueditor_message_added($editor->name);
  }
}

/**
 *  Selected buttons actions form.
 */
function bueditor_selaction_form() {
  $form['selaction'] = array(
    '#type' => 'select',
    '#options' => array(
      '' => t('... selecteds'),
      'delete' => t('Delete'),
      'export' => t('Export'),
      'copyto' => t('Copy to editor'),
    ),
  );
  $form['copyto'] = array(
    '#type' => 'select',
    '#options' => array('new' => t('Add new editor')) + bueditor_editor_options(),
  );
  $form['go'] = array(
    '#type' => 'submit',
    '#value' => t('Go'),
    '#submit' => array('bueditor_selaction_submit'),
  );
  return $form;
}

/**
 * Selected buttons actions form submission.
 */
function bueditor_selaction_submit($form, &$form_state) {
  $bids = array_keys(array_filter($form_state['values']['checks']));
  $editor = (object) $form_state['values']['editor'];
  $editor->id = $form_state['values']['id'];
  switch ($form_state['values']['selaction']) {
    case 'delete':
      bueditor_delete_buttons($bids, $editor->id);
      break;
    case 'export':
      bueditor_export_buttons($bids, $editor->id);
      break;
    case 'copyto':
      $_SESSION['bueimport'] = bueditor_buttons_by_id($bids, $editor->id);
      $form_state['redirect'] = 'admin/config/content/bueditor/' . $form_state['values']['copyto'];
      break;
  }
}

/**
 * Delete buttons.
 */
function bueditor_delete_buttons(array $bids, $id) {
  $config = config('bueditor.editor.' . $id);
  $buttons = $config->get('buttons');
  if (!empty($bids)) {
    foreach ($bids as $bid) {
      unset($buttons[$bid]);
    }
    $config->set('buttons',$buttons);
    $config->save();
    backdrop_set_message(t('Selected buttons have been deleted.'));
  }
}

/**
 * Export buttons using var_export. The genarated code can also be imported as an editor.
 */
function bueditor_export_buttons(array $bids, $id) {
  $editor = array();
  $editor['buttons'] = bueditor_exportable_buttons(bueditor_buttons_by_id($bids, $id));
  if (!empty($editor['buttons'])) {
    bueditor_export_text(var_export($editor, TRUE), 'bueditor.buttons.txt');
  }
  backdrop_set_message(t('There is no button to export.'), 'warning');
}

/**
 * Button import form.
 */
function bueditor_button_import_form() {
  $form['importcsv'] = array(
    '#type' => 'file',
    '#title' => t('CSV file containing the buttons'),
  );
  $form['importcode'] = array(
    '#type' => 'textarea',
    '#title' => t('Editor code'),
    '#rows' => 10,
    '#description' => t('Enter previously exported editor code.') . ' ' . t('The code will be scanned for only buttons and all other data will be ignored.') . '<div class="messages warning">' . t('This code will be evaluated as PHP, therefore you must be sure that it is harmless and produces proper editor data.') . '</div>',
  );
  $form['import'] = array(
    '#type' => 'submit',
    '#value' => t('Import'),
    '#submit' => array('bueditor_button_import_submit'),
  );
  return $form;
}

/**
 * Button import form submission.
 */
function bueditor_button_import_submit($form, &$form_state) {
  if ($file = file_save_upload('importcsv', array('file_validate_extensions' => array('csv')), 'temporary://')) {
    $_SESSION['bueimport'] = backdrop_realpath($file->uri);
  }
  elseif ($code = $form_state['values']['importcode']) {
    if ($editor = bueditor_exec_editor_code($code)) {
      $_SESSION['bueimport'] = bueditor_grab_imported_buttons($editor);
    }
    else {
      backdrop_set_message(t('The editor code did not produce proper editor data.'), 'error');
    }
  }
}

/**
 * Import buttons from a CSV file.
 */
function bueditor_import_csv_buttons($file) {
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
 * Editor delete form.
 */
function bueditor_delete_form($form, &$form_state, $editor) {
  return confirm_form(array(), t('Are you sure you want to delete the editor @name?', array('@name' => $editor->name)), 'admin/config/content/bueditor', t('All buttons and settings of this editor will be removed.') . ' ' . t('This action cannot be undone.'), t('Delete'), t('Cancel'));
}

/**
 * Editor delete form submission.
 */
function bueditor_delete_form_submit($form, &$form_state) {
  $editor = $form_state['build_info']['args'][0];
  bueditor_delete_editor($editor->id);
  backdrop_set_message(t('Editor %name has been deleted.', array('%name' => $editor->name)));
  $form_state['redirect'] = 'admin/config/content/bueditor';
}

/**
 * Delete an editor.
 */
function bueditor_delete_editor($id) {
  config('bueditor.editor.' . $id)->delete();

  //update roles
  $roles = config_get('bueditor.settings', 'bueditor_roles');
  foreach ($roles as $rid => $role) {
    $roles[$rid]['editor'] = $id == $role['editor'] ? 0 : $role['editor'];
    $roles[$rid]['alt'] = $id == $role['alt'] ? 0 : $role['alt'];
  }
  config_set('bueditor.settings', 'bueditor_roles', $roles);
}

/**
 * Editor import form.
 */
function bueditor_editor_import_form($form, &$form_state) {
  bueditor_set_quick_import();
  $form['name'] = array(
    '#type' => 'textfield',
    '#title' => t('Editor name'),
    '#maxlength' => 255,
    '#required' => TRUE,
  );
  $form['id'] = array(
    '#type' => 'machine_name',
    '#maxlength' => 32,
    '#machine_name' => array(
      'exists' => 'bueditor_id_exists',
    ),
    '#description' => t('A unique machine-readable name for this editor. It must only contain lowercase letters, numbers, and underscores.'),
  );
  $form['dirname'] = array(
    '#type' => 'textfield',
    '#title' => t('Directory of editor files'),
    '#maxlength' => 255,
    '#field_prefix' => bueditor_public_dir() . '/',
    '#description' => t('Define a directory to store the library files imported from the editor code. Icons will be stored in a directory named "icons" under this directory. If you do not want to import the files or if the editor uses existing ones you can leave this field blank.'),
  );
  $form['code'] = array(
    '#type' => 'textarea',
    '#title' => t('Editor code (PHP)'),
    '#rows' => 20,
    '#required' => TRUE,
    '#description' => t('Enter previously exported editor code.') . '<div class="messages warning">' . t('This code will be evaluated as PHP, therefore you must be sure that it is harmless and produces proper editor data.') . '</div>',
  );
  $form['overwrite'] = array('#type' => 'select',
    '#title' => t('Overwrite'),
    '#options' => bueditor_editor_options(),
    '#empty_value' => '0',
    '#description' => t('You can optionally select the editor you want to overwrite. Otherwise, a new one will be created.'),
  );
  $form['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Import'),
  );
  $form['#validate'][] = 'bueditor_editor_import_validate';
  $form['#submit'][] = 'bueditor_editor_import_submit';
  return $form;
}

/**
 * Editor import form validation.
 */
function bueditor_editor_import_validate($form, &$form_state) {
  if (!($editor = bueditor_exec_editor_code($form_state['values']['code']))) {
    return form_error($form['code'], t('The editor code did not produce proper editor data.'));
  }
  $dirname = $form_state['values']['dirname'];
  if ($dirname) {
    $editor->custom_path = bueditor_public_dir() . '/' . $dirname;
    if (!file_prepare_directory($editor->custom_path, 1, 'dirname')) {
      return FALSE;
    }
  }
  $editor->name =  $form_state['values']['name'];
  $editor->id = !empty($form_state['values']['overwrite']) ? $form_state['values']['overwrite'] : $form_state['values']['id'];
  $form_state['editor'] = $editor;
}

/**
 * Editor import form submission.
 */
function bueditor_editor_import_submit($form, &$form_state) {
  if ($editor = bueditor_save_import($form_state['editor'])) {
    bueditor_message_added($editor->name);
    $form_state['redirect'] = 'admin/config/content/bueditor/' . $editor->id;
  }
}

/**
 * Save imported editor data. Save icons and library files into specified editor path.
 */
function bueditor_save_import($editor) {
  //this will fill in the blanks.
  $default = bueditor_editor_defaults('Noname');

  //buttons
  $buttons = bueditor_grab_imported_buttons($editor);

  //handle custom paths for icons and library files.
  if (isset($editor->custom_path) && file_prepare_directory($editor->custom_path, 1)) {
    $cpath = array(
      'tokened' => bueditor_path_tr($editor->custom_path, 'reverse'),
      'icons' => $editor->custom_path . '/icons',
      'library' => $editor->custom_path,
    );
    //custom icons
    if (isset($editor->icons) && !empty($editor->icons) && file_prepare_directory($cpath['icons'], 1)) {
      foreach ($editor->icons as $name => $base64) {
        $filepath = $cpath['icons'] . '/' . $name;
        if (!file_exists($filepath)) {
          file_put_contents($filepath, base64_decode($base64));
          if (!getimagesize($filepath)) {
            unlink($filepath);
          }
        }
      }
      $editor->iconpath = $cpath['tokened'] . '/icons';
    }
  }

  //library files
  if (isset($editor->library)) {
    if (empty($editor->library)) {
      $editor->librarypath = '';
    }
    else {
      $files = array();
      foreach ($editor->library as $tokenpath => $content) {
        if (strpos($tokenpath, '://')) {//external
          $files[] = $tokenpath;
          continue;
        }
        $filepath = bueditor_path_tr($tokenpath);
        if (file_exists($filepath)) {
          $files[] = $tokenpath;
        }
        elseif (isset($cpath) && $content) {
          $filename = basename($filepath);
          file_put_contents($cpath['library'] . '/' . $filename, $content);
          $files[] = $cpath['tokened'] . '/' . $filename;
        }
      }
      $editor->librarypath = implode("\n", $files);
    }
  }

  //set defaults for unset properties
  foreach ($default as $key => $value) {
    if (!isset($editor->$key)) {
      $editor->$key = $value;
    }
  }

  //get rid of some unwanted or possibly big variables
  unset($editor->custom_path, $editor->buttons, $editor->library, $editor->icons);
  // New buttons shall replace the old ones.
  if (!empty($editor->id)) {
    $config = config('bueditor.editor.' . $editor->id);
    $config->clear('buttons');
  }

  //save and return the editor
  return bueditor_write_editor($editor, $buttons);
}

/**
 * Grab buttons from an imported editor data.
 */
function bueditor_grab_imported_buttons($editor) {
  $buttons = array();
  if (!isset($editor->buttons) || !is_array($editor->buttons) || empty($editor->buttons)) {
    return $buttons;
  }
  foreach ($editor->buttons as $button) {
    if (isset($button['title']) && $button['title']) {
      $buttons[] = (object) $button;
    }
  }
  return $buttons;
}

/**
 * Prepare and execute if there is any valid editor operation that doesn't require form submission.
 */
function bueditor_eop() {
  if (!isset($_GET['eop']) || !isset($_GET['token'])) {
    //Add editor name prompt for copy and add_default operations.
    //Confirm editor deletion without going to the confirmation page.
    return backdrop_add_js(backdrop_get_path('module', 'bueditor') . '/admin/bueditor.eop.js', array('preprocess' => FALSE));
  }
  if (backdrop_valid_token($_GET['token'], date('ymd'))) {
    $editors = bueditor_editors('all');
    $eop = $_GET['eop'];
    $name = isset($_GET['name']) ? check_plain($_GET['name']) : '';
    $editor = isset($_GET['id']) && isset($editors[$_GET['id']]) ? $editors[$_GET['id']] : NULL;
    if ($editor) {
      switch ($eop) {
        case 'delete':
          bueditor_eop_delete($editor);
          break;
        case 'export':
          bueditor_eop_export($editor);
          break;
      }
    }
  }
  backdrop_goto('admin/config/content/bueditor');
}

/**
 * Editor delete operation. Mimics editor delete form submission.
 */
function bueditor_eop_delete($editor) {
  $form = $form_state = array();
  $form_state['build_info']['args'][0] = $editor;
  bueditor_delete_form_submit($form, $form_state);
  return $editor;
}

/**
 * Editor export operation. Export the editor as text.
 */
function bueditor_eop_export($editor) {
  bueditor_export_text(bueditor_varexport_editor($editor), str_replace(' ', '.', $editor->name) . '.bueditor.txt');
}

/**
 * Generate an importable editor string including icon and library files.
 */
function bueditor_varexport_editor($editor) {
  $editor = (array) $editor;
  $library = $editor['librarypath'];
  $iconpath = bueditor_path_tr($editor['iconpath']);
  $buepath = backdrop_get_path('module', 'bueditor');

  //include buttons
  $editor['buttons'] = bueditor_exportable_buttons(bueditor_buttons($editor['id']));

  //include icons if they are not in default icon directory.
  $editor['icons'] = array();
  if ($iconpath != $buepath . '/icons') {
    foreach (bueditor_icons($iconpath) as $name => $value) {
      $editor['icons'][$name] = base64_encode(file_get_contents($iconpath . '/' . $name));
    }
  }

  //include library files if they are not in default library directory.
  $editor['library'] = array();
  $buelib = $buepath . '/library';
  foreach (bueditor_get_library($library) as $key => $filepath) {
    $editor['library'][$key] = $buelib == dirname($filepath) || strpos($key, '://') ? '' : file_get_contents($filepath);
  }

  unset($editor['id'], $editor['librarypath'], $editor['spritename']);
  return var_export($editor, TRUE);
}

/**
 * Make buttons exportable by converting them into arrays.
 */
function bueditor_exportable_buttons($buttons) {
  $new_buttons = array();
  if (is_array($buttons)) {
    foreach ($buttons as $bid => $button) {
      unset($button->bid, $button->id);
      $new_buttons[] = (array) $button;
    }
  }
  return $new_buttons;
}

/**
 * Execute the given code to get editor data.
 */
function bueditor_exec_editor_code($code) {
  $editor = eval('return ' . $code . ';');
  if (is_array($editor)) {
    return (object) $editor;
  }
  return FALSE;
}

/**
 * Update/insert an editor.
 */
function bueditor_write_editor($editor, array $buttons) {
  if (isset($editor->spriteon) && $editor->spriteon) {
    include_once BACKDROP_ROOT . '/' . backdrop_get_path('module', 'bueditor') . '/admin/bueditor.sprite.inc';
    $editor->spritename = bueditor_sprite($editor, $buttons);
  } else {
    $editor->spritename = '';
  }

  $config = config('bueditor.editor.' . $editor->id);
  $config->set('name',$editor->name);
  $config->set('id',$editor->id);
  $config->set('pages',$editor->pages);
  $config->set('excludes',$editor->excludes);
  $config->set('iconpath',$editor->iconpath);
  $config->set('librarypath',$editor->librarypath);
  $config->set('spriteon',$editor->spriteon);
  $config->set('spritename',$editor->spritename);

  // Use the array key as bid since they're unique
  foreach ($buttons as $k => $button) {
    //$button->id = $editor->id;
    $button->bid = $k;
  }

  $config->set('buttons',$buttons);
  $config->save();

  return $editor;
}

/**
 * Load icons in the path
 */
function bueditor_icons($path) {
  $icons = file_scan_directory($path, '/\.(png|gif|jpg)$/', array('recurse' => FALSE, 'key' => 'filename'));
  array_walk($icons, function(&$value) {
    $value = 1;
  });
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
    $broles = config_get('bueditor.settings', 'bueditor_roles');
    $broles['anonymous']['weight'] = 12;
    $broles['authenticated']['weight'] = 11;
    foreach ($roles as $rid => $name) {
      $sorted[$rid] = array(
        'name' => $name,
        'weight' => isset($broles[$rid]['weight']) ? $broles[$rid]['weight'] : 0,
        'editor' => isset($broles[$rid]['editor']) ? $broles[$rid]['editor'] : 0,
        'alt' => isset($broles[$rid]['alt']) ? $broles[$rid]['alt'] : 0,
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
  return $r1['weight'] -$r2['weight'];
}

/**
 * Return update state for an object to be used with backdrop_write_record.
 */
function bueditor_isupdate($obj, $key) {
  return isset($obj->$key) && is_numeric($obj->$key) && $obj->$key > 0 ? array($key) : array();
}

/**
 * Default values of a new editor.
 */
function bueditor_editor_defaults($name = '') {
  return (object) array(
    'name' => $name,
    'pages' => "node/*\ncomment/*",
    'excludes' => "edit-log\nedit-menu-description",
    'iconpath' => '%BUEDITOR/icons',
    'librarypath' => '%BUEDITOR/library/bue.min.default.js',
    'spriteon' => 0,
    'spritename' => '',
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
    'weight' => 0,
  );
}

/**
 * Load buttons by ids.
 */
function bueditor_buttons_by_id(array $bids, $id) {

  $get_buttons = config_get('bueditor.editor.' . $id, 'buttons');
  // Sort by weight then title.
  backdrop_sort($get_buttons, array(
    'weight' => SORT_NUMERIC,
    'title' => SORT_STRING,
  ));

  $buttons = array();
  $bids_keys = array_combine(array_values($bids), array_values($bids));
  foreach ($get_buttons as $button) {
    if (array_key_exists($button['bid'], $bids_keys)) {
      $buttons[$button['bid']] = (object) $button;
    }
  }
  return empty($bids) ? array() : $buttons;
}

/**
 * Sends the text to the client.
 */
function bueditor_export_text($text, $filename) {
  backdrop_add_http_header('Content-Type', 'text/plain; charset=utf-8');
  backdrop_add_http_header('Content-Disposition', 'attachment; filename=' . $filename);
  print $text;
  exit();
}

/**
 * Set editor addition message.
 */
function bueditor_message_added($name) {
  backdrop_set_message(t('Editor %name has been added.', array('%name' => $name)));
}

/**
 * Allow quick import of predefined editors by ajax.
 */
function bueditor_set_quick_import() {
  $path = backdrop_get_path('module', 'bueditor');
  $setting['BUE']['imp'] = array(
    'editors' => bueditor_importable_names(),
    'dir' => $path . '/import/',
  );
  backdrop_add_js($path . '/admin/bueditor.import.js', array('preprocess' => FALSE));
  backdrop_add_js($setting, 'setting');
}

/**
 * Return the list of importable editor names.
 */
function bueditor_importable_names() {
  return array('default', 'bbcode', 'commenter', 'lab');
}

/**
 * Import an editor from 'bueditor/import' directory.
 */
function bueditor_import_by_name($name, $ename = '') {
  $file = backdrop_get_path('module', 'bueditor') . '/import/' . $name . '.bueditor.txt';
  if ($code = file_get_contents($file)) {
    if ($editor = bueditor_exec_editor_code($code)) {
      $editor->id = $name;
      if ($ename) {
        $editor->name = $ename;
      }
      return bueditor_save_import($editor);
    }
  }
  return FALSE;
}

/**
 * Import all from 'bueditor/import' directory.
 */
function bueditor_import_all() {
  foreach (bueditor_importable_names() as $name) {
    bueditor_import_by_name($name);
  }
}
